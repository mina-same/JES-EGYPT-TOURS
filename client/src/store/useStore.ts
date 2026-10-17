// src/store/useStore.ts
import { create } from "zustand";

interface StoreState {
  searchPopupStatus: boolean;
  mobileDrawerStatus: boolean;
  mobileDrawerTwoStatus: boolean;
  /** The mobile language & currency sheet (SitePreferences). */
  preferencesSheetStatus: boolean;
  changeSearchPopupStatus: () => void;
  changeMobileDrawerStatus: () => void;
  changeMobileDrawerTwoStatus: () => void;
  setMobileDrawerTwoStatus: (status: boolean) => void;
  setMobileDrawerStatus: (status: boolean) => void;
  setPreferencesSheetStatus: (status: boolean) => void;
}

const useStore = create<StoreState>((set) => ({
  searchPopupStatus: false,
  mobileDrawerStatus: false,
  mobileDrawerTwoStatus: false,
  preferencesSheetStatus: false,
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
  setPreferencesSheetStatus: (status: boolean) =>
    set(() => ({ preferencesSheetStatus: status })),
}));

export default useStore;
