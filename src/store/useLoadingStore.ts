import { create } from 'zustand'

type LoadingStore = {
  isLoading: boolean
  showLoader: () => void
  hideLoader: () => void
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  showLoader: () => set({ isLoading: true }),
  hideLoader: () => set({ isLoading: false }),
}))
