import { create } from 'zustand';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import useAuthStore from './authStore';
import { io } from 'socket.io-client';

let socket;

const useDocumentStore = create((set, get) => ({
  documents: [],
  currentDocument: null,
  isLoading: false,

  connectSocket: () => {
    if (!socket) {
      socket = io(API_URL);
      socket.on('receive_document_changes', (content) => {
        const { currentDocument } = get();
        if (currentDocument) {
          // Update the current document's content in state
          set({ currentDocument: { ...currentDocument, content } });
        }
      });
    }
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  fetchDocuments: async (workspaceId) => {
    const { user } = useAuthStore.getState();
    if (!user || !workspaceId) return;

    set({ isLoading: true });
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/documents/workspace/${workspaceId}`, config);
      
      set({ 
        documents: data, 
        currentDocument: data[0] || null,
        isLoading: false 
      });

      if (data[0] && socket) {
        socket.emit('join_document', data[0]._id);
      }
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },

  createDocument: async (workspaceId, title) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${API_URL}/api/documents`, { workspaceId, title }, config);
      
      set({ 
        documents: [data, ...get().documents],
        currentDocument: data
      });
      
      if (socket) {
        socket.emit('join_document', data._id);
      }
    } catch (error) {
      console.error(error);
    }
  },

  setCurrentDocument: (document) => {
    set({ currentDocument: document });
    if (socket && document) {
      socket.emit('join_document', document._id);
    }
  },

  updateDocumentContent: (content) => {
    const { currentDocument } = get();
    const { user } = useAuthStore.getState();
    if (!currentDocument || !user) return;

    // Optimistic UI update
    set({ currentDocument: { ...currentDocument, content } });

    // Broadcast to others
    if (socket) {
      socket.emit('send_document_changes', {
        documentId: currentDocument._id,
        content
      });
    }

    // Debounced API save
    if (get().saveTimeout) {
      clearTimeout(get().saveTimeout);
    }

    const timeout = setTimeout(async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put(`${API_URL}/api/documents/${currentDocument._id}`, { content }, config);
      } catch (error) {
        console.error(error);
      }
    }, 1000);

    set({ saveTimeout: timeout });
  },

  updateDocumentTitle: async (documentId, title) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Optimistic UI
    set((state) => {
      const documents = state.documents.map(d => d._id === documentId ? { ...d, title } : d);
      const currentDocument = state.currentDocument?._id === documentId ? { ...state.currentDocument, title } : state.currentDocument;
      return { documents, currentDocument };
    });

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/documents/${documentId}`, { title }, config);
    } catch (error) {
      console.error(error);
    }
  },

  deleteDocument: async (documentId) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/api/documents/${documentId}`, config);
      
      set((state) => {
        const documents = state.documents.filter(d => d._id !== documentId);
        const currentDocument = state.currentDocument?._id === documentId ? (documents[0] || null) : state.currentDocument;
        return { documents, currentDocument };
      });
    } catch (error) {
      console.error(error);
    }
  }
}));

export default useDocumentStore;




