import vibeSdk from "@alipay/weavefox-vibe-web";
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  userInfo: null,
  isAdmin: false,
  loading: true,

  init: async () => {
    try {
      const userRes = await vibeSdk.getUserInfo();
      const adminRes = await vibeSdk.functions.get('admin/check');
      set({ 
        userInfo: userRes.data.userInfo, 
        isAdmin: adminRes.isAdmin,
        loading: false 
      });
    } catch (error) {
      console.error('Auth init failed:', error);
      set({ loading: false });
    }
  }
}));

export default useAuthStore;