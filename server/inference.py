"""Garment segmentation inference pipeline."""

import io
import base64
from pathlib import Path

import numpy as np
import torch
from PIL import Image
import torchvision.transforms as T

from model import U2Net

IMAGE_SIZE = 320

# Preprocessing transform (same as training)
transform = T.Compose([
    T.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def load_model(model_path: str, device: torch.device) -> U2Net:
    model = U2Net(in_ch=3, out_ch=1).to(device)
    state_dict = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()
    return model


def segment_garment(model: U2Net, image: Image.Image, device: torch.device) -> Image.Image:
    """
    Takes a product image, returns a clean garment cutout on transparent background.
    """
    original_size = image.size  # (w, h)

    # Preprocess
    input_tensor = transform(image).unsqueeze(0).to(device)

    # Inference
    with torch.no_grad():
        predictions = model(input_tensor)
        mask = predictions[0].squeeze().cpu().numpy()  # Fused output

    # Resize mask back to original size
    mask_pil = Image.fromarray((mask * 255).astype(np.uint8))
    mask_pil = mask_pil.resize(original_size, Image.BILINEAR)

    # Threshold
    mask_arr = np.array(mask_pil)
    mask_binary = (mask_arr > 128).astype(np.uint8) * 255

    # Apply mask to original image -> RGBA with transparent background
    image_rgba = image.convert("RGBA")
    alpha = Image.fromarray(mask_binary, mode="L")
    image_rgba.putalpha(alpha)

    return image_rgba


def image_from_base64(data: str) -> Image.Image:
    """Decode a base64 string (with or without data URL prefix) to PIL Image."""
    if "," in data:
        data = data.split(",", 1)[1]
    raw = base64.b64decode(data)
    return Image.open(io.BytesIO(raw)).convert("RGB")


def image_to_base64(image: Image.Image) -> str:
    """Encode a PIL Image to base64 PNG data URL."""
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"
