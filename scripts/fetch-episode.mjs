// Downloads the episode description and its pictures from Google Drive (files shared as "anyone with the link").
// Usage: node scripts/fetch-episode.mjs <episode.json Drive file id>
import {mkdirSync, writeFileSync} from 'node:fs';

const DIR = 'public/episode';
const id = process.argv[2];
if (!id) {
  console.error('Missing the Drive file id of episode.json');
  process.exit(1);
}

const download = async (fileId, what) => {
  const urls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ];
  let lastError = '';
  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {redirect: 'follow'});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.subarray(0, 15).toString().toLowerCase().includes('<!doctype html')) {
          throw new Error('Drive returned a web page instead of the file: the file is probably not shared with "anyone with the link"');
        }
        return buf;
      } catch (err) {
        lastError = String(err.message ?? err);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw new Error(`Could not download ${what} (${fileId}): ${lastError}`);
};

const extOf = (buf) => {
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  if (buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  throw new Error('Downloaded file is not a PNG, JPG or WEBP picture');
};

mkdirSync(DIR, {recursive: true});
const episode = JSON.parse((await download(id, 'episode.json')).toString('utf8'));
if (!Array.isArray(episode.segments) || episode.segments.length === 0) {
  throw new Error('episode.json has no segments');
}
episode.thinkSeconds = Number(episode.thinkSeconds) || 20;
episode.revealSeconds = Number(episode.revealSeconds) || 5;

let pictures = 0;
for (const seg of episode.segments) {
  if (seg.type !== 'riddle') continue;
  const num = String(seg.n).padStart(2, '0');
  for (const [idKey, fileKey, suffix] of [['imageFileId', 'image', ''], ['revealImageFileId', 'revealImage', '-reveal']]) {
    if (!seg[idKey]) continue;
    const buf = await download(seg[idKey], `picture of riddle ${seg.n}`);
    const name = `r${num}${suffix}.${extOf(buf)}`;
    writeFileSync(`${DIR}/${name}`, buf);
    seg[fileKey] = name;
    pictures++;
  }
  if (seg.kind === 'image' && !seg.image) {
    throw new Error(`Riddle ${seg.n} is an image riddle but has no picture`);
  }
}

writeFileSync(`${DIR}/episode.json`, JSON.stringify(episode, null, 2));
const riddles = episode.segments.filter((s) => s.type === 'riddle').length;
console.log(`Episode ready: ${episode.segments.length} segments, ${riddles} riddles, ${pictures} pictures downloaded`);
