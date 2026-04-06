// Generates icon.png then builds the .icns file using macOS iconutil
const fs   = require('fs');
const zlib = require('zlib');
const { execSync } = require('child_process');

const SIZE = 1024;
const rgba = Buffer.alloc(SIZE * SIZE * 4);

const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 2;

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx   = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const idx  = (y * SIZE + x) * 4;

    if (dist > r + 1) {
      rgba[idx + 3] = 0; // transparent outside circle
      continue;
    }

    // t = 0 at center (black), t = 1 at edge (orange #ff6600)
    const t     = Math.min(dist / r, 1);
    const blend = Math.pow(t, 0.65);

    rgba[idx + 0] = Math.round(255 * blend);       // R
    rgba[idx + 1] = Math.round(102 * blend);       // G
    rgba[idx + 2] = 0;                             // B
    // soft anti-alias at the very edge
    rgba[idx + 3] = dist > r ? Math.round((r + 1 - dist) * 255) : 255;
  }
}

// ── Minimal PNG encoder ───────────────────────────────────────────────────────
function makeCRCTable() {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}
const CRC_TABLE = makeCRCTable();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const tb   = Buffer.from(type, 'ascii');
  const cval = Buffer.alloc(4); cval.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, cval]);
}
function encodePNG(w, h, pixels) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 4);
    row[0] = 0; // filter None
    pixels.copy(row, 1, y * w * 4, (y + 1) * w * 4);
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
// ─────────────────────────────────────────────────────────────────────────────

const png = encodePNG(SIZE, SIZE, rgba);
fs.writeFileSync('icon.png', png);
console.log('icon.png written');

// Build .icns via iconset
const iconset = 'SalesDash.iconset';
if (!fs.existsSync(iconset)) fs.mkdirSync(iconset);

const sizes = [16, 32, 64, 128, 256, 512, 1024];
sizes.forEach(s => {
  execSync(`sips -z ${s} ${s} icon.png --out ${iconset}/icon_${s}x${s}.png`);
  if (s <= 512) execSync(`sips -z ${s*2} ${s*2} icon.png --out ${iconset}/icon_${s}x${s}@2x.png`);
});

execSync(`iconutil -c icns ${iconset} -o icon.icns`);
console.log('icon.icns written');
