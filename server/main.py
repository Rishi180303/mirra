"""FastAPI server for garment segmentation."""

from pathlib import Path

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from inference import load_model, segment_garment, image_from_base64, image_to_base64

# Device
if torch.backends.mps.is_available():
    device = torch.device("mps")
elif torch.cuda.is_available():
    device = torch.device("cuda")
else:
    device = torch.device("cpu")

# Load model — prefer pretrained (better on product shots), fall back to fashion-trained
models_dir = Path(__file__).parent / "models"
model_path = models_dir / "u2net_pretrained.pth"
if not model_path.exists():
    model_path = models_dir / "u2net_fashion.pth"
if not model_path.exists():
    raise FileNotFoundError(
        f"No model found in {models_dir}. "
        "Download pretrained weights or train with: python training/train.py"
    )

print(f"Loading model on {device}...")
model = load_model(str(model_path), device)
print("Model loaded.")

# App
app = FastAPI(title="Mirra Garment Segmentation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class SegmentRequest(BaseModel):
    image: str  # base64 encoded image (with or without data URL prefix)


class SegmentResponse(BaseModel):
    image: str  # base64 PNG with transparent background


@app.post("/segment", response_model=SegmentResponse)
async def segment(request: SegmentRequest):
    pil_image = image_from_base64(request.image)
    result = segment_garment(model, pil_image, device)
    result_b64 = image_to_base64(result)
    return SegmentResponse(image=result_b64)


@app.get("/health")
async def health():
    return {"status": "ok", "device": str(device)}
