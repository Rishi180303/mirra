"""Fashionpedia dataset loader for garment segmentation.

Expected directory structure:
    data/
    ├── train2020/                              # Training images (.jpg)
    └── instances_attributes_train2020.json     # COCO-format annotations with polygon masks

Download from:
    Images: https://s3.amazonaws.com/ifashionist-dataset/images/train2020.zip
    Annotations: https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_train2020.json

The JSON uses COCO format with polygon segmentation masks across 27 apparel categories.
We merge all masks per image into a single binary mask: garment (1) vs background (0).
"""

from __future__ import annotations

import json
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw
import torch
from torch.utils.data import Dataset
import torchvision.transforms as T


def polygon_to_mask(polygons: list, height: int, width: int) -> np.ndarray:
    """Convert COCO polygon annotations to a binary mask."""
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    for poly in polygons:
        if isinstance(poly, list) and len(poly) >= 6:
            points = [(poly[i], poly[i + 1]) for i in range(0, len(poly), 2)]
            draw.polygon(points, fill=255)
    return np.array(mask)


class FashionpediaDataset(Dataset):
    """
    Loads Fashionpedia dataset in COCO format.

    Args:
        data_dir: Path to data/ folder containing train2020/ and annotations JSON
        image_size: Resize images and masks to this square size
        max_samples: Limit number of samples (None = use all)
    """

    def __init__(self, data_dir: str, image_size: int = 320, max_samples: int | None = None):
        self.data_dir = Path(data_dir)
        self.image_size = image_size
        # Support both folder names (train2020 from zip, or train if renamed)
        if (self.data_dir / "train2020").exists():
            self.image_dir = self.data_dir / "train2020"
        else:
            self.image_dir = self.data_dir / "train"

        # Load COCO annotations
        ann_file = self.data_dir / "instances_attributes_train2020.json"
        print(f"Loading annotations from {ann_file}...")
        with open(ann_file) as f:
            coco = json.load(f)

        # Build image id -> info mapping
        self.images = {img["id"]: img for img in coco["images"]}

        # Group annotations by image id (only keep ones with segmentation)
        self.ann_by_image: dict[int, list] = {}
        for ann in coco["annotations"]:
            seg = ann.get("segmentation", [])
            if not seg:
                continue
            img_id = ann["image_id"]
            if img_id not in self.ann_by_image:
                self.ann_by_image[img_id] = []
            self.ann_by_image[img_id].append(seg)

        # Only keep images that have annotations and exist on disk
        self.image_ids = []
        for iid in self.ann_by_image:
            if iid in self.images:
                fname = self.images[iid]["file_name"]
                if (self.image_dir / fname).exists():
                    self.image_ids.append(iid)

        if max_samples and max_samples < len(self.image_ids):
            self.image_ids = self.image_ids[:max_samples]

        print(f"Loaded {len(self.image_ids)} images with segmentation masks")

        self.img_transform = T.Compose([
            T.Resize((image_size, image_size)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def __len__(self) -> int:
        return len(self.image_ids)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        img_id = self.image_ids[idx]
        img_info = self.images[img_id]

        # Load image
        img_path = self.image_dir / img_info["file_name"]
        image = Image.open(img_path).convert("RGB")
        w, h = image.size

        # Merge all annotation polygons into a single binary mask
        mask = np.zeros((h, w), dtype=np.uint8)
        for seg_polygons in self.ann_by_image[img_id]:
            poly_mask = polygon_to_mask(seg_polygons, h, w)
            mask = np.maximum(mask, poly_mask)

        # Transform image
        image_tensor = self.img_transform(image)

        # Resize mask
        mask_pil = Image.fromarray(mask)
        mask_pil = mask_pil.resize((self.image_size, self.image_size), Image.BILINEAR)
        mask_tensor = torch.from_numpy(np.array(mask_pil)).float() / 255.0
        mask_tensor = mask_tensor.unsqueeze(0)  # (1, H, W)

        return image_tensor, mask_tensor
