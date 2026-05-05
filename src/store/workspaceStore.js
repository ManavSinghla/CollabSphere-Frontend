import { create } from 'zustand';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import useAuthStore from './authStore';

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const { data } = await axios.get(`${API_URL}/api/workspaces`, config);
      set({ 
        workspaces: data, 
        currentWorkspace: get().currentWorkspace || data[0] || null,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to load workspaces',
        isLoading: false 
      });
    }
  },

  createWorkspace: async (name) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const { data } = await axios.post(`${API_URL}/api/workspaces`, { name }, config);
      
      const newWorkspaces = [...get().workspaces, data];
      set({ 
        workspaces: newWorkspaces,
        currentWorkspace: data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create workspace',
        isLoading: false 
      });
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  }
}));

export default useWorkspaceStore;




