import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateAndNormalizeImage } from "../functions/_lib/images.js";

function uint32(value) {
  return Uint8Array.from([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
}

function chunk(type, data = new Uint8Array()) {
  return Uint8Array.from([...uint32(data.length), ...new TextEncoder().encode(type), ...data, 0, 0, 0, 0]);
}

function png() {
  const ihdr = Uint8Array.from([...uint32(64), ...uint32(64), 8, 2, 0, 0, 0]);
  return Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, ...chunk("IHDR", ihdr), ...chunk("tEXt", new TextEncoder().encode("metadata")), ...chunk("IDAT", Uint8Array.from([0])), ...chunk("IEND")]);
}

function jpeg() {
  const appMetadata = [0xff, 0xe1, 0x00, 0x08, 1, 2, 3, 4, 5, 6];
  const sof = [0xff, 0xc0, 0x00, 0x0b, 8, 0, 64, 0, 64, 1, 1, 0x11, 0];
  const scan = [0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0, 1, 2, 3, 0xff, 0xd9];
  return Uint8Array.from([0xff, 0xd8, ...appMetadata, ...sof, ...scan]);
}

test("valid PNG uploads are accepted and ancillary metadata is removed", () => {
  const original = png();
  const image = validateAndNormalizeImage(original);
  assert.equal(image.mimeType, "image/png");
  assert.equal(image.width, 64);
  assert.equal(image.height, 64);
  assert.equal(new TextDecoder().decode(image.normalized).includes("metadata"), false);
});

test("valid JPG uploads are accepted and APP metadata is removed", () => {
  const image = validateAndNormalizeImage(jpeg());
  assert.equal(image.mimeType, "image/jpeg");
  assert.equal(image.width, 64);
  assert.equal(image.height, 64);
  assert.equal(image.normalized.length < jpeg().length, true);
});

test("unsupported formats and oversized files are rejected", () => {
  assert.throws(() => validateAndNormalizeImage(new TextEncoder().encode("<script>alert(1)</script>")), /Only valid JPG and PNG/u);
  assert.throws(() => validateAndNormalizeImage(png(), 10), /size/u);
});

test("server-generated public and private object namespaces remain separated", () => {
  const source = fs.readFileSync("functions/api/[[path]].js", "utf8");
  assert.equal(source.includes("public-gallery/${serviceId}/${id}"), true);
  assert.equal(source.includes("private-client-uploads/${new Date()"), true);
  assert.equal(source.includes("PUBLIC_GALLERY.put"), true);
  assert.equal(source.includes("PRIVATE_UPLOADS.put"), true);
  assert.equal(source.includes("handlePrivateContent"), true);
});

test("private appointment uploads allow only one current-look and one inspiration photo", () => {
  const source = fs.readFileSync("functions/api/[[path]].js", "utf8");
  const client = fs.readFileSync("index.html", "utf8");
  assert.equal(source.includes('PRIVATE_UPLOAD_TYPES = Object.freeze(["current_look", "inspiration"])'), true);
  assert.equal(source.includes("if (uploadIds.length > 2)"), true);
  assert.equal(source.includes('form.getAll(item.field)'), true);
  assert.equal(source.includes("claim_token_hash"), true);
  assert.equal(client.includes('accept="image/jpeg,image/png"'), true);
  assert.equal(client.includes("Maximum two photos: one current-look photo and one inspiration photo."), true);
  assert.equal(client.includes('href="tel:+15015220061">501-522-0061</a>'), true);
});
