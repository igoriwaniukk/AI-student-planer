// Downscales an image file to a small square-ish JPEG data URL, so a
// profile photo (often several MB straight off a phone) doesn't blow up
// localStorage the way the raw file would.
export function resizeImageToDataURL(file, maxDim = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('invalid-image'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale) || 1;
        const h = Math.round(img.height * scale) || 1;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
