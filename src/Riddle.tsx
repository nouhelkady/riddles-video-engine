import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {RiddleSegment} from './types';

const BANNER_H = 170;
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const ar = (n: number) => String(n).split('').map((d) => AR_DIGITS[Number(d)] ?? d).join('');
const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px #000`, paintOrder: 'stroke fill'});

const EMOJI_POOL = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉', '🐴', '🦄', '🐝', '🦋', '🐢', '🐙', '🐬', '🐳', '🐘', '🦒', '🦓', '🐪', '🦘', '🐑', '🐐', '🦌', '🐿️', '🦔', '🦜', '🐊'];
const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const buildGrid = (n: number, fixed?: string[]) => {
  const COUNT = 24;
  const rand = rng(n * 7919 + 17);
  const pool = [...EMOJI_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  if (fixed && fixed.length >= COUNT) {
    const cells = fixed.slice(0, COUNT);
    const dup = cells.map((e, i) => (cells.indexOf(e) !== i || cells.lastIndexOf(e) !== i ? i : -1)).filter((i) => i >= 0);
    return {cells, dup};
  }
  const cells = pool.slice(0, COUNT - 1);
  const a = Math.floor(rand() * 10);
  let b = 13 + Math.floor(rand() * 11);
  cells.splice(b, 0, cells[a]);
  return {cells, dup: [a, b]};
};

const Banner: React.FC<{seg: RiddleSegment}> = ({seg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drop = spring({frame, fps, config: {damping: 14}});
  return (
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: BANNER_H, transform: `translateY(${(drop - 1) * BANNER_H}px)`, background: 'linear-gradient(180deg,#ff2a1a 0%,#d60000 100%)', borderBottom: '8px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5}}>
      <div style={{position: 'absolute', right: 36, top: 34, height: 96, minWidth: 96, padding: '0 22px', borderRadius: 48, background: '#ffd400', border: '6px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 900, color: '#000'}}>
        {ar(seg.n)}
      </div>
      <div style={{fontSize: seg.title.length > 26 ? 78 : 98, fontWeight: 900, color: '#fff', padding: '0 170px', whiteSpace: 'nowrap', ...stroke(10)}}>{seg.title}</div>
    </div>
  );
};

const Timer: React.FC<{thinkFrames: number; thinkSeconds: number}> = ({thinkFrames, thinkSeconds}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const done = frame >= thinkFrames;
  const left = Math.max(0, Math.ceil((thinkFrames - frame) / fps));
  const progress = Math.min(1, frame / thinkFrames);
  const urgent = left <= 5 && !done;
  const beat = 1 + (urgent ? 0.14 : 0.06) * Math.max(0, 1 - ((frame % fps) / fps) * 4);
  const R = 78;
  const C = 2 * Math.PI * R;
  const color = urgent ? '#ff2a1a' : '#16c060';
  if (done) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 44, bottom: 60, width: 200, height: 200, transform: `scale(${beat})`, zIndex: 6, direction: 'ltr'}}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          <circle cx={100} cy={100} r={92} fill="#fff" stroke="#000" strokeWidth={8} />
          <circle cx={100} cy={100} r={R} fill="none" stroke="#e5e7eb" strokeWidth={16} />
          <circle cx={100} cy={100} r={R} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * progress} transform="rotate(-90 100 100)" />
          <line x1={100} y1={100} x2={100} y2={40} stroke="#000" strokeWidth={7} strokeLinecap="round" transform={`rotate(${Math.floor(frame / fps) * (360 / thinkSeconds)} 100 100)`} />
          <circle cx={100} cy={100} r={9} fill="#000" />
        </svg>
        <div style={{position: 'absolute', right: -70, top: 50, width: 110, height: 100, borderRadius: 24, background: color, border: '6px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 900, color: '#fff'}}>{left}</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 20, background: '#000', zIndex: 6, direction: 'ltr'}}>
        <div style={{height: '100%', width: `${(1 - progress) * 100}%`, background: color}} />
      </div>
    </>
  );
};

const Badges: React.FC<{count: number; answer?: number; revealed: boolean; revealFrame: number}> = ({count, answer, revealed, revealFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const isAnswer = revealed && answer === i + 1;
        const appear = spring({frame: frame - 8 - i * 4, fps, config: {damping: 10, mass: 0.5}});
        const pulse = isAnswer ? 1.25 + Math.sin((frame - revealFrame) / 4) * 0.12 : 1;
        return (
          <div key={i} style={{position: 'absolute', left: `${((i + 0.5) / count) * 100}%`, top: BANNER_H + 34, width: 120, height: 120, marginLeft: -60, borderRadius: 60, background: isAnswer ? '#16c060' : '#e60012', border: '8px solid #fff', boxShadow: '0 0 0 6px #000, 0 10px 24px rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 78, fontWeight: 900, color: '#fff', transform: `scale(${appear * pulse})`, zIndex: 4, direction: 'ltr', opacity: revealed && !isAnswer ? 0.55 : 1}}>
            {i + 1}
          </div>
        );
      })}
    </>
  );
};

const ColumnSpotlight: React.FC<{count: number; answer: number; t: number}> = ({count, answer, t}) => {
  const frame = useCurrentFrame();
  const w = 100 / count;
  const glow = 0.6 + Math.sin(frame / 5) * 0.4;
  return (
    <>
      {Array.from({length: count}, (_, i) =>
        i + 1 === answer ? (
          <div key={i} style={{position: 'absolute', left: `${i * w}%`, width: `${w}%`, top: BANNER_H, bottom: 0, border: `12px solid rgba(22,192,96,${t})`, boxShadow: `inset 0 0 ${60 * glow}px rgba(22,192,96,${0.8 * t})`, boxSizing: 'border-box', zIndex: 3}} />
        ) : (
          <div key={i} style={{position: 'absolute', left: `${i * w}%`, width: `${w}%`, top: BANNER_H, bottom: 0, background: `rgba(0,0,0,${0.62 * t})`, zIndex: 3}} />
        ),
      )}
    </>
  );
};

const AnswerBar: React.FC<{seg: RiddleSegment; t: number}> = ({seg, t}) => {
  let main: string;
  let bg = '#16a34a';
  if (!seg.reveal) {
    main = 'اكتب إجابتك في التعليقات 👇';
    bg = '#f59e0b';
  } else if (seg.answerText) {
    main = `الإجابة: ${seg.answerText}`;
  } else if (seg.answer) {
    main = `الإجابة: رقم ${seg.answer}`;
  } else {
    main = 'انتهى الوقت!';
  }
  const sub = seg.reveal ? seg.clue : undefined;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, transform: `translateY(${(1 - t) * 260}px)`, background: bg, borderTop: '8px solid #000', padding: '20px 60px 26px', textAlign: 'center', zIndex: 7}}>
      <div style={{fontSize: 84, fontWeight: 900, color: '#fff', lineHeight: 1.2, ...stroke(8)}}>{main}</div>
      {sub ? <div style={{fontSize: 50, fontWeight: 700, color: '#fff', marginTop: 6, lineHeight: 1.35, ...stroke(5)}}>{sub}</div> : null}
    </div>
  );
};

const EmojiGrid: React.FC<{seg: RiddleSegment; revealed: boolean; t: number}> = ({seg, revealed, t}) => {
  const frame = useCurrentFrame();
  const {cells, dup} = React.useMemo(() => buildGrid(seg.n, seg.emojis), [seg.n, seg.emojis]);
  return (
    <AbsoluteFill style={{top: BANNER_H, height: 1080 - BANNER_H, background: 'linear-gradient(180deg,#fff7d6 0%,#ffe08a 100%)', padding: '30px 60px 190px 290px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: 14, direction: 'ltr'}}>
      {cells.map((e, i) => {
        const hit = revealed && seg.reveal && dup.includes(i);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 118, borderRadius: 28, background: hit ? `rgba(22,192,96,${0.35 * t})` : 'rgba(255,255,255,.55)', border: hit ? '10px solid #16c060' : '4px solid rgba(0,0,0,.08)', transform: `scale(${hit ? 1 + Math.sin(frame / 4) * 0.06 : 1})`, opacity: revealed && seg.reveal && !hit ? 1 - 0.6 * t : 1, fontFamily: "'Noto Color Emoji', 'Apple Color Emoji', sans-serif"}}>
            {e}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const TextCard: React.FC<{seg: RiddleSegment}> = ({seg}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{top: BANNER_H, height: 1080 - BANNER_H, background: 'radial-gradient(circle at 50% 35%,#3b2a8c 0%,#151033 70%)', alignItems: 'center', justifyContent: 'center', padding: '0 220px 120px'}}>
      <div style={{position: 'absolute', fontSize: 620, fontWeight: 900, color: 'rgba(255,212,0,.13)', transform: `rotate(${Math.sin(frame / 40) * 6}deg)`}}>؟</div>
      <div style={{fontSize: 92, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.5, ...stroke(8)}}>{seg.text ?? seg.title}</div>
    </AbsoluteFill>
  );
};

export const Riddle: React.FC<{seg: RiddleSegment; thinkSeconds: number}> = ({seg, thinkSeconds}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const thinkFrames = Math.round(thinkSeconds * fps);
  const revealed = frame >= thinkFrames;
  const t = spring({frame: frame - thinkFrames, fps, config: {damping: 14}});
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const flash = revealed ? interpolate(frame, [thinkFrames, thinkFrames + 6], [0.7, 0], {extrapolateRight: 'clamp'}) : 0;
  const options = seg.kind === 'image' ? seg.options ?? 0 : 0;
  const img = revealed && seg.revealImage ? seg.revealImage : seg.image;
  const narrationEnd = seg.voQuestion ? (seg.voQuestionSec ?? 0) + 0.5 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#101426', opacity: fadeIn}}>
      {Array.from({length: thinkSeconds}, (_, s) => {
        const urgent = thinkSeconds - s <= 5;
        const file = urgent ? 'sfx/tick-urgent.wav' : s % 2 === 0 ? 'sfx/tick.wav' : 'sfx/tock.wav';
        return (
          <Sequence key={s} from={s * fps} durationInFrames={Math.round(fps * 0.5)}>
            <Audio src={staticFile(file)} volume={s < narrationEnd ? 0.18 : urgent ? 1 : 0.8} />
          </Sequence>
        );
      })}
      <Sequence from={thinkFrames} durationInFrames={Math.round(fps * 1.4)}>
        <Audio src={staticFile('sfx/ding.wav')} volume={seg.voAnswer ? 0.55 : 1} />
      </Sequence>
      {seg.voQuestion ? (
        <Sequence from={6}>
          <Audio src={staticFile(`episode/${seg.voQuestion}`)} />
        </Sequence>
      ) : null}
      {seg.voAnswer ? (
        <Sequence from={thinkFrames + 12}>
          <Audio src={staticFile(`episode/${seg.voAnswer}`)} />
        </Sequence>
      ) : null}

      {seg.kind === 'image' ? (
        <div style={{position: 'absolute', top: BANNER_H, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: 'linear-gradient(135deg,#4f8df7,#9b5cf6)'}}>
          {img ? <Img src={staticFile(`episode/${img}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} /> : null}
        </div>
      ) : seg.kind === 'emojiGrid' ? (
        <EmojiGrid seg={seg} revealed={revealed} t={t} />
      ) : (
        <TextCard seg={seg} />
      )}

      {revealed && seg.reveal && options > 0 && seg.answer ? <ColumnSpotlight count={options} answer={seg.answer} t={t} /> : null}
      {options > 0 ? <Badges count={options} answer={seg.reveal ? seg.answer : undefined} revealed={revealed} revealFrame={thinkFrames} /> : null}
      <Banner seg={seg} />
      <Timer thinkFrames={thinkFrames} thinkSeconds={thinkSeconds} />
      {revealed ? <AnswerBar seg={seg} t={t} /> : null}
      <AbsoluteFill style={{background: '#fff', opacity: flash, zIndex: 9}} />
    </AbsoluteFill>
  );
};
