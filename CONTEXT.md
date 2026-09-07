# Schedoosh Context

## Domain overview

Schedoosh turns a class schedule into an interactive calendar and downloadable schedule wallpapers. Wallpaper settings must affect Preview, Copy, and Download consistently.

## Ubiquitous language

### Schedule wallpaper

An image generated from the current schedule and the settings in the Download Schedule dialog. The selected aspect ratio, background, transparency, and clock spacing apply equally to Preview, Copy, and Download.

### Desktop wallpaper

A landscape schedule wallpaper that includes the calendar, schedule overview, and Schedoosh branding.

### Phone wallpaper

A portrait schedule wallpaper at 1080 x 1920. It contains the calendar, mobile background treatment, optional clock spacing, and Schedoosh branding. It does not contain the desktop schedule overview.

### Tall phone wallpaper

A portrait schedule wallpaper at 1080 x 2520 with the same composition rules as a phone wallpaper.

### Preview

A lower-resolution rendering of the selected wallpaper configuration. While open, it updates automatically after a setting changes. The previous preview remains visible while its replacement renders.

## Product rules

- Preview, Copy, and Download use one serialized rendering pipeline so concurrent captures cannot produce stale output.
- The aspect-ratio labels describe output orientation: Phone is 9:16 and Tall Phone is 9:21.
- The current Schedoosh logo appears in navigation, desktop and phone wallpaper exports, and the browser favicon.
- Runtime logo assets should be optimized derivatives rather than the large source artwork.
