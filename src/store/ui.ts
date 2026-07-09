import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global UI state (client-only). Uses Zustand with localStorage persistence for
 * preferences that should survive reloads. Server data lives in TanStack Query,
 * not here — this store is strictly ephemeral/UI concerns.
 */
interface UiState {
  commandPaletteOpen: boolean
  compareIds: string[] // bandi selected for side-by-side comparison
  setCommandPalette: (open: boolean) => void
  toggleCompare: (id: string) => void
  clearCompare: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      commandPaletteOpen: false,
      compareIds: [],
      setCommandPalette: (open) => set({ commandPaletteOpen: open }),
      toggleCompare: (id) => {
        const ids = get().compareIds
        set({
          compareIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-3),
        })
      },
      clearCompare: () => set({ compareIds: [] }),
    }),
    { name: 'bandiai-ui', partialize: (s) => ({ compareIds: s.compareIds }) },
  ),
)
