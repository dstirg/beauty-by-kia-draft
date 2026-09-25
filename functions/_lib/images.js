const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function readUint32(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function concat(chunks) {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function inspectPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((value, index) => bytes[index] === value)) return null;
  const width = readUint32(bytes, 16);
  const height = readUint32(bytes, 20);
  const kept = [bytes.slice(0, 8)];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new TypeError("Invalid PNG structure.");
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (["IHDR", "PLTE", "IDAT", "IEND"].includes(type)) kept.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  return { mimeType: "image/png", extension: "png", width, height, normalized: concat(kept) };
}

function inspectJpeg(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const kept = [bytes.slice(0, 2)];
  let offset = 2;
  let width = 0;
  let height = 0;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new TypeError("Invalid JPEG structure.");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    const markerStart = offset - 1;
    offset += 1;
    if (marker === 0xd9) {
      kept.push(Uint8Array.from([0xff, 0xd9]));
      break;
    }
    if (marker === 0xda) {
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      const scanStart = markerStart;
      let scanEnd = bytes.length;
      for (let index = offset + length; index + 1 < bytes.length; index += 1) {
        if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) {
          scanEnd = index + 2;
          break;
        }
      }
      kept.push(bytes.slice(scanStart, scanEnd));
      break;
    }
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) throw new TypeError("Invalid JPEG segment.");
    const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isStartOfFrame && length >= 7) {
      height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      width = (bytes[offset + 5] << 8) | bytes[offset + 6];
    }
    if (!isMetadata) kept.push(bytes.slice(markerStart, offset + length));
    offset += length;
  }
  if (!width || !height) throw new TypeError("JPEG dimensions could not be determined.");
  return { mimeType: "image/jpeg", extension: "jpg", width, height, normalized: concat(kept) };
}

export function validateAndNormalizeImage(input, maxBytes = MAX_IMAGE_BYTES) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (!bytes.length || bytes.length > maxBytes) throw new TypeError("Image size is not allowed.");
  const result = inspectPng(bytes) || inspectJpeg(bytes);
  if (!result) throw new TypeError("Only valid JPG and PNG images are accepted.");
  if (result.width < 64 || result.height < 64 || result.width > 12000 || result.height > 12000) {
    throw new TypeError("Image dimensions are not allowed.");
  }
  return result;
}

export { MAX_IMAGE_BYTES };
