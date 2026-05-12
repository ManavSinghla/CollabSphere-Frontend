import { create } from 'zustand';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('userInfo')) || null,
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed',
        isLoading: false 
      });
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, { name, email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      set({ user: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false 
      });
    }
  },

  logout: () => {
    localStorage.removeItem('userInfo');
    set({ user: null });
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`${API_URL}/api/auth/profile`, profileData, config);
      localStorage.setItem('userInfo', JSON.stringify(data));
      set({ user: data, isLoading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Update failed',
        isLoading: false 
      });
      throw error;
    }
  }
}));

export default useAuthStore;




