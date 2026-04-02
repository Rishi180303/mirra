# Mirra

A Chrome extension that lets you see how clothes look on you before buying them online.

You upload a photo of yourself, browse any clothing site, and hit "Try It On." The extension grabs the garment image, sends it along with your photo to FASHN.ai, and hands back a realistic composite in about 5-8 seconds.

## How it works

1. Upload a full-body photo of yourself (stored locally in the extension)
2. Browse a clothing product page (Zara, H&M, Nike, Amazon, etc.)
3. Hover over the product image — a "Try It On" button appears
4. Click it, hit Generate in the side panel, and wait a few seconds

The AI swaps the clothes in your photo with the garment from the page. The output looks like a real photo, not a 3D render or cartoon.

## Stack

- Chrome Extension (Manifest V3)
- React + TypeScript + Tailwind
- Vite for builds
- FASHN.ai API for virtual try-on inference

## Setup

```bash
git clone https://github.com/Rishi180303/mirra.git
cd mirra
npm install
npm run build
```

Then load `dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

You'll need a FASHN.ai API key. Sign up at [fashn.ai](https://fashn.ai) — you get 10 free credits. Enter the key in the extension's settings panel.

## Features

- Garment detection on product pages (JSON-LD, Open Graph, DOM heuristics)
- Works on SPAs (MutationObserver + history API interception)
- Side panel UI that persists across page navigation
- Result history
- Manual garment URL input for sites where auto-detection misses
- Speed mode toggle (fast/balanced/quality)
