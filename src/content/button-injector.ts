import type { ExtractedGarment } from "./garment-extractor";

const GARMENT_DETECTED = "GARMENT_DETECTED";

const INJECTED_ATTR = "data-vton-injected";

export function injectTryOnButton(garment: ExtractedGarment) {
  // Find the product image element to attach the button to
  const targetImage = garment.element || findImageByUrl(garment.imageUrl);
  if (!targetImage) return;
  if (targetImage.hasAttribute(INJECTED_ATTR)) return;

  targetImage.setAttribute(INJECTED_ATTR, "true");

  // Ensure parent is positioned
  const parent = targetImage.parentElement;
  if (!parent) return;

  const parentPosition = getComputedStyle(parent).position;
  if (parentPosition === "static") {
    parent.style.position = "relative";
  }

  // Create button
  const btn = document.createElement("button");
  btn.className = "vton-try-on-btn";
  btn.textContent = "Try It On";
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    chrome.runtime.sendMessage({
      type: GARMENT_DETECTED,
      payload: {
        imageUrl: garment.imageUrl,
        title: garment.title,
        category: garment.category,
      },
    });
  });

  parent.appendChild(btn);
}

function findImageByUrl(url: string): HTMLImageElement | null {
  const images = document.querySelectorAll<HTMLImageElement>("img");
  for (const img of images) {
    const src = img.currentSrc || img.src || img.dataset.src;
    if (src && (src === url || src.includes(new URL(url).pathname))) {
      return img;
    }
  }
  return null;
}

export function cleanupButtons() {
  document.querySelectorAll(".vton-try-on-btn").forEach((btn) => btn.remove());
  document.querySelectorAll(`[${INJECTED_ATTR}]`).forEach((el) => el.removeAttribute(INJECTED_ATTR));
}
