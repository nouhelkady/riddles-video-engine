// Generates the sound effects (tick, last-seconds tick, reveal ding) as WAV files. No downloads needed.
import {writeFileSync, mkdirSync} from 'node:fs';
const SR = 44100;
const wav = (samples) => {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buf;
};
const tick = (freq, dur = 0.09, vol = 0.8) => Array.from({length: Math.floor(SR * 0.5)}, (_, i) => {
  const t = i / SR; if (t > dur) return 0;
  const env = Math.exp(-t * 70);
  return vol * env * (Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 2.4 * t) * 0.3);
});
const ding = () => Array.from({length: Math.floor(SR * 1.4)}, (_, i) => {
  const t = i / SR; let s = 0;
  [[880, 0], [1318.5, 0.12], [1760, 0.24]].forEach(([f, d]) => { if (t >= d) s += Math.sin(2 * Math.PI * f * (t - d)) * Math.exp(-(t - d) * 4) * 0.33; });
  return s;
});
const whoosh = () => Array.from({length: Math.floor(SR * 0.5)}, (_, i) => {
  const t = i / SR; const env = Math.sin(Math.PI * t / 0.5) ** 2;
  return (Math.random() * 2 - 1) * env * 0.25 * (1 - t);
});
mkdirSync('public/sfx', {recursive: true});
writeFileSync('public/sfx/tick.wav', wav(tick(1900)));
writeFileSync('public/sfx/tock.wav', wav(tick(1400)));
writeFileSync('public/sfx/tick-urgent.wav', wav(tick(2600, 0.12, 0.95)));
writeFileSync('public/sfx/ding.wav', wav(ding()));
writeFileSync('public/sfx/whoosh.wav', wav(whoosh()));
console.log('sfx written');
