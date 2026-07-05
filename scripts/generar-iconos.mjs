/**
 * Genera los assets de La SuperFantasy — logo minimalista de dos tonos
 * (negro + rosa de marca) listo para App Store y Play Store.
 *
 * Diseño: balón de voleibol en rosa sólido con las costuras en negativo
 * (negro), sin degradados ni terceros colores. Salidas:
 *   - icon.png          1024² opaco (iOS/tiendas, sin transparencia)
 *   - adaptive-icon.png 1024² transparente, balón dentro de la zona de
 *                       seguridad del icono adaptativo de Android (~66%)
 *   - splash.png        1024² opaco, balón centrado más pequeño
 *   - favicon.png       196² opaco (web)
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

const NEGRO = [1, 0, 0]; // #010000, fondo de marca
const ROSA = [226, 29, 102]; // #e21d66

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

/** Antialiasing: cobertura suave de un borde (distancia con signo → alfa 0..1). */
function cobertura(distancia, radio) {
  return Math.min(1, Math.max(0, radio - distancia + 0.5));
}

/**
 * Dibuja el balón minimalista. `bg` = color de fondo o null (transparente).
 * `escalaBalon` = diámetro del balón respecto al lienzo.
 */
function dibujar(size, bg, escalaBalon) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const R = (size * escalaBalon) / 2;

  // Tres costuras: arcos de circunferencias descentradas (patrón de voleibol)
  const seams = [
    { x: cx - R * 1.1, y: cy - R * 1.15, r: R * 1.5 },
    { x: cx + R * 1.35, y: cy - R * 0.5, r: R * 1.5 },
    { x: cx, y: cy + R * 1.75, r: R * 1.6 },
  ];
  const grosor = R * 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);

      // Fondo base
      let col = bg;
      let alpha = bg ? 255 : 0;

      // Cobertura del disco (balón)
      const aBall = cobertura(d, R);
      if (aBall > 0) {
        // Costuras en negativo (color del fondo, o transparente si no hay fondo)
        let aSeam = 0;
        for (const s of seams) {
          const ds = Math.abs(Math.hypot(x + 0.5 - s.x, y + 0.5 - s.y) - s.r);
          aSeam = Math.max(aSeam, cobertura(ds, grosor));
        }
        // Color del balón: rosa, menos donde hay costura (→ fondo/transparente)
        const rosaCobertura = aBall * (1 - aSeam);
        const fondoCol = bg ?? [0, 0, 0];
        const fondoAlpha = bg ? 255 : 0;
        // Mezcla: rosa sobre (fondo/seam)
        const base = col ?? [0, 0, 0];
        const baseA = alpha;
        // resultado = rosa*rosaCobertura + fondo*(resto dentro del disco) + base*(fuera)
        const dentro = aBall; // 0..1
        const seamCol = fondoCol;
        const seamA = fondoAlpha;
        // Primero el interior del disco = rosa donde no hay costura, fondo donde sí
        const rInt = ROSA[0] * (1 - aSeam) + seamCol[0] * aSeam;
        const gInt = ROSA[1] * (1 - aSeam) + seamCol[1] * aSeam;
        const bInt = ROSA[2] * (1 - aSeam) + seamCol[2] * aSeam;
        const aInt = 255 * (1 - aSeam) + seamA * aSeam;
        // Componer interior sobre el exterior según cobertura del disco
        col = [
          Math.round(rInt * dentro + base[0] * (1 - dentro)),
          Math.round(gInt * dentro + base[1] * (1 - dentro)),
          Math.round(bInt * dentro + base[2] * (1 - dentro)),
        ];
        alpha = Math.round(aInt * dentro + baseA * (1 - dentro));
      }

      buf[i] = col ? col[0] : 0;
      buf[i + 1] = col ? col[1] : 0;
      buf[i + 2] = col ? col[2] : 0;
      buf[i + 3] = alpha;
    }
  }
  return png(size, size, buf);
}

writeFileSync(join(assets, 'icon.png'), dibujar(1024, NEGRO, 0.66));
writeFileSync(join(assets, 'adaptive-icon.png'), dibujar(1024, null, 0.56)); // zona segura Android
writeFileSync(join(assets, 'splash.png'), dibujar(1024, NEGRO, 0.42));
writeFileSync(join(assets, 'favicon.png'), dibujar(196, NEGRO, 0.7));

// Icono 512² para la ficha de Google Play Store (Play Console → Icono de la app)
const tiendas = join(__dirname, '..', 'store');
mkdirSync(tiendas, { recursive: true });
writeFileSync(join(tiendas, 'play-store-icon-512.png'), dibujar(512, NEGRO, 0.66));
console.log('Assets minimalistas generados en', assets);
console.log('Icono de tienda (512) en', tiendas);
