"""U2Net architecture for salient object detection / garment segmentation."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBnRelu(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, dilation: int = 1):
        super().__init__()
        self.conv = nn.Conv2d(in_ch, out_ch, 3, padding=dilation, dilation=dilation)
        self.bn = nn.BatchNorm2d(out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.relu(self.bn(self.conv(x)))


class RSU7(nn.Module):
    """Residual U-block with 7 levels."""

    def __init__(self, in_ch: int, mid_ch: int, out_ch: int):
        super().__init__()
        self.conv_in = ConvBnRelu(in_ch, out_ch)

        self.enc1 = ConvBnRelu(out_ch, mid_ch)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc2 = ConvBnRelu(mid_ch, mid_ch)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc3 = ConvBnRelu(mid_ch, mid_ch)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc4 = ConvBnRelu(mid_ch, mid_ch)
        self.pool4 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc5 = ConvBnRelu(mid_ch, mid_ch)
        self.pool5 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc6 = ConvBnRelu(mid_ch, mid_ch)

        self.bottleneck = ConvBnRelu(mid_ch, mid_ch, dilation=2)

        self.dec6 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec5 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec4 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec3 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec2 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec1 = ConvBnRelu(mid_ch * 2, out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_in = self.conv_in(x)

        e1 = self.enc1(x_in)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))
        e4 = self.enc4(self.pool3(e3))
        e5 = self.enc5(self.pool4(e4))
        e6 = self.enc6(self.pool5(e5))

        b = self.bottleneck(e6)

        d6 = self.dec6(torch.cat([b, e6], dim=1))
        d5 = self.dec5(torch.cat([_upsample_like(d6, e5), e5], dim=1))
        d4 = self.dec4(torch.cat([_upsample_like(d5, e4), e4], dim=1))
        d3 = self.dec3(torch.cat([_upsample_like(d4, e3), e3], dim=1))
        d2 = self.dec2(torch.cat([_upsample_like(d3, e2), e2], dim=1))
        d1 = self.dec1(torch.cat([_upsample_like(d2, e1), e1], dim=1))

        return d1 + x_in


class RSU6(nn.Module):
    """Residual U-block with 6 levels."""

    def __init__(self, in_ch: int, mid_ch: int, out_ch: int):
        super().__init__()
        self.conv_in = ConvBnRelu(in_ch, out_ch)

        self.enc1 = ConvBnRelu(out_ch, mid_ch)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc2 = ConvBnRelu(mid_ch, mid_ch)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc3 = ConvBnRelu(mid_ch, mid_ch)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc4 = ConvBnRelu(mid_ch, mid_ch)
        self.pool4 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc5 = ConvBnRelu(mid_ch, mid_ch)

        self.bottleneck = ConvBnRelu(mid_ch, mid_ch, dilation=2)

        self.dec5 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec4 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec3 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec2 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec1 = ConvBnRelu(mid_ch * 2, out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_in = self.conv_in(x)

        e1 = self.enc1(x_in)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))
        e4 = self.enc4(self.pool3(e3))
        e5 = self.enc5(self.pool4(e4))

        b = self.bottleneck(e5)

        d5 = self.dec5(torch.cat([b, e5], dim=1))
        d4 = self.dec4(torch.cat([_upsample_like(d5, e4), e4], dim=1))
        d3 = self.dec3(torch.cat([_upsample_like(d4, e3), e3], dim=1))
        d2 = self.dec2(torch.cat([_upsample_like(d3, e2), e2], dim=1))
        d1 = self.dec1(torch.cat([_upsample_like(d2, e1), e1], dim=1))

        return d1 + x_in


class RSU5(nn.Module):
    """Residual U-block with 5 levels."""

    def __init__(self, in_ch: int, mid_ch: int, out_ch: int):
        super().__init__()
        self.conv_in = ConvBnRelu(in_ch, out_ch)

        self.enc1 = ConvBnRelu(out_ch, mid_ch)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc2 = ConvBnRelu(mid_ch, mid_ch)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc3 = ConvBnRelu(mid_ch, mid_ch)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc4 = ConvBnRelu(mid_ch, mid_ch)

        self.bottleneck = ConvBnRelu(mid_ch, mid_ch, dilation=2)

        self.dec4 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec3 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec2 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec1 = ConvBnRelu(mid_ch * 2, out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_in = self.conv_in(x)

        e1 = self.enc1(x_in)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))
        e4 = self.enc4(self.pool3(e3))

        b = self.bottleneck(e4)

        d4 = self.dec4(torch.cat([b, e4], dim=1))
        d3 = self.dec3(torch.cat([_upsample_like(d4, e3), e3], dim=1))
        d2 = self.dec2(torch.cat([_upsample_like(d3, e2), e2], dim=1))
        d1 = self.dec1(torch.cat([_upsample_like(d2, e1), e1], dim=1))

        return d1 + x_in


class RSU4(nn.Module):
    """Residual U-block with 4 levels."""

    def __init__(self, in_ch: int, mid_ch: int, out_ch: int):
        super().__init__()
        self.conv_in = ConvBnRelu(in_ch, out_ch)

        self.enc1 = ConvBnRelu(out_ch, mid_ch)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc2 = ConvBnRelu(mid_ch, mid_ch)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.enc3 = ConvBnRelu(mid_ch, mid_ch)

        self.bottleneck = ConvBnRelu(mid_ch, mid_ch, dilation=2)

        self.dec3 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec2 = ConvBnRelu(mid_ch * 2, mid_ch)
        self.dec1 = ConvBnRelu(mid_ch * 2, out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_in = self.conv_in(x)

        e1 = self.enc1(x_in)
        e2 = self.enc2(self.pool1(e1))
        e3 = self.enc3(self.pool2(e2))

        b = self.bottleneck(e3)

        d3 = self.dec3(torch.cat([b, e3], dim=1))
        d2 = self.dec2(torch.cat([_upsample_like(d3, e2), e2], dim=1))
        d1 = self.dec1(torch.cat([_upsample_like(d2, e1), e1], dim=1))

        return d1 + x_in


class RSU4F(nn.Module):
    """RSU4 with dilated convolutions instead of pooling (for small feature maps)."""

    def __init__(self, in_ch: int, mid_ch: int, out_ch: int):
        super().__init__()
        self.conv_in = ConvBnRelu(in_ch, out_ch)

        self.enc1 = ConvBnRelu(out_ch, mid_ch)
        self.enc2 = ConvBnRelu(mid_ch, mid_ch, dilation=2)
        self.enc3 = ConvBnRelu(mid_ch, mid_ch, dilation=4)

        self.bottleneck = ConvBnRelu(mid_ch, mid_ch, dilation=8)

        self.dec3 = ConvBnRelu(mid_ch * 2, mid_ch, dilation=4)
        self.dec2 = ConvBnRelu(mid_ch * 2, mid_ch, dilation=2)
        self.dec1 = ConvBnRelu(mid_ch * 2, out_ch)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x_in = self.conv_in(x)

        e1 = self.enc1(x_in)
        e2 = self.enc2(e1)
        e3 = self.enc3(e2)

        b = self.bottleneck(e3)

        d3 = self.dec3(torch.cat([b, e3], dim=1))
        d2 = self.dec2(torch.cat([d3, e2], dim=1))
        d1 = self.dec1(torch.cat([d2, e1], dim=1))

        return d1 + x_in


def _upsample_like(src: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    return F.interpolate(src, size=target.shape[2:], mode="bilinear", align_corners=False)


class U2Net(nn.Module):
    """Full U2Net architecture."""

    def __init__(self, in_ch: int = 3, out_ch: int = 1):
        super().__init__()

        # Encoder
        self.stage1 = RSU7(in_ch, 32, 64)
        self.pool1 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage2 = RSU6(64, 32, 128)
        self.pool2 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage3 = RSU5(128, 64, 256)
        self.pool3 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage4 = RSU4(256, 128, 512)
        self.pool4 = nn.MaxPool2d(2, stride=2, ceil_mode=True)
        self.stage5 = RSU4F(512, 256, 512)
        self.pool5 = nn.MaxPool2d(2, stride=2, ceil_mode=True)

        # Bottleneck
        self.stage6 = RSU4F(512, 256, 512)

        # Decoder
        self.stage5d = RSU4F(1024, 256, 512)
        self.stage4d = RSU4(1024, 128, 256)
        self.stage3d = RSU5(512, 64, 128)
        self.stage2d = RSU6(256, 32, 64)
        self.stage1d = RSU7(128, 16, 64)

        # Side output convolutions
        self.side1 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side2 = nn.Conv2d(64, out_ch, 3, padding=1)
        self.side3 = nn.Conv2d(128, out_ch, 3, padding=1)
        self.side4 = nn.Conv2d(256, out_ch, 3, padding=1)
        self.side5 = nn.Conv2d(512, out_ch, 3, padding=1)
        self.side6 = nn.Conv2d(512, out_ch, 3, padding=1)

        # Fuse all side outputs
        self.fuse = nn.Conv2d(out_ch * 6, out_ch, 1)

    def forward(self, x: torch.Tensor) -> list[torch.Tensor]:
        # Encoder
        s1 = self.stage1(x)
        s2 = self.stage2(self.pool1(s1))
        s3 = self.stage3(self.pool2(s2))
        s4 = self.stage4(self.pool3(s3))
        s5 = self.stage5(self.pool4(s4))
        s6 = self.stage6(self.pool5(s5))

        # Decoder
        s5d = self.stage5d(torch.cat([_upsample_like(s6, s5), s5], dim=1))
        s4d = self.stage4d(torch.cat([_upsample_like(s5d, s4), s4], dim=1))
        s3d = self.stage3d(torch.cat([_upsample_like(s4d, s3), s3], dim=1))
        s2d = self.stage2d(torch.cat([_upsample_like(s3d, s2), s2], dim=1))
        s1d = self.stage1d(torch.cat([_upsample_like(s2d, s1), s1], dim=1))

        # Side outputs
        d1 = self.side1(s1d)
        d2 = _upsample_like(self.side2(s2d), d1)
        d3 = _upsample_like(self.side3(s3d), d1)
        d4 = _upsample_like(self.side4(s4d), d1)
        d5 = _upsample_like(self.side5(s5d), d1)
        d6 = _upsample_like(self.side6(s6), d1)

        d0 = self.fuse(torch.cat([d1, d2, d3, d4, d5, d6], dim=1))

        return [torch.sigmoid(d0), torch.sigmoid(d1), torch.sigmoid(d2),
                torch.sigmoid(d3), torch.sigmoid(d4), torch.sigmoid(d5),
                torch.sigmoid(d6)]
