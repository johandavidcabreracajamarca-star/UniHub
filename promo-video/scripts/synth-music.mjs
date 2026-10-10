// Genera la pista musical del video (sin samples externos, libre de derechos).
// 120 BPM → 1 beat = 15 frames a 30 fps, así los cortes caen en el ritmo.
// Uso: node scripts/synth-music.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const SR = 44100;
const BPM = 120;
const BEAT = 60 / BPM;
const DURATION = 51.2;
const DROP = 6.5; // segundos — entrada del logo (frame 195)
const CTA = 44.5; // segundos — llamado a la acción (frame 1335)
const END_BEAT = 48; // la batería se detiene y suena el acorde final
const N = Math.floor(SR * DURATION);
const L = new Float32Array(N);
const R = new Float32Array(N);

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function add(t0, buf, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i;
    if (j < 0 || j >= N) continue;
    L[j] += buf[i] * gl;
    R[j] += buf[i] * gr;
  }
}

// IV – V – iii – vi en Do mayor (Fmaj7 · G6 · Em7 · Am9): cálido y optimista
const CHORDS = [
  [53, 57, 60, 64],
  [55, 59, 62, 64],
  [52, 55, 59, 62],
  [57, 60, 64, 71],
];
const BASS = [41, 43, 40, 45];

function pad(freqs, dur, bright) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  const phases = freqs.flatMap(() => [Math.random(), Math.random(), Math.random()]);
  let lp = 0;
  const att = 0.35 * SR;
  const rel = 0.6 * SR;
  for (let i = 0; i < n; i++) {
    let v = 0;
    freqs.forEach((f, k) => {
      [-0.12, 0, 0.12].forEach((det, d) => {
        const idx = k * 3 + d;
        phases[idx] += (f * Math.pow(2, det / 12)) / SR;
        v += (phases[idx] % 1) * 2 - 1; // diente de sierra
      });
    });
    v /= freqs.length * 3;
    const cutoff = bright ? 0.09 : 0.05;
    lp += cutoff * (v - lp);
    const env = Math.min(1, i / att) * Math.min(1, (n - i) / rel);
    out[i] = lp * env;
  }
  return out;
}

function pluck(f, dur = 0.5) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 9) * Math.min(1, i / 60);
    out[i] = env * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 14) + 0.12 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 20));
  }
  return out;
}

function bass(f, dur) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, i / 200) * Math.min(1, (n - i) / 2000) * (0.75 + 0.25 * Math.exp(-t * 6));
    out[i] = env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t));
  }
  return out;
}

function kick() {
  const n = Math.floor(0.45 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 48 + 120 * Math.exp(-t * 32);
    ph += f / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 7) + (i < 90 ? rand() * 0.25 * (1 - i / 90) : 0);
  }
  return out;
}

function clap() {
  const n = Math.floor(0.3 * SR);
  const out = new Float32Array(n);
  let bp = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const burst = t < 0.03 ? 0.6 + 0.4 * Math.sin(t * 2 * Math.PI * 100) : 1;
    const x = rand();
    const hp = x - prev;
    prev = x;
    bp += 0.35 * (hp - bp);
    out[i] = bp * Math.exp(-t * 18) * burst;
  }
  return out;
}

function hat(open = false) {
  const n = Math.floor((open ? 0.18 : 0.05) * SR);
  const out = new Float32Array(n);
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = rand();
    out[i] = (x - prev) * Math.exp(-t * (open ? 22 : 80));
    prev = x;
  }
  return out;
}

function riser(dur) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    lp += (0.01 + p * 0.4) * (rand() - lp);
    out[i] = lp * p * p;
  }
  return out;
}

function impact() {
  const n = Math.floor(2.2 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (38 + 60 * Math.exp(-t * 8)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 2.2);
  }
  return out;
}

const BAR = BEAT * 4;
const totalBars = Math.ceil(DURATION / BAR);
const K = kick();
const CL = clap();

for (let bar = 0; bar < totalBars; bar++) {
  const t = bar * BAR;
  const ci = bar % 4;
  const afterDrop = t + BAR > DROP;
  add(t, pad(CHORDS[ci].map(midi), BAR + 0.5, afterDrop), afterDrop ? 0.22 : 0.26);

  // Arpegio en corcheas
  const arp = [0, 1, 2, 3, 2, 1, 3, 2];
  arp.forEach((k, s) => {
    const note = CHORDS[ci][k] + 12;
    add(t + s * (BEAT / 2), pluck(midi(note)), afterDrop ? 0.11 : 0.09, s % 2 ? 0.35 : -0.35);
  });

  // Bajo y batería desde el drop (aunque caiga a mitad de compás) hasta el final
  if (t < END_BEAT && t + BAR > DROP) {
    const bassStart = Math.max(t, DROP);
    add(bassStart, bass(midi(BASS[ci]), t + BAR * 0.98 - bassStart), 0.28);
    for (let b = 0; b < 4; b++) {
      const tb = t + b * BEAT;
      if (tb < DROP - 0.01 || tb >= END_BEAT) continue;
      add(tb, K, 0.55);
      if (b % 2 === 1) add(tb, CL, 0.32, 0.1);
      add(tb + BEAT / 2, hat(b === 3), 0.12, 0.4);
      add(tb, hat(), 0.06, -0.4);
    }
  }
}

// Riser hacia el drop + impacto
add(DROP - 2, riser(2), 0.25);
add(DROP, impact(), 0.5);
add(DROP, CL, 0.2);
// Golpe en el CTA y acorde final
add(CTA, impact(), 0.35);
add(END_BEAT, pad([...CHORDS[0], 65, 72].map(midi), 3.2, true), 0.25);

// ---------------------------------------------------------------------------
// Efectos de sonido, sincronizados con las escenas (frame / 30 = segundo)
// ---------------------------------------------------------------------------
// "Pop" suave: burbuja de chat o mensaje que aparece
function pop() {
  const n = Math.floor(0.12 * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (520 + 700 * Math.exp(-t * 45)) / SR;
    out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 32) * Math.min(1, i / 40);
  }
  return out;
}

// Campanita: tonos tipo xilófono (para avisos y la venta)
function chime(notes, spacing = 0.09) {
  const n = Math.floor((notes.length * spacing + 0.9) * SR);
  const out = new Float32Array(n);
  notes.forEach((m, k) => {
    const f = midi(m);
    const s0 = Math.floor(k * spacing * SR);
    for (let i = 0; s0 + i < n; i++) {
      const t = i / SR;
      const env = Math.exp(-t * 7) * Math.min(1, i / 30);
      out[s0 + i] += env * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 14));
    }
  });
  return out;
}

// Toque en la pantalla
function tap() {
  const n = Math.floor(0.05 * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * 1800 * t) * 0.6 + rand() * 0.4) * Math.exp(-t * 90);
  }
  return out;
}

// Chat (escena desde frame 585): burbujas en los frames 18, 60 y 90
[603, 645, 675].forEach((f) => add(f / 30, pop(), 0.22, 0.2));
// Avisos al celular (desde frame 735): cada aviso en los frames 24, 58 y 92
[759, 793, 827].forEach((f, i) => add(f / 30, chime([88, 93]), 0.16, i % 2 ? 0.25 : -0.25));
// Compartir (desde frame 1035): toque en el botón, mensaje y respuesta
add(1073 / 30, tap(), 0.25);
add(1085 / 30, pop(), 0.22, -0.2);
add(1119 / 30, pop(), 0.2, 0.2);
// ¡Nueva venta! en el panel del emprendedor (frame 1270)
add(1270 / 30, chime([84, 88, 91, 96], 0.07), 0.18);

// Reverb simple (combs en paralelo) para dar espacio
function reverb(buf, mix) {
  const delays = [1557, 1617, 1491, 1422].map((d) => d * 1.4);
  const out = new Float32Array(buf.length);
  delays.forEach((d) => {
    const D = Math.floor(d);
    const line = new Float32Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      line[i] = buf[i] + (i >= D ? line[i - D] * 0.72 : 0);
      out[i] += line[i] * 0.25;
    }
  });
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - mix) + out[i] * mix;
}
reverb(L, 0.22);
reverb(R, 0.22);

// Normalizar + fade in/out + soft clip
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.9 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.3) * Math.min(1, (DURATION - t) / 1.5);
  const l = Math.tanh(L[i] * g * fade * 1.1);
  const r = Math.tanh(R[i] * g * fade * 1.1);
  buf.writeInt16LE(Math.round(l * 32000), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32000), 46 + i * 4);
}
mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/music.wav', import.meta.url), buf);
console.log('public/music.wav listo');
