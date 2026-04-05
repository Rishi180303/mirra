# Mirra

A Chrome extension that lets you see how clothes look on you before buying them online.

Drag a garment image from any clothing site into the side panel, hit "Try It On," and the AI generates a photo of your avatar wearing that exact garment.

## How it works

1. Open the Mirra side panel (click the extension icon)
2. Your predefined avatar is displayed
3. Drag a garment image from any website into the drop zone (or paste a URL)
4. Select the category (Top / Bottom / Dress)
5. Click "Try It On" — the AI generates your avatar wearing the garment

## Stack

- Chrome Extension (Manifest V3)
- React + TypeScript + Tailwind
- Vite for builds
- Google Gemini API (Nano Banana Pro) for image generation

## Setup

```bash
git clone https://github.com/Rishi180303/mirra.git
cd mirra
npm install
```

Create a `.env` file with your Gemini API key:

```
VITE_GEMINI_API_KEY=your_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com) → Get API Key → Create API Key.

Place your avatar image at `public/avatar.png`, then:

```bash
npm run build
```

Load `dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

## Features

- Drag-and-drop garment capture from any website
- Manual garment URL input as fallback
- Predefined avatar for consistent results
- Result history (last 20 generations)
- Minimal luxury UI aesthetic
