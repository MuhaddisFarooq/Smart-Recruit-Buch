import { create } from 'zustand'

type navStore = {
    navMenu: []
    getNavMenu: () => void
    setNavMenu: (menu:any) => void
  }
  
  export const useNavStore = create<navStore>((set, get) => ({
    navMenu: [],
    getNavMenu: () => get().navMenu,
    setNavMenu: (menu:any) => set({ navMenu: menu }),
  }))
  