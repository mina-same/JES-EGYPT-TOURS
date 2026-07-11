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
  // changeMobileDrawerStatus: () =>
  //   set((state) => ({ mobileDrawerStatus: !state.mobileDrawerStatus })),
  changeMobileDrawerStatus: () =>
    set((state) => {
      const newStatus = !state.mobileDrawerStatus;
      console.log("mobileDrawerStatus changed to:", newStatus);
      return { mobileDrawerStatus: newStatus };
    }),
  changeMobileDrawerTwoStatus: () =>
    set((state) => {
      const newStatus = !state.mobileDrawerTwoStatus;
      console.log("mobileDrawerStatus changed to:", newStatus);
      return { mobileDrawerTwoStatus: newStatus };
    }),
  setMobileDrawerTwoStatus: (status: boolean) =>
    set(() => ({ mobileDrawerTwoStatus: status })),
  setMobileDrawerStatus: (status: boolean) =>
    set(() => ({ mobileDrawerStatus: status })),
}));

export default useStore;
