// src/store/useStore.ts
import { create } from "zustand";

interface StoreState {
  searchPopupStatus: boolean;
  mobileDrawerStatus: boolean;
  mobileDrawerTwoStatus: boolean;
  changeSearchPopupStatus: () => void;
  changeMobileDrawerStatus: () => void;
  changeMobileDrawerTwoStatus: () => void;
  setMobileDrawerTwoStatus: (status: boolean) => void;
  setMobileDrawerStatus: (status: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
  searchPopupStatus: false,
  mobileDrawerStatus: false,
  mobileDrawerTwoStatus: false,
  changeSearchPopupStatus: () =>
    set((state) => ({ searchPopupStatus: !state.searchPopupStatus })),
  changeMobileDrawerStatus: () =>
    set((state) => ({
      mobileDrawerStatus: !state.mobileDrawerStatus,
    })),
  changeMobileDrawerTwoStatus: () =>
    set((state) => ({
      mobileDrawerTwoStatus: !state.mobileDrawerTwoStatus,
    })),
  setMobileDrawerTwoStatus: (status: boolean) =>
    set(() => ({ mobileDrawerTwoStatus: status })),
  setMobileDrawerStatus: (status: boolean) =>
    set(() => ({ mobileDrawerStatus: status })),
}));

export default useStore;
