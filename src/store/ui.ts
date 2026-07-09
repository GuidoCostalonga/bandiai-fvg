import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global UI state (client-only). Uses Zustand with localStorage persistence for
 * preferences that should survive reloads. Server data lives in TanStack Query,
 * not here — this store is strictly ephemeral/UI concerns.
 */
const MAX_COMPARE = 3

interface UiState {
  commandPaletteOpen: boolean
  /** Slugs of bandi selected for side-by-side comparison (max 3). */
  compareSlugs: string[]
  setCommandPalette: (open: boolean) => void
  toggleCompare: (slug: string) => void
  isComparing: (slug: string) => boolean
  clearCompare: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      commandPaletteOpen: false,
      compareSlugs: [],
      setCommandPalette: (open) => set({ commandPaletteOpen: open }),
      toggleCompare: (slug) => {
        const slugs = get().compareSlugs
        if (slugs.includes(slug)) {
          set({ compareSlugs: slugs.filter((x) => x !== slug) })
        } else {
          // Keep the most recent selections when exceeding the cap.
          set({ compareSlugs: [...slugs, slug].slice(-MAX_COMPARE) })
        }
      },
      isComparing: (slug) => get().compareSlugs.includes(slug),
      clearCompare: () => set({ compareSlugs: [] }),
    }),
    { name: 'bandiai-ui', partialize: (s) => ({ compareSlugs: s.compareSlugs }) },
  ),
)

export const COMPARE_LIMIT = MAX_COMPARE
