import { create } from 'zustand'

type pageLoaderStore = {
  isLoading: boolean
  showLoader: () => void
  hideLoader: () => void
}

export const usePageLoaderStore = create<pageLoaderStore>((set) => ({
  isLoading: false,
  showLoader: () => set({ isLoading: true }),
  hideLoader: () => set({ isLoading: false }),
}))
