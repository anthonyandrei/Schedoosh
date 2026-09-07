export type WallpaperPresetId =
  | "desktop"
  | "tablet-landscape"
  | "phone"
  | "tall-phone"
  | "tablet-portrait";

export interface WallpaperPreset {
  id: WallpaperPresetId;
  label: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait";
}

export const WALLPAPER_PRESETS: readonly WallpaperPreset[] = [
  {
    id: "desktop",
    label: "Desktop (16:9)",
    width: 2560,
    height: 1440,
    orientation: "landscape",
  },
  {
    id: "tablet-landscape",
    label: "Tablet (4:3)",
    width: 2048,
    height: 1536,
    orientation: "landscape",
  },
  {
    id: "phone",
    label: "Phone (9:16)",
    width: 1080,
    height: 1920,
    orientation: "portrait",
  },
  {
    id: "tall-phone",
    label: "Tall Phone (9:21)",
    width: 1080,
    height: 2520,
    orientation: "portrait",
  },
  {
    id: "tablet-portrait",
    label: "Tablet (3:4)",
    width: 1536,
    height: 2048,
    orientation: "portrait",
  },
];

export function getWallpaperPreset(id: WallpaperPresetId): WallpaperPreset {
  const preset = WALLPAPER_PRESETS.find((item) => item.id === id);

  if (!preset) {
    throw new Error(`Unknown wallpaper preset: ${id}`);
  }

  return preset;
}

export function getWallpaperComposition(id: WallpaperPresetId) {
  const { orientation } = getWallpaperPreset(id);
  const isMobile = orientation === "portrait";

  return {
    isMobile,
    showOverview: !isMobile,
  };
}
