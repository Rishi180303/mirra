# Mirra

A Chrome extension that lets you see how clothes look on you before buying them online.

Browse any clothing site, drag garments into the extension, and the AI generates a photo of your avatar wearing the outfit — powered by a custom garment segmentation neural network and Google's Gemini image generation.

## How it works

1. Open the Mirra side panel (click the extension icon)
2. Drag garment images from any website into the collection grid (up to 4 pieces)
3. Enter the dressing room and select which pieces to try on
4. The garment image is processed through a U2Net segmentation model to isolate the clothing from backgrounds and logos
5. The clean garment cutout + your avatar are sent to Gemini to generate a photorealistic try-on image
6. Mix and match — select multiple pieces to generate full outfits

## Architecture

```
Browser (drag image) → Chrome Extension (React sidepanel)
                          ↓
              Local Python server (FastAPI)
              U2Net garment segmentation
              (PyTorch, trained on Fashionpedia dataset)
                          ↓
              Clean garment cutout (transparent PNG)
                          ↓
              Google Gemini API (Nano Banana Pro)
              Avatar + garment → try-on image
                          ↓
              Result displayed in sidepanel
```

## Stack

**Extension:**
- Chrome Extension (Manifest V3)
- React 19 + TypeScript + Tailwind CSS
- Vite for builds

**Segmentation Server:**
- Python + FastAPI + uvicorn
- PyTorch with MPS (Apple Silicon) support
- U2Net architecture — trained on Fashionpedia dataset (45k fashion images with per-pixel segmentation masks)
- Salient object detection for garment isolation

**Image Generation:**
- Google Gemini API (Nano Banana Pro / gemini-3-pro-image-preview)
- Multi-image input: avatar + segmented garment(s) → photorealistic try-on

## Setup

### Extension

```bash
git clone https://github.com/Rishi180303/mirra.git
cd mirra
npm install
```

Create a `.env` file:

```
VITE_GEMINI_API_KEY=your_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com).

Place your avatar image at `public/avatar.png`, then:

```bash
npm run build
```

Load `dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

### Segmentation Server

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Download pretrained U2Net weights or train on Fashionpedia:

```bash
# Option A: Train from scratch on Fashionpedia dataset
# Download dataset from https://fashionpedia.github.io/home/
# Place in server/training/data/
python training/train.py --samples 5000 --epochs 25

# Option B: Use pretrained salient object detection weights
# Download u2net.pth from https://github.com/xuebinqin/U-2-Net
# Place at server/models/u2net_pretrained.pth
```

Start the server:

```bash
uvicorn main:app --port 8000
```

The extension works with or without the server — if the server isn't running, garment images are sent to Gemini without segmentation.

## Training

The segmentation model is a U2Net trained on the [Fashionpedia dataset](https://fashionpedia.github.io/home/) (45,623 images with per-pixel segmentation masks across 27 apparel categories). Training merges all categories into a binary mask (garment vs background).

```bash
cd server
source venv/bin/activate
python training/train.py --samples 5000 --epochs 25 --batch-size 8
python training/evaluate.py  # Evaluate IoU and pixel accuracy
```

On Apple Silicon (M-series), training 5k samples for 25 epochs takes ~4 hours using the MPS backend.
