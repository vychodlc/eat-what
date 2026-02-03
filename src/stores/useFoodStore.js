import vibeSdk from "@alipay/weavefox-vibe-web";
import { create } from 'zustand';

const useFoodStore = create((set, get) => ({
  restaurants: [],
  categories: [],
  history: [],
  favorites: [],
  userLocation: null, // { lng, lat }
  loading: false,

  setUserLocation: (location) => set({ userLocation: location }),

  fetchCategories: async () => {
    const res = await vibeSdk.functions.get('category/list');
    if (res.success) set({ categories: res.data });
  },

  fetchRestaurants: async (params = {}) => {
    set({ loading: true });
    const res = await vibeSdk.functions.get('restaurant/list', params);
    if (res.success) set({ restaurants: res.data, loading: false });
  },

  fetchHistory: async () => {
    const res = await vibeSdk.functions.get('user/history');
    if (res.success) set({ history: res.data });
  },

  fetchFavorites: async () => {
    const res = await vibeSdk.functions.get('user/favorites');
    if (res.success) set({ favorites: res.data });
  },

  toggleFavorite: async (restaurantId) => {
    const res = await vibeSdk.functions.post('user/favorites/toggle', { restaurantId });
    if (res.success) {
      get().fetchFavorites();
      return res.action;
    }
  },

  addHistory: async (restaurantId) => {
    await vibeSdk.functions.post('user/history/add', { restaurantId });
    get().fetchHistory();
  },

  // Admin Actions
  saveRestaurant: async (data) => {
    const res = await vibeSdk.functions.post('restaurant/save', data);
    if (res.success) get().fetchRestaurants();
    return res;
  },

  deleteRestaurant: async (id) => {
    const res = await vibeSdk.functions.delete(`restaurant/${id}`);
    if (res.success) get().fetchRestaurants();
    return res;
  },

  saveCategory: async (data) => {
    const res = await vibeSdk.functions.post('category/save', data);
    if (res.success) get().fetchCategories();
    return res;
  },

  initNearbyRestaurants: async (location) => {
    const res = await vibeSdk.functions.post('restaurant/initialize-nearby', location);
    if (res.success && res.initialized) {
      await get().fetchRestaurants(location);
      await get().fetchCategories();
    }
    return res;
  },

  syncRestaurants: async (restaurants) => {
    set({ loading: true });
    try {
      const res = await vibeSdk.functions.post('restaurant/sync', { restaurants });
      if (res.success) {
        const { userLocation } = get();
        await get().fetchRestaurants(userLocation || {});
      }
      set({ loading: false });
      return res;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    const res = await vibeSdk.functions.delete(`category/${id}`);
    if (res.success) get().fetchCategories();
    return res;
  }
}));

export default useFoodStore;