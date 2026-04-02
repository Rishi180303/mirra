import { extractGarment } from "./garment-extractor";
import { injectTryOnButton, cleanupButtons } from "./button-injector";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scan() {
  const garment = extractGarment();
  if (garment) {
    injectTryOnButton(garment);
  }
}

function debouncedScan() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(scan, 500);
}

// Initial scan after page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scan);
} else {
  scan();
}

// Watch for dynamic content changes (SPAs)
const observer = new MutationObserver((mutations) => {
  const hasRelevantChanges = mutations.some(
    (m) => m.addedNodes.length > 0 || m.type === "attributes"
  );
  if (hasRelevantChanges) {
    debouncedScan();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["src", "data-src", "data-original"],
});

// Handle SPA navigation
const originalPushState = history.pushState.bind(history);
const originalReplaceState = history.replaceState.bind(history);

history.pushState = (...args) => {
  originalPushState(...args);
  cleanupButtons();
  debouncedScan();
};

history.replaceState = (...args) => {
  originalReplaceState(...args);
  cleanupButtons();
  debouncedScan();
};

window.addEventListener("popstate", () => {
  cleanupButtons();
  debouncedScan();
});
