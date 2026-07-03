/**
 * Genera los assets de la app (icono, splash, adaptive icon y favicon) sin
 * dependencias externas: dibuja un balón de voleibol estilizado con los
 * colores de la RFEVB y escribe PNGs válidos (RGBA, color type 6).
 *
 * Uso: node scripts/generar-iconos.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assets = join(__dirname, '..', 'assets');
mkdirSync(assets, { recursive: true });

const NAVY = [14, 42, 107];
const NAVY_D = [8, 15, 36];
const WHITE = [245, 247, 251];
const RED = [225, 29, 60];
const GOLD = [255, 196, 0];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/**
 * Dibuja el icono. `bg` = color de fondo o null para transparente.
 * `escalaBalon` controla el tamaño del balón respecto al lienzo.
 */
function dibujar(size, bg, escalaBalon = 0.62) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const R = (size * escalaBalon) / 2;
  // Costuras: tres circunferencias cuyos arcos cruzan el balón
  const seams = [
    { x: cx - R * 1.15, y: cy - R * 1.15, r: R * 1.55 },
    { x: cx + R * 1.35, y: cy - R * 0.55, r: R * 1.5 },
    { x: cx, y: cy + R * 1.7, r: R * 1.6 },
  ];
  const grosor = R * 0.06;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let col = bg ? bg.slice() : null;
      let alpha = bg ? 255 : 0;
      const d = Math.hypot(x - cx, y - cy);
      if (bg) {
        // Degradado radial suave en el fondo
        const t = Math.min(1, d / (size * 0.75));
        col = mix(bg, NAVY_D, t * 0.6);
      }
      if (d <= R) {
        // Interior del balón: blanco con leve sombreado
        const sh = Math.min(1, d / R);
        col = mix(WHITE, [210, 216, 228], sh * 0.5);
        alpha = 255;
        // Costuras rojas
        for (const s of seams) {
          const ds = Math.abs(Math.hypot(x - s.x, y - s.y) - s.r);
          if (ds < grosor) col = RED;
        }
        // Borde dorado del balón
        if (R - d < grosor * 1.2) col = GOLD;
      }
      buf[i] = col ? col[0] : 0;
      buf[i + 1] = col ? col[1] : 0;
      buf[i + 2] = col ? col[2] : 0;
      buf[i + 3] = alpha;
    }
  }
  return png(size, size, buf);
}

writeFileSync(join(assets, 'icon.png'), dibujar(1024, NAVY, 0.62));
writeFileSync(join(assets, 'adaptive-icon.png'), dibujar(1024, null, 0.7)); // primer plano transparente
writeFileSync(join(assets, 'splash.png'), dibujar(1024, NAVY, 0.5));
writeFileSync(join(assets, 'favicon.png'), dibujar(196, NAVY, 0.66));
console.log('Assets generados en', assets);
