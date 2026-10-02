"""The home hero photograph, enlarged for large screens.

Source: the cover of Dresses by Greta's own Reel instagram.com/p/DY9bizxtu_f (1216 x 2160,
raw/DY9bizxtu_f_0.jpg), the same photograph Luca supplied in chat on 2026-10-01 (that copy was
only 825 px wide). Real-ESRGAN general-x4v3 (SRVGGNetCompact) enlarges it 4x on the CPU in tiles;
the result is reduced to 2x with Lanczos and blended 70/30 with a plain Lanczos 2x, which keeps
the model's sharpness (eyes, lace, rings, leaves) but softens its airbrushed skin and contrast.
tools/hero-variants.py then makes the web sizes.

  uv venv sr && uv pip install --python sr/Scripts/python.exe torch --index-url https://download.pytorch.org/whl/cpu
  uv pip install --python sr/Scripts/python.exe numpy pillow safetensors
  weights: https://huggingface.co/OzzyGT/RealESRGAN_general_x4v3/resolve/main/model.safetensors
  sr/Scripts/python.exe tools/hero-upscale.py <weights.safetensors> [raw/DY9bizxtu_f_0.jpg] [raw/hero-garden-x2.png]
"""

import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from safetensors.torch import load_file


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.upscale = upscale
        self.body = nn.ModuleList()
        self.body.append(nn.Conv2d(num_in_ch, num_feat, 3, 1, 1))
        self.body.append(nn.PReLU(num_parameters=num_feat))
        for _ in range(num_conv):
            self.body.append(nn.Conv2d(num_feat, num_feat, 3, 1, 1))
            self.body.append(nn.PReLU(num_parameters=num_feat))
        self.body.append(nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1))
        self.upsampler = nn.PixelShuffle(upscale)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.upscale, mode="nearest")


weights = sys.argv[1]
src = sys.argv[2] if len(sys.argv) > 2 else "raw/DY9bizxtu_f_0.jpg"
dst = sys.argv[3] if len(sys.argv) > 3 else "raw/hero-garden-x2.png"
AI_SHARE = 0.7

net = SRVGGNetCompact()
net.load_state_dict(load_file(weights), strict=True)
net.eval()
torch.set_num_threads(4)

photo = Image.open(src).convert("RGB")
W, H = photo.size
x = torch.from_numpy(np.asarray(photo).astype(np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0)
S, TILE, PAD = 4, 256, 12
out = torch.zeros(1, 3, H * S, W * S)
t0 = time.time()
with torch.no_grad():
    for ty in range(0, H, TILE):
        for tx in range(0, W, TILE):
            y0, x0 = max(ty - PAD, 0), max(tx - PAD, 0)
            y1, x1 = min(ty + TILE + PAD, H), min(tx + TILE + PAD, W)
            o = net(x[:, :, y0:y1, x0:x1])
            # keep the tile's own area; the padding only gave its borders context
            oy, ox = (ty - y0) * S, (tx - x0) * S
            th, tw = min(TILE, H - ty) * S, min(TILE, W - tx) * S
            out[:, :, ty * S:ty * S + th, tx * S:tx * S + tw] = o[:, :, oy:oy + th, ox:ox + tw]
ai = (out.squeeze(0).permute(1, 2, 0).clamp(0, 1).numpy() * 255.0).round().astype(np.uint8)
ai2 = np.asarray(Image.fromarray(ai).resize((W * 2, H * 2), Image.LANCZOS)).astype(np.float32)
plain2 = np.asarray(photo.resize((W * 2, H * 2), Image.LANCZOS)).astype(np.float32)
mix = np.clip(ai2 * AI_SHARE + plain2 * (1 - AI_SHARE), 0, 255).round().astype(np.uint8)
Image.fromarray(mix).save(dst)
print("wrote", dst, W * 2, H * 2, f"{time.time() - t0:.0f}s")
