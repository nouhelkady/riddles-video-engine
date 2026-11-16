import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, Series, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts, FONT} from './fonts';
import {EpisodeProps, FPS, RiddleSegment} from './types';

ensureFonts();

export const REEL_W = 1080;
export const REEL_H = 1920;
export const REEL_INTRO = 3;
export const REEL_OUTRO = 4;
export const REEL_THINK = 7;
export const REEL_REVEAL = 3;
export const REEL_COUNT = 5;
const CHANNEL = 'ألغاز القاضي';

const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px #000`, paintOrder: 'stroke fill'});
const EMOJI_FONT = "'Noto Color Emoji', 'Apple Color Emoji', sans-serif";

const REEL_BUDGET = 57 - REEL_INTRO - REEL_OUTRO;

/** Each riddle keeps its narration: thinking time covers the question, the reveal covers the answer. */
export const reelTiming = (s: RiddleSegment) => ({
  think: Math.max(REEL_THINK, Math.ceil((s.voQuestionSec ?? 0) + 1.5)),
  reveal: Math.max(REEL_REVEAL, Math.ceil((s.voAnswerSec ?? 0) + 0.8)),
});
const reelSec = (s: RiddleSegment) => {
  const t = reelTiming(s);
  return t.think + t.reveal;
};

/** Riddles spread from the start of the episode (easy) to its end (hard), the shortest of each part, as many as fit under 59 seconds. */
export const pickReelRiddles = (p: EpisodeProps): RiddleSegment[] => {
  const all = p.segments.filter((s): s is RiddleSegment => s.type === 'riddle');
  const parts = Math.min(REEL_COUNT, all.length);
  let picked: RiddleSegment[] = [];
  for (let i = 0; i < parts; i++) {
    const from = Math.floor((i * all.length) / parts);
    const to = Math.floor(((i + 1) * all.length) / parts);
    const group = all.slice(from, Math.max(to, from + 1));
    picked.push(group.reduce((best, s) => (reelSec(s) < reelSec(best) ? s : best), group[0]));
  }
  while (picked.length > 2 && picked.reduce((sum, s) => sum + reelSec(s), 0) > REEL_BUDGET) {
    const longest = picked.reduce((a, b) => (reelSec(b) > reelSec(a) ? b : a), picked[0]);
    picked = picked.filter((s) => s !== longest);
  }
  return picked;
};

export const reelFrames = (p: EpisodeProps) => {
  const riddles = pickReelRiddles(p);
  return (REEL_INTRO + riddles.reduce((sum, s) => sum + reelSec(s), 0) + REEL_OUTRO) * FPS;
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%,#3b2a8c 0%,#151033 65%,#0b0920 100%)'}}>
      {Array.from({length: 10}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: `${(i * 137) % 100}%`, top: `${(i * 61 + 13) % 100}%`, fontSize: 90 + (i % 3) * 40, fontWeight: 900, color: 'rgba(255,255,255,0.06)', transform: `translateY(${Math.sin((frame + i * 20) / 25) * 14}px)`}}>
          ؟
        </div>
      ))}
    </AbsoluteFill>
  );
};

const ChannelPill: React.FC = () => (
  <div style={{position: 'absolute', top: 110, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 6}}>
    <div style={{padding: '10px 44px', borderRadius: 60, background: '#ffd400', border: '6px solid #000', fontSize: 52, fontWeight: 900, color: '#000'}}>{CHANNEL}</div>
  </div>
);

const ReelCard: React.FC<{title: string; subtitle: string; bg: string}> = ({title, subtitle, bg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 12, mass: 0.6}});
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center', padding: '0 80px'}}>
      <Audio src={staticFile('sfx/whoosh.wav')} volume={0.7} />
      <div style={{transform: `scale(${pop})`, textAlign: 'center'}}>
        <div style={{fontSize: 150, fontWeight: 900, color: '#fff', lineHeight: 1.25, ...stroke(12)}}>{title}</div>
        <div style={{marginTop: 40, fontSize: 76, fontWeight: 800, color: '#ffd400', lineHeight: 1.35, ...stroke(7)}}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

const answerLine = (seg: RiddleSegment) => {
  if (!seg.reveal) return {main: 'اكتب إجابتك في التعليقات 👇', bg: '#f59e0b'};
  if (seg.answerText) return {main: seg.answerText, bg: '#16a34a'};
  if (seg.answer) return {main: `رقم ${seg.answer}`, bg: '#16a34a'};
  return {main: 'انتهى الوقت!', bg: '#16a34a'};
};

const PictureBox: React.FC<{seg: RiddleSegment; revealed: boolean; t: number}> = ({seg, revealed, t}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const count = seg.options ?? 0;
  const w = 100 / Math.max(1, count);
  const zoom = interpolate(frame, [0, reelSec(seg) * fps], [1, 1.05]);
  return (
    <div style={{position: 'absolute', top: 560, left: 0, width: REEL_W, height: 608, overflow: 'hidden', borderTop: '8px solid #000', borderBottom: '8px solid #000', direction: 'ltr'}}>
      {seg.image ? <Img src={staticFile(`episode/${seg.image}`)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} /> : null}
      {revealed && seg.reveal && seg.answer && count > 0
        ? Array.from({length: count}, (_, i) =>
            i + 1 === seg.answer ? (
              <div key={i} style={{position: 'absolute', left: `${i * w}%`, width: `${w}%`, top: 0, bottom: 0, border: `10px solid rgba(22,192,96,${t})`, boxSizing: 'border-box'}} />
            ) : (
              <div key={i} style={{position: 'absolute', left: `${i * w}%`, width: `${w}%`, top: 0, bottom: 0, background: `rgba(0,0,0,${0.62 * t})`}} />
            ),
          )
        : null}
      {Array.from({length: count}, (_, i) => {
        const isAnswer = revealed && seg.reveal && seg.answer === i + 1;
        const appear = spring({frame: frame - 6 - i * 3, fps, config: {damping: 10, mass: 0.5}});
        return (
          <div key={i} style={{position: 'absolute', left: `${((i + 0.5) / count) * 100}%`, top: 18, width: 86, height: 86, marginLeft: -43, borderRadius: 43, background: isAnswer ? '#16c060' : '#e60012', border: '6px solid #fff', boxShadow: '0 0 0 5px #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, color: '#fff', transform: `scale(${appear * (isAnswer ? 1.2 : 1)})`, opacity: revealed && seg.reveal && !isAnswer ? 0.5 : 1}}>
            {i + 1}
          </div>
        );
      })}
    </div>
  );
};

const TextBox: React.FC<{seg: RiddleSegment}> = ({seg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const full = String(seg.text ?? seg.title ?? '');
  const m = full.match(/((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}\uFE0F?\u200D?)+)/u);
  const pop = spring({frame, fps, config: {damping: 12}});
  return (
    <div style={{position: 'absolute', top: 520, left: 60, right: 60, height: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20}}>
      {m ? <div style={{fontSize: 360, lineHeight: 1.1, fontFamily: EMOJI_FONT, transform: `scale(${0.6 + 0.4 * pop})`}}>{m[1]}</div> : null}
      <div style={{fontSize: m ? 64 : 88, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.45, ...stroke(7)}}>{m ? full.replace(m[0], ' ').replace(/\s+/g, ' ').trim() : full}</div>
    </div>
  );
};

const GridBox: React.FC<{seg: RiddleSegment; revealed: boolean}> = ({seg, revealed}) => {
  const cells = React.useMemo(() => {
    const pool = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦉'];
    let seed = seg.n * 7919 + 17;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const list = pool.slice(0, 19);
    const a = Math.floor(rand() * 8);
    const b = 10 + Math.floor(rand() * 9);
    list.splice(b, 0, list[a]);
    return {list, dup: [a, b]};
  }, [seg.n]);
  return (
    <div style={{position: 'absolute', top: 520, left: 50, right: 50, height: 760, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 12, direction: 'ltr', background: 'linear-gradient(180deg,#fff7d6 0%,#ffe08a 100%)', padding: 18, borderRadius: 30, border: '6px solid #000'}}>
      {cells.list.map((e, i) => {
        const hit = revealed && seg.reveal && cells.dup.includes(i);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 92, borderRadius: 20, background: hit ? 'rgba(22,192,96,.35)' : 'rgba(255,255,255,.55)', border: hit ? '8px solid #16c060' : '3px solid rgba(0,0,0,.08)', fontFamily: EMOJI_FONT}}>
            {e}
          </div>
        );
      })}
    </div>
  );
};

const ReelRiddle: React.FC<{seg: RiddleSegment; index: number; total: number}> = ({seg, index, total}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const timing = reelTiming(seg);
  const thinkFrames = timing.think * fps;
  const narrationEnd = seg.voQuestion ? (seg.voQuestionSec ?? 0) + 0.4 : 0;
  const revealed = frame >= thinkFrames;
  const t = spring({frame: frame - thinkFrames, fps, config: {damping: 14}});
  const left = Math.max(0, Math.ceil((thinkFrames - frame) / fps));
  const urgent = left <= 3 && !revealed;
  const beat = 1 + 0.1 * Math.max(0, 1 - ((frame % fps) / fps) * 4);
  const color = urgent ? '#ff2a1a' : '#16c060';
  const drop = spring({frame, fps, config: {damping: 14}});
  const ans = answerLine(seg);
  return (
    <AbsoluteFill>
      {Array.from({length: timing.think}, (_, s) => (
        <Sequence key={s} from={s * fps} durationInFrames={Math.round(fps * 0.5)}>
          <Audio src={staticFile(timing.think - s <= 3 ? 'sfx/tick-urgent.wav' : s % 2 === 0 ? 'sfx/tick.wav' : 'sfx/tock.wav')} volume={s < narrationEnd ? 0.18 : 0.85} />
        </Sequence>
      ))}
      {seg.voQuestion ? (
        <Sequence from={6}>
          <Audio src={staticFile(`episode/${seg.voQuestion}`)} />
        </Sequence>
      ) : null}
      <Sequence from={thinkFrames} durationInFrames={Math.round(fps * 1.4)}>
        <Audio src={staticFile('sfx/ding.wav')} volume={seg.voAnswer ? 0.55 : 1} />
      </Sequence>
      {seg.voAnswer ? (
        <Sequence from={thinkFrames + 8}>
          <Audio src={staticFile(`episode/${seg.voAnswer}`)} />
        </Sequence>
      ) : null}

      <div style={{position: 'absolute', top: 250, left: 40, right: 40, transform: `translateY(${(drop - 1) * 120}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 5}}>
        <div style={{padding: '6px 30px', borderRadius: 40, background: '#e60012', border: '5px solid #000', fontSize: 40, fontWeight: 900, color: '#fff'}}>{`لغز ${index + 1} من ${total}`}</div>
        <div style={{fontSize: seg.title.length > 22 ? 80 : 96, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.3, ...stroke(9)}}>{seg.title}</div>
      </div>

      {seg.kind === 'image' ? <PictureBox seg={seg} revealed={revealed} t={t} /> : seg.kind === 'emojiGrid' ? <GridBox seg={seg} revealed={revealed} /> : <TextBox seg={seg} />}

      {!revealed ? (
        <div style={{position: 'absolute', top: 1330, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 6}}>
          <div style={{width: 230, height: 230, borderRadius: 115, background: color, border: '10px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 140, fontWeight: 900, color: '#fff', transform: `scale(${beat})`, direction: 'ltr'}}>{left}</div>
        </div>
      ) : (
        <div style={{position: 'absolute', top: 1320, left: 50, right: 50, transform: `scale(${0.7 + 0.3 * t})`, opacity: t, background: ans.bg, border: '8px solid #000', borderRadius: 36, padding: '28px 30px', textAlign: 'center', zIndex: 6}}>
          <div style={{fontSize: 92, fontWeight: 900, color: '#fff', lineHeight: 1.25, ...stroke(8)}}>{ans.main}</div>
          {seg.reveal && seg.clue ? <div style={{fontSize: 50, fontWeight: 700, color: '#fff', marginTop: 10, lineHeight: 1.35, ...stroke(5)}}>{seg.clue}</div> : null}
        </div>
      )}

      <div style={{position: 'absolute', left: 60, right: 60, top: 1690, textAlign: 'center', fontSize: 52, fontWeight: 800, color: '#ffd400', lineHeight: 1.35, ...stroke(5)}}>اكتب إجابتك في التعليقات 👇</div>

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: '#000', direction: 'ltr'}}>
        <div style={{height: '100%', width: `${Math.max(0, 1 - frame / thinkFrames) * 100}%`, background: color}} />
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<EpisodeProps> = (props) => {
  const riddles = pickReelRiddles(props);
  const total = riddles.length;
  return (
    <AbsoluteFill style={{fontFamily: `${FONT}, 'Noto Color Emoji', sans-serif`, direction: 'rtl', backgroundColor: '#0b0920'}}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={REEL_INTRO * FPS}>
          <ReelCard title={CHANNEL} subtitle={`${total} ألغاز في أقل من دقيقة.. هل تحلها؟`} bg="linear-gradient(160deg,#1b2a6b 0%,#3b1d7a 55%,#0f1640 100%)" />
        </Series.Sequence>
        {riddles.map((seg, i) => (
          <Series.Sequence key={i} durationInFrames={reelSec(seg) * FPS}>
            <ChannelPill />
            <ReelRiddle seg={seg} index={i} total={total} />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={REEL_OUTRO * FPS}>
          <ReelCard title="كم لغزًا حللت؟" subtitle={`اشترك في ${CHANNEL}`} bg="linear-gradient(160deg,#0d6b4f 0%,#16a34a 55%,#07382a 100%)" />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
