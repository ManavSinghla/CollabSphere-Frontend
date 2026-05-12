import { create } from 'zustand';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import useAuthStore from './authStore';
import { io } from 'socket.io-client';

let socket;

const useChatStore = create((set, get) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  isLoading: false,

  connectSocket: () => {
    if (!socket) {
      socket = io(API_URL);
      socket.on('receive_message', (message) => {
        const { currentChannel, messages } = get();
        if (currentChannel && message.channelId === currentChannel._id) {
          set({ messages: [...messages, message] });
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

  fetchChannels: async (workspaceId) => {
    const { user } = useAuthStore.getState();
    if (!user || !workspaceId) return;

    set({ isLoading: true });
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/channels/${workspaceId}`, config);
      
      set({ 
        channels: data, 
        currentChannel: data[0] || null,
        isLoading: false 
      });

      if (data[0]) {
        get().fetchMessages(data[0]._id);
      }
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
    }
  },

  createChannel: async (workspaceId, name, type = 'public') => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${API_URL}/api/channels`, { workspaceId, name, type }, config);
      
      set({ 
        channels: [...get().channels, data],
        currentChannel: data
      });
      get().fetchMessages(data._id);
    } catch (error) {
      console.error(error);
    }
  },

  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });
    get().fetchMessages(channel._id);
  },

  fetchMessages: async (channelId) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    if (socket) {
      socket.emit('join_channel', channelId);
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/messages/${channelId}`, config);
      set({ messages: data });
    } catch (error) {
      console.error(error);
    }
  },

  sendMessage: (text, attachments = []) => {
    const { currentChannel } = get();
    const { user } = useAuthStore.getState();
    if (!currentChannel || !user || !socket || (!text.trim() && attachments.length === 0)) return;

    socket.emit('send_message', {
      channelId: currentChannel._id,
      senderId: user._id,
      text,
      attachments
    });
  }
}));

export default useChatStore;




