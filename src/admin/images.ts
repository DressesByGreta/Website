/**
 * Photographs are prepared in the browser before they leave the phone: oriented, resized to the
 * shop's widths, encoded as WebP, plus a 20px stand-in shown while the real image loads. The Worker
 * only checks and stores. Browsers that cannot write WebP from a canvas (iPhone Safari) encode with
 * libwebp compiled to WebAssembly (@jsquash/webp), fetched the first time a photo is added and only
 * by those browsers; if it cannot load (no connection), the photo goes up as JPEG, as before.
 */
import { PHOTO_MAX_BYTES, PHOTO_WIDTHS, VIDEO_MAX_BYTES } from '../shared/catalog';

export interface Prepared {
  meta: { w: number; h: number; lqip: string; ext: 'webp' | 'jpg'; widths: number[] };
  blobs: { width: number; blob: Blob }[];
  preview: string;
}

let webp: Promise<boolean> | null = null;
function canEncodeWebp(): Promise<boolean> {
  webp ??= new Promise((resolve) => {
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    c.toBlob((b) => resolve(!!b && b.type === 'image/webp'), 'image/webp', 0.8);
  });
  return webp;
}

function draw(src: ImageBitmap, width: number): HTMLCanvasElement {
  const height = Math.round((src.height * width) / src.width);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, width, height);
  return c;
}

/** libwebp in WebAssembly, for browsers whose canvas cannot write WebP; null when it cannot load. */
type WasmEncode = (data: ImageData, options: { quality: number }) => Promise<ArrayBuffer>;
let wasm: Promise<WasmEncode | null> | null = null;
function wasmWebp(): Promise<WasmEncode | null> {
  wasm ??= import('@jsquash/webp/encode')
    .then(async (m) => {
      const encode = m.default as WasmEncode;
      // one tiny encode proves the module compiled and runs here
      await encode(new ImageData(2, 2), { quality: 80 });
      return encode;
    })
    .catch(() => {
      wasm = null; // try again next time (it may have been the connection)
      return null;
    });
  return wasm;
}

const pixels = (c: HTMLCanvasElement): ImageData => c.getContext('2d')!.getImageData(0, 0, c.width, c.height);

const toBlob = (c: HTMLCanvasElement, type: string, q: number) =>
  new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), type, q));

/** Sequins and lace at 2400 px can come out heavy (JPEG on iPhone): step the quality down until the
 *  file fits what the Worker stores. */
async function encode(c: HTMLCanvasElement, type: string, viaWasm: WasmEncode | null): Promise<Blob> {
  for (const q of [0.82, 0.72, 0.62]) {
    const blob = viaWasm ? new Blob([await viaWasm(pixels(c), { quality: q * 100 })], { type: 'image/webp' }) : await toBlob(c, type, q);
    if (blob.size <= PHOTO_MAX_BYTES) return blob;
  }
  throw new Error('too_big');
}

export async function prepare(file: File): Promise<Prepared> {
  if (!file.type.startsWith('image/')) throw new Error('not_image');
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    if (bmp.width < 400) throw new Error('too_small');
    const native = await canEncodeWebp();
    const viaWasm = native ? null : await wasmWebp();
    const ext = native || viaWasm ? 'webp' : 'jpg';
    const type = ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const widths = [...new Set(PHOTO_WIDTHS.map((w) => Math.min(w, bmp.width)))].sort((a, b) => a - b);
    const blobs: { width: number; blob: Blob }[] = [];
    for (const width of widths) blobs.push({ width, blob: await encode(draw(bmp, width), type, viaWasm) });
    // the 20px stand-in is a data URL; a canvas that cannot write WebP writes it as JPEG (both are allowed)
    const lqip = draw(bmp, 20).toDataURL(native ? 'image/webp' : 'image/jpeg', 0.4);
    return {
      meta: { w: bmp.width, h: bmp.height, lqip, ext, widths },
      blobs,
      preview: URL.createObjectURL(blobs[0]!.blob),
    };
  } finally {
    bmp.close();
  }
}

export function toForm(p: Prepared): FormData {
  const f = new FormData();
  f.set('meta', JSON.stringify(p.meta));
  for (const { width, blob } of p.blobs) f.set(`w${width}`, blob, `w${width}.${p.meta.ext}`);
  return f;
}

/**
 * A dress's video before it leaves the phone: an MP4 (the iPhone's MOV is the same container) or a
 * WebM, at most 15MB and 30 seconds, that this browser can play (if it cannot, the shop's visitors
 * may not either). Its poster is the frame half a second in, prepared like a photograph.
 */
export async function prepareVideo(file: File): Promise<{ form: FormData; preview: string }> {
  const type = file.type || (/\.webm$/i.test(file.name) ? 'video/webm' : /\.(mp4|m4v|mov)$/i.test(file.name) ? 'video/mp4' : '');
  const ext = type === 'video/webm' ? 'webm' : /^video\/(mp4|quicktime|x-m4v)$/.test(type) ? 'mp4' : null;
  if (!ext) throw new Error('not_video');
  if (file.size > VIDEO_MAX_BYTES) throw new Error('video_too_big');
  const url = URL.createObjectURL(file);
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('video_unplayable')), 15_000);
      v.addEventListener('loadeddata', () => (window.clearTimeout(timer), resolve()), { once: true });
      v.addEventListener('error', () => (window.clearTimeout(timer), reject(new Error('video_unplayable'))), { once: true });
    });
    if (!v.videoWidth || !v.videoHeight) throw new Error('video_unplayable');
    if (v.duration > 30.5) throw new Error('video_too_long');
    await new Promise<void>((resolve) => {
      v.addEventListener('seeked', () => resolve(), { once: true });
      v.currentTime = Math.min(0.5, (v.duration || 1) / 2);
    });
    const scale = Math.min(1, 1600 / v.videoWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    const png = await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/png'));
    const poster = await prepare(new File([png], 'poster.png', { type: 'image/png' }));
    const form = toForm(poster);
    form.set('video', file, `clip.${ext}`);
    form.set('ext', ext);
    form.set('w', String(v.videoWidth));
    form.set('h', String(v.videoHeight));
    return { form, preview: poster.preview };
  } finally {
    URL.revokeObjectURL(url);
    v.removeAttribute('src');
    v.load();
  }
}
