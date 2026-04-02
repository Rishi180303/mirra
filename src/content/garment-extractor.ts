export interface ExtractedGarment {
  imageUrl: string;
  title?: string;
  category?: "tops" | "bottoms" | "one-pieces";
  element?: HTMLImageElement;
}

export function extractGarment(): ExtractedGarment | null {
  return extractFromJsonLd() ?? extractFromMetaTags() ?? extractFromDom();
}

function extractFromJsonLd(): ExtractedGarment | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      const products = findProducts(data);

      for (const product of products) {
        const imageUrl = extractProductImage(product);
        if (imageUrl) {
          return {
            imageUrl: resolveUrl(imageUrl),
            title: (product.name as string) || undefined,
            category: guessCategory(String(product.name || ""), String(product.category || "")),
          };
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  return null;
}

function findProducts(data: unknown): Array<Record<string, unknown>> {
  const products: Array<Record<string, unknown>> = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      products.push(...findProducts(item));
    }
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj["@type"] === "Product" || obj["@type"] === "ClothingStore") {
      products.push(obj);
    }
    if (obj["@graph"] && Array.isArray(obj["@graph"])) {
      products.push(...findProducts(obj["@graph"]));
    }
  }

  return products;
}

function extractProductImage(product: Record<string, unknown>): string | null {
  const img = product.image;
  if (typeof img === "string") return img;
  if (Array.isArray(img) && typeof img[0] === "string") return img[0];
  if (Array.isArray(img) && img[0] && typeof img[0] === "object") {
    const imgObj = img[0] as Record<string, unknown>;
    if (typeof imgObj.url === "string") return imgObj.url;
    if (typeof imgObj.contentUrl === "string") return imgObj.contentUrl;
  }
  if (img && typeof img === "object") {
    const imgObj = img as Record<string, unknown>;
    if (typeof imgObj.url === "string") return imgObj.url;
    if (typeof imgObj.contentUrl === "string") return imgObj.contentUrl;
  }
  return null;
}

function extractFromMetaTags(): ExtractedGarment | null {
  const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  if (!ogImage?.content) return null;

  const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');

  return {
    imageUrl: resolveUrl(ogImage.content),
    title: ogTitle?.content || undefined,
    category: guessCategory(ogTitle?.content || "", document.title),
  };
}

function extractFromDom(): ExtractedGarment | null {
  const images = Array.from(document.querySelectorAll<HTMLImageElement>("img"));

  // Score images by likelihood of being the main product image
  const candidates = images
    .filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width >= 200 && rect.height >= 200;
    })
    .map((img) => {
      let score = 0;
      const rect = img.getBoundingClientRect();

      // Larger images score higher
      score += Math.min(rect.width * rect.height / 10000, 50);

      // Images in product-related containers score higher
      const container = img.closest("[class*='product'], [class*='gallery'], [class*='main-image'], [id*='product'], [class*='pdp'], main, [role='main']");
      if (container) score += 30;

      // Portrait aspect ratio (clothing images tend to be portrait)
      if (rect.height > rect.width) score += 10;

      // Prefer images near the top of the page
      if (rect.top < window.innerHeight) score += 20;

      return { img, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];
  if (!best) return null;

  const src = best.img.currentSrc || best.img.src || best.img.dataset.src || best.img.dataset.original;
  if (!src) return null;

  return {
    imageUrl: resolveUrl(src),
    title: best.img.alt || undefined,
    element: best.img,
    category: guessCategory(best.img.alt || "", document.title),
  };
}

function guessCategory(...texts: string[]): "tops" | "bottoms" | "one-pieces" | undefined {
  const combined = texts.join(" ").toLowerCase();

  const topKeywords = ["shirt", "top", "blouse", "tee", "t-shirt", "hoodie", "sweater", "jacket", "coat", "polo", "tank", "cardigan", "vest"];
  const bottomKeywords = ["jeans", "pants", "trousers", "shorts", "skirt", "leggings", "chinos", "joggers"];
  const dressKeywords = ["dress", "jumpsuit", "romper", "overall", "onesie", "suit", "bodysuit"];

  if (dressKeywords.some((k) => combined.includes(k))) return "one-pieces";
  if (bottomKeywords.some((k) => combined.includes(k))) return "bottoms";
  if (topKeywords.some((k) => combined.includes(k))) return "tops";

  return undefined;
}

function resolveUrl(url: string): string {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}
