# Mirra: Replicate IDM-VTON Pivot — Implementation Notes

> Context document for future agents working on this codebase.

**What was done:** Replaced Fashn AI as primary virtual try-on provider with Replicate's `cuuupid/idm-vton` model. Added multi-pose body photo management with MoveNet pose detection stored in IndexedDB. Kept Fashn as automatic fallback.

---

## Project Overview

Mirra is a Chrome Extension (Manifest V3) for AI-powered virtual clothing try-on. Users upload body photos, browse product pages, and get photorealistic diffusion-based try-on results overlaid on their body.

**Tech stack:** Vite 8 + React 19 + TypeScript + Tailwind CSS 4. No test framework.

**Build:** `npm run build` → `tsc && vite build && cp content.css`. Load `dist/` as unpacked extension in Chrome.

---

## Architecture

```
src/
├── background/
│   ├── background.ts          # Message dispatcher, provider fallback logic
│   ├── replicate-provider.ts  # Primary: cuuupid/idm-vton via Replicate API
│   └── fashn-provider.ts      # Fallback: tryon-v1.6 via Fashn AI API
├── content/
│   ├── content.ts             # DOM observer, SPA navigation hooks
│   ├── garment-extractor.ts   # Product image detection (JSON-LD → OG tags → DOM heuristics)
│   ├── button-injector.ts     # "Try It On" button placement on product images
│   └── content.css            # Button styling
├── services/
│   └── body-manager.ts        # IndexedDB storage (localForage), MoveNet pose detection
├── shared/
│   ├── types.ts               # GarmentInfo, BodyPhoto, PoseType, TryOnProvider, ReplicatePrediction
│   ├── messages.ts            # Message type constants (GARMENT_DETECTED, TRY_ON_REQUEST, etc.)
│   └── storage.ts             # chrome.storage wrappers (history, garment, provider, speed mode)
├── sidepanel/
│   ├── App.tsx                # Main component, wires BodyManager + message listeners
│   ├── index.tsx              # React root
│   ├── styles.css             # Tailwind + Inter font
│   └── components/
│       ├── BodyProfile.tsx    # Three-slot photo upload (front/side/back) with pose mismatch detection
│       ├── GarmentPreview.tsx # Detected garment display
│       ├── ManualGarmentInput.tsx  # URL paste fallback
│       ├── TryOnResult.tsx    # Result image + download
│       ├── StatusBar.tsx      # Loading/error states
│       └── HistoryGallery.tsx # Previous results grid
├── shims/
│   └── mediapipe-pose.ts     # Stub for @mediapipe/pose (see Gotchas)
└── workers/                   # (removed — pose detection runs on main thread)
```

---

## Provider System

Both providers implement the same interface (duck-typed, not a formal abstraction):

```ts
tryOn(payload: {
  personImage: string;      // base64 data URL
  garmentImageUrl: string;  // URL from product page
  category?: string;        // "tops" | "bottoms" | "one-pieces"
}) → Promise<{ resultImage: string; processingTime: number }>
```

**Dispatch flow in background.ts:**
1. Read active provider from `chrome.storage.sync` (default: `"replicate"`)
2. Call primary provider
3. On failure, automatically retry with fallback provider
4. On both failing, send `TRY_ON_ERROR` to sidepanel

**Category mapping (Replicate):** Our types use `"tops"/"bottoms"/"one-pieces"`, Replicate expects `"upper_body"/"lower_body"/"dresses"` — mapped in `replicate-provider.ts`.

**Replicate model version:** Pinned at `906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f`. Check for updates at `cuuupid/idm-vton` on Replicate if results degrade.

**API tokens:** Build-time injected via `import.meta.env.VITE_REPLICATE_API_TOKEN` and `VITE_FASHN_API_KEY` from `.env`. Both defined in `vite.config.ts`.

---

## Body Photo Management

**Storage:** IndexedDB via localForage (instance: `mirra`, store: `body_photos`). NOT chrome.storage — 5MB limit and syncs to Google (privacy concern with body photos).

**Pose slots:** `body_front`, `body_side`, `body_back` — each stores `{ image: string, pose: PoseType, keypoints: Keypoint[], timestamp: number }`.

**Pose detection:** MoveNet Lightning via `@tensorflow-models/pose-detection`. Runs on main thread (~100ms per image, fine for single uploads). Classifies based on shoulder/hip/nose keypoint visibility.

**Auto-select:** `getBestPhotoForCategory()` currently returns front photo regardless of garment category. Designed to be extended for category-specific pose selection.

**Migration:** On first load, `migrateFromChromeStorage()` moves any existing `personImage` from chrome.storage.local into IndexedDB as the front pose, then deletes the old entry.

---

## Message Protocol

All communication uses `chrome.runtime.sendMessage` with `{ type, payload }` shape:

| Message | Direction | Payload |
|---------|-----------|---------|
| `GARMENT_DETECTED` | content → background → sidepanel | `GarmentInfo` |
| `TRY_ON_REQUEST` | sidepanel → background | `{ personImage, garmentImageUrl, category }` |
| `TRY_ON_RESULT` | background → sidepanel | `{ resultImage, processingTime, provider }` |
| `TRY_ON_ERROR` | background → sidepanel | `{ error }` |

---

## Known Gotchas

1. **@mediapipe/pose bundling:** `@tensorflow-models/pose-detection` imports `@mediapipe/pose` which doesn't export correctly with Vite/Rolldown. Fixed with an alias shim in `vite.config.ts` → `src/shims/mediapipe-pose.ts`. If upgrading TF.js packages, check if this is still needed.

2. **Bundle size:** Sidepanel JS is ~1.3MB due to TF.js. Could be optimized with `import()` to lazy-load pose detection only when uploading photos.

3. **Replicate cold starts:** First inference can take 10-30s if the model is cold. Subsequent calls are ~8s. The polling logic in `replicate-provider.ts` handles this with 180s timeout.

4. **Content script image detection:** Works on most stores but can fail on heavy SPAs. The MutationObserver + history API hooks in `content.ts` handle most cases. Store-specific hardcoded patterns (e.g., Uniqlo image URL structure) are not yet implemented.

5. **No test framework:** Tests are not set up. Add vitest if testing is needed — it integrates well with the existing Vite config.

---

## Design Aesthetic

Minimal luxury: Inter font (300-400 weight), uppercase labels with wide tracking (0.1-0.35em), 8-11px font sizes, black/white/neutral palette, smooth transitions (300-500ms). All UI changes must match this style.

---

## Future Phases (from user's roadmap)

### Phase 2: Body Management Enhancements (not yet started)
- Store-specific garment URL patterns (Uniqlo, Zara, ASOS)
- Background removal for messy photo backgrounds (MODNet)
- Better garment preprocessing (remove bg, straighten)

### Phase 3: Polish & UX (not yet started)
- Compare mode (side-by-side original vs on-body)
- Fit adjustment slider (canvas scale transform)
- Multi-garment compositing (shirt + pants, two API calls)
- Result caching (`garment_hash + body_hash → cached result`)
- Size recommendation from pose keypoint measurements
- Self-hosting on RunPod for unlimited tries
- Progressive loading (low-res preview → high-res)
