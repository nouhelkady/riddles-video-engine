import {FONT_DATA} from './font-data';

export const FONT = 'Cairo';
const RANGES = {
  arabic: 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC',
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
};

const toBuffer = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

let started = false;
/** Fonts are built from embedded bytes, so they are ready without any network request. */
export const ensureFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  (['arabic', 'latin'] as const).forEach((subset) =>
    ['700', '900'].forEach((weight) => {
      const face = new FontFace(FONT, toBuffer(FONT_DATA[`${subset}-${weight}`]), {weight, unicodeRange: RANGES[subset]});
      document.fonts.add(face);
      face.load().catch((err) => console.error('Font load failed', err));
    }),
  );
};
