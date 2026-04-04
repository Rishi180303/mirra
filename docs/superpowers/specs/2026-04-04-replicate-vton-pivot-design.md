# Mirra: Replicate IDM-VTON Pivot + Body Management

## Overview

Replace Fashn AI as the primary virtual try-on provider with Replicate's `cuuupid/idm-vton` model for higher-quality diffusion-based results. Add multi-pose body photo management with MoveNet pose detection stored in IndexedDB. Keep Fashn as automatic fallback.

## Architecture: Approach A (Swap-in-Place)

Minimal disruption to existing wiring. Same message protocol, same content script, same UI shell. Key additions are provider dispatch in background, BodyManager service, and pose detection web worker.

---

## 1. Background Service Worker — Provider Dispatch

### New files
- `src/background/replicate-provider.ts` — wraps Replicate `cuuupid/idm-vton` model
- `src/background/fashn-provider.ts` — extracted existing Fashn logic

### Provider interface (duck-typed)
Both providers implement:
```ts
tryOn({ garmentImageUrl: string, personImage: string, category: string })
  → Promise<{ resultImage: string, processingTime: number }>
```

### background.ts changes
- Import both providers into a `PROVIDERS` map
- Active provider set via `chrome.storage.sync` (default: `replicate`)
- On failure, automatically retry with fallback provider

### Replicate API flow
1. POST `https://api.replicate.com/v1/predictions` with model `cuuupid/idm-vton`, inputs: `human_img` (base64), `garm_img` (garment URL or base64), `garment_des` (auto from category), `category` ("upper_body"/"lower_body"/"dresses")
2. Poll GET `https://api.replicate.com/v1/predictions/{id}` with escalating delay (2s, 2s, 3s, 3s, 5s repeating)
3. Return output URL on "succeeded", error on "failed"

### Token
`VITE_REPLICATE_API_TOKEN` in `.env`, build-time injection via `import.meta.env`.

---

## 2. Body Manager — Multi-Photo Storage with Pose Detection

### New files
- `src/services/BodyManager.ts` — manages body photos in IndexedDB via localForage
- `src/workers/pose.worker.ts` — runs MoveNet off main thread via Comlink

### BodyManager API
```ts
savePhoto(imageBlob: Blob, manualPose?: PoseType): Promise<void>
getPhoto(pose: PoseType): Promise<BodyPhoto | null>
getBestPhotoForCategory(category: string): Promise<BodyPhoto | null>
getAllPhotos(): Promise<Record<PoseType, BodyPhoto | null>>
deletePhoto(pose: PoseType): Promise<void>
getStoredPoses(): Promise<PoseType[]>
```

### Pose detection
- MoveNet Lightning (~3MB, <100ms per image)
- Auto-classify: both shoulders + both hips visible → "front", one shoulder occluded → "side", fallback → ask user
- Runs in web worker via Comlink for clean async API
- Keypoints stored alongside photo for future use

### IndexedDB structure
```
body_front → { image: Blob, keypoints: Keypoint[], pose: 'front', timestamp: number }
body_side  → { image: Blob, keypoints: Keypoint[], pose: 'side',  timestamp: number }
body_back  → { image: Blob, keypoints: Keypoint[], pose: 'back',  timestamp: number }
```

### Migration
Existing `personImage` in chrome.storage.local migrated to IndexedDB as `body_front` on first load, then removed from chrome.storage.

---

## 3. Sidepanel UI Changes

### New component
`BodyProfile.tsx` replaces `PhotoUpload.tsx`.

Three pose slots displayed as thumbnails or empty upload targets:
```
[Front]     [Side]      [Back]
[  img  ]   [  img  ]   [  img  ]
 saved       empty       empty
```

- Click empty slot → file picker → auto-detect pose → save
- Pose mismatch warning: "This looks like a side view — save there instead?"
- Click filled slot → view with "Remove" option
- Same minimal luxury aesthetic (uppercase labels, Inter, light weight)

### App.tsx changes
- Import BodyManager instead of chrome.storage for person image
- On "Try it on": call `BodyManager.getBestPhotoForCategory(garment.category)` → convert Blob to base64 → send to background
- If no body photo for needed pose → error: "Upload a front photo first"

### Unchanged components
GarmentPreview, ManualGarmentInput, TryOnResult, StatusBar, HistoryGallery — all carry over as-is.

---

## 4. Dependencies & Build

### New npm packages
- `localforage` — IndexedDB wrapper
- `@tensorflow-models/pose-detection` + `@tensorflow/tfjs-backend-webgl` + `@tensorflow/tfjs-core` — MoveNet
- `comlink` — web worker communication

### Vite config
- Web worker handled natively: `new Worker(new URL('./workers/pose.worker.ts', import.meta.url), { type: 'module' })`
- No additional config needed

### Manifest changes
- Add `https://api.replicate.com/*` to host_permissions
- Keep `https://api.fashn.ai/*` for fallback

### .env additions
```
VITE_REPLICATE_API_TOKEN=r8_...
```

---

## 5. Message Protocol & Type Changes

### New types
```ts
type TryOnProvider = 'replicate' | 'fashn'
type PoseType = 'front' | 'side' | 'back'
interface BodyPhoto {
  image: Blob
  keypoints: Keypoint[]
  pose: PoseType
  timestamp: number
}
```

### Message flow (unchanged pattern)
1. Content script → `GARMENT_DETECTED` (no change)
2. Sidepanel calls BodyManager → converts Blob to base64
3. Sidepanel → `TRY_ON_REQUEST` with `{personImage, garmentImageUrl, category}` (same shape)
4. Background dispatches to ReplicateProvider → on failure retries with FashnProvider
5. Background → `TRY_ON_RESULT` or `TRY_ON_ERROR` (same shape, adds `provider` field)

### Storage changes
- Remove `getPersonImage`/`setPersonImage` (migrated to BodyManager)
- Add `getActiveProvider`/`setActiveProvider` (chrome.storage.sync)
- Keep history, garment, speed mode

---

## What's NOT in MVP
- Compare mode (side-by-side)
- Fit adjustment slider
- Multi-garment compositing
- Background removal (MODNet)
- Size recommendation from measurements
- Plasmo migration
- Fabric.js canvas manipulation
- Store-specific hardcoded URL patterns
