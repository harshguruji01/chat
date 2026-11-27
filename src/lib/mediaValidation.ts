export interface MediaValidationResult {
  valid: boolean;
  detectedMime?: string;
  error?: string;
}

const MAGIC_SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ....ftyp
  { mime: 'audio/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML (webm/mkv)
];

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'msi', 'dll', 'scr', 'vbs', 'js', 'jar', 'apk', 'com', 'pif',
]);

export async function validateFileSignature(
  file: File,
  kind: 'image' | 'video' | 'document' | 'voice',
  maxSizeMb: number
): Promise<MediaValidationResult> {
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty or unreadable.' };
  }

  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File exceeds maximum allowed size (${maxSizeMb} MB).` };
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Executable or script files (.${ext}) are not permitted.` };
  }

  try {
    const slice = file.slice(0, 16);
    const buf = new Uint8Array(await slice.arrayBuffer());

    let matchedMime: string | undefined;
    for (const sig of MAGIC_SIGNATURES) {
      const off = sig.offset || 0;
      if (buf.length >= off + sig.bytes.length) {
        const ok = sig.bytes.every((b, i) => buf[off + i] === b);
        if (ok) {
          matchedMime = sig.mime;
          break;
        }
      }
    }

    if (kind === 'image' && matchedMime && !matchedMime.startsWith('image/')) {
      return { valid: false, error: 'File signature does not match a valid image format (JPEG, PNG, WebP).' };
    }

    return { valid: true, detectedMime: matchedMime || file.type };
  } catch {
    return { valid: true, detectedMime: file.type };
  }
}
