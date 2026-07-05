import type { Colorway } from '#/types/catalog'

export interface GalleryImage {
  src: string
  styleColor: string | null
}

export function buildColourwayGallery(colorways: Colorway[]): GalleryImage[] {
  const ownersByUrl = new Map<string, Set<string>>()

  for (const colorway of colorways) {
    for (const src of colorway.images) {
      if (!src) continue

      const owners = ownersByUrl.get(src) ?? new Set<string>()
      owners.add(colorway.styleColor)
      ownersByUrl.set(src, owners)
    }
  }

  return [...ownersByUrl].map(([src, owners]) => ({
    src,
    styleColor: owners.size === 1 ? [...owners][0] : null,
  }))
}
