"""Training script for U2Net garment segmentation."""

import argparse
import sys
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

# Add parent dir to path for model import
sys.path.insert(0, str(Path(__file__).parent.parent))
from model import U2Net
from training.dataset import FashionpediaDataset


def multi_loss(predictions: list[torch.Tensor], target: torch.Tensor) -> torch.Tensor:
    """Combined BCE loss across all side outputs + fused output."""
    bce = nn.BCELoss()
    total = sum(bce(pred, target) for pred in predictions)
    return total


def iou_score(pred: torch.Tensor, target: torch.Tensor, threshold: float = 0.5) -> float:
    """Compute IoU (Intersection over Union) metric."""
    pred_bin = (pred > threshold).float()
    intersection = (pred_bin * target).sum()
    union = pred_bin.sum() + target.sum() - intersection
    if union == 0:
        return 1.0
    return (intersection / union).item()


def train():
    parser = argparse.ArgumentParser(description="Train U2Net for garment segmentation")
    parser.add_argument("--samples", type=int, default=5000, help="Max training samples (default: 5000)")
    parser.add_argument("--epochs", type=int, default=25, help="Number of epochs (default: 25)")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size (default: 8)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate (default: 1e-4)")
    args = parser.parse_args()

    # Config
    data_dir = Path(__file__).parent / "data"
    model_save_path = Path(__file__).parent.parent / "models" / "u2net_fashion.pth"
    model_save_path.parent.mkdir(exist_ok=True)

    image_size = 320
    batch_size = args.batch_size
    num_epochs = args.epochs
    lr = args.lr
    val_split = 0.2

    # Device
    if torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using MPS (Apple Silicon)")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
        print("Using CUDA")
    else:
        device = torch.device("cpu")
        print("Using CPU")

    # Dataset
    print(f"Loading dataset from {data_dir} (max {args.samples} samples)...")
    dataset = FashionpediaDataset(str(data_dir), image_size=image_size, max_samples=args.samples)
    print(f"Total samples: {len(dataset)}")

    # Train/val split
    val_size = int(len(dataset) * val_split)
    train_size = len(dataset) - val_size
    train_set, val_set = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_set, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_set, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"Train: {len(train_set)}, Val: {len(val_set)}")

    # Model
    model = U2Net(in_ch=3, out_ch=1).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    # Load pretrained U2Net weights if available
    pretrained_path = Path(__file__).parent.parent / "models" / "u2net_pretrained.pth"
    if pretrained_path.exists():
        print(f"Loading pretrained weights from {pretrained_path}")
        state_dict = torch.load(pretrained_path, map_location=device, weights_only=True)
        model.load_state_dict(state_dict, strict=False)
        print("Pretrained weights loaded")

    best_val_iou = 0.0

    for epoch in range(num_epochs):
        # Training
        model.train()
        train_loss = 0.0
        start_time = time.time()

        for batch_idx, (images, masks) in enumerate(train_loader):
            images = images.to(device)
            masks = masks.to(device)

            predictions = model(images)
            loss = multi_loss(predictions, masks)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

            if (batch_idx + 1) % 50 == 0:
                avg = train_loss / (batch_idx + 1)
                print(f"  Epoch {epoch + 1}/{num_epochs}, Batch {batch_idx + 1}/{len(train_loader)}, Loss: {avg:.4f}")

        scheduler.step()
        avg_train_loss = train_loss / len(train_loader)
        elapsed = time.time() - start_time

        # Validation
        model.eval()
        val_loss = 0.0
        val_iou = 0.0

        with torch.no_grad():
            for images, masks in val_loader:
                images = images.to(device)
                masks = masks.to(device)

                predictions = model(images)
                loss = multi_loss(predictions, masks)
                val_loss += loss.item()

                # IoU on fused output (first prediction)
                val_iou += iou_score(predictions[0], masks)

        avg_val_loss = val_loss / len(val_loader)
        avg_val_iou = val_iou / len(val_loader)

        print(f"Epoch {epoch + 1}/{num_epochs} ({elapsed:.0f}s) — "
              f"Train Loss: {avg_train_loss:.4f}, "
              f"Val Loss: {avg_val_loss:.4f}, "
              f"Val IoU: {avg_val_iou:.4f}")

        # Save best model
        if avg_val_iou > best_val_iou:
            best_val_iou = avg_val_iou
            torch.save(model.state_dict(), model_save_path)
            print(f"  Saved best model (IoU: {best_val_iou:.4f})")

    print(f"\nTraining complete. Best Val IoU: {best_val_iou:.4f}")
    print(f"Model saved to: {model_save_path}")


if __name__ == "__main__":
    train()
