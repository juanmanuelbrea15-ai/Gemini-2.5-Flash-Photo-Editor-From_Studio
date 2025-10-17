import { BBox, Prop } from '../types';

const PADDING = 20;
const BG_REMOVAL_THRESHOLD = 30; // Color distance threshold

// Helper to load a file into an HTMLImageElement
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


// Main processing function
export async function processPropImage(file: File, forceRemoveBg: boolean = false): Promise<Prop> {
  const image = await loadImage(file);
  const { width, height } = image;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(image, 0, 0);
  let imageData = ctx.getImageData(0, 0, width, height);
  let backgroundRemoved = false;
  
  // Check if image already has transparency. If not, try to remove background.
  let hasTransparency = false;
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] < 255) {
      hasTransparency = true;
      break;
    }
  }

  if (forceRemoveBg || !hasTransparency) {
    const data = imageData.data;
    const bgColor = [data[0], data[1], data[2]]; // Assume top-left pixel is background

    const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) =>
      Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (colorDistance(r, g, b, bgColor[0], bgColor[1], bgColor[2]) < BG_REMOVAL_THRESHOLD) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }
    backgroundRemoved = true;
  }

  // Calculate bounding box of the non-transparent area
  const bbox = calculateBBox(imageData);

  // Add padding to the bounding box
  const paddedBBox: BBox = {
    x: Math.max(0, bbox.x - PADDING),
    y: Math.max(0, bbox.y - PADDING),
    width: Math.min(width, bbox.width + PADDING * 2),
    height: Math.min(height, bbox.height + PADDING * 2),
  };
  // Adjust width/height if padding pushed it out of bounds
  if (paddedBBox.x + paddedBBox.width > width) {
    paddedBBox.width = width - paddedBBox.x;
  }
   if (paddedBBox.y + paddedBBox.height > height) {
    paddedBBox.height = height - paddedBBox.y;
  }

  // Create a new canvas with the cropped image
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = paddedBBox.width;
  croppedCanvas.height = paddedBBox.height;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('Could not get cropped canvas context');
  
  // Put the modified image data back to the original canvas to draw from it
  ctx.putImageData(imageData, 0, 0);
  
  croppedCtx.drawImage(
    canvas,
    paddedBBox.x,
    paddedBBox.y,
    paddedBBox.width,
    paddedBBox.height,
    0,
    0,
    paddedBBox.width,
    paddedBBox.height
  );
  
  return {
    id: crypto.randomUUID(),
    src: croppedCanvas.toDataURL(),
    originalFile: file,
    width: croppedCanvas.width,
    height: croppedCanvas.height,
    bbox,
    paddedBBox,
    backgroundRemoved,
  };
}

function calculateBBox(imageData: ImageData): BBox {
  const { width, height, data } = imageData;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) { // Image is fully transparent
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
