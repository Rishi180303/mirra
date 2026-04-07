"""Evaluate trained U2Net model on validation set."""

import sys
from pathlib import Path

import torch
import numpy as np
from torch.utils.data import DataLoader, random_split

sys.path.insert(0, str(Path(__file__).parent.parent))
from model import U2Net
from training.dataset import FashionpediaDataset


def iou_score(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5) -> float:
    pred_bin = (pred > threshold).float()
    intersection = (pred_bin * target).sum()
    union = pred_bin.sum() + target.sum() - intersection
    if union == 0:
        return 1.0
    return (intersection / union).item()


def pixel_accuracy(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5) -> float:
    pred_bin = (pred > threshold).float()
    correct = (pred_bin == target).float().sum()
    total = target.numel()
    return (correct / total).item()


def evaluate():
    data_dir = Path(__file__).parent / "data"
    model_path = Path(__file__).parent.parent / "models" / "u2net_fashion.pth"

    if not model_path.exists():
        print(f"Model not found at {model_path}. Train first with: python training/train.py")
        return

    # Device
    if torch.backends.mps.is_available():
        device = torch.device("mps")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")
    print(f"Using device: {device}")

    # Dataset — use same split as training
    dataset = FashionpediaDataset(str(data_dir), image_size=320, max_samples=5000)
    val_size = int(len(dataset) * 0.2)
    train_size = len(dataset) - val_size

    # Use same seed for reproducible split
    generator = torch.Generator().manual_seed(42)
    _, val_set = random_split(dataset, [train_size, val_size], generator=generator)
    val_loader = DataLoader(val_set, batch_size=8, shuffle=False, num_workers=0)

    # Load model
    model = U2Net(in_ch=3, out_ch=1).to(device)
    state_dict = torch.load(model_path, map_location=device, weights_only=True)
    model.load_state_dict(state_dict)
    model.eval()

    print(f"Evaluating on {len(val_set)} samples...")

    ious = []
    accuracies = []

    with torch.no_grad():
        for images, masks in val_loader:
            images = images.to(device)
            masks = masks.to(device)

            predictions = model(images)
            fused = predictions[0]  # Use fused output

            for i in range(fused.shape[0]):
                ious.append(iou_score(fused[i], masks[i]))
                accuracies.append(pixel_accuracy(fused[i], masks[i]))

    mean_iou = np.mean(ious)
    mean_acc = np.mean(accuracies)

    print(f"\nResults:")
    print(f"  Mean IoU:            {mean_iou:.4f}")
    print(f"  Pixel Accuracy:      {mean_acc:.4f}")
    print(f"  Samples Evaluated:   {len(ious)}")


if __name__ == "__main__":
    evaluate()
