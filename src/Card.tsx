import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardSegment} from './types';

const THEMES: Record<CardSegment['type'], {bg: string; accent: string}> = {
  intro: {bg: 'linear-gradient(135deg,#1b2a6b 0%,#3b1d7a 55%,#0f1640 100%)', accent: '#ffd400'},
  level: {bg: 'linear-gradient(135deg,#b3001b 0%,#ff3b30 60%,#7a0012 100%)', accent: '#ffffff'},
  break: {bg: 'linear-gradient(135deg,#0b5fa8 0%,#22a7f0 60%,#063a69 100%)', accent: '#ffe66d'},
  outro: {bg: 'linear-gradient(135deg,#0d6b4f 0%,#16a34a 55%,#07382a 100%)', accent: '#ffd400'},
};

const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px #000`, paintOrder: 'stroke fill'});

export const Card: React.FC<{seg: CardSegment}> = ({seg}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const theme = THEMES[seg.type];
  const pop = spring({frame, fps, config: {damping: 12, mass: 0.6}});
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const marks = Array.from({length: 14}, (_, i) => i);
  return (
    <AbsoluteFill style={{background: theme.bg, opacity: fadeOut, alignItems: 'center', justifyContent: 'center'}}>
      <Audio src={staticFile('sfx/whoosh.wav')} volume={0.7} />
      {seg.vo ? (
        <Sequence from={8}>
          <Audio src={staticFile(`episode/${seg.vo}`)} />
        </Sequence>
      ) : null}
      {marks.map((i) => {
        const x = (i * 137) % 100;
        const y = (i * 61 + 13) % 100;
        const drift = Math.sin((frame + i * 20) / 25) * 14;
        return (
          <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: 70 + (i % 4) * 30, fontWeight: 900, color: 'rgba(255,255,255,0.10)', transform: `translateY(${drift}px) rotate(${(i % 5) * 12 - 24}deg)`}}>
            ؟
          </div>
        );
      })}
      <div style={{transform: `scale(${pop})`, textAlign: 'center', padding: '0 120px'}}>
        <div style={{fontSize: seg.type === 'level' ? 150 : 124, fontWeight: 900, color: '#fff', lineHeight: 1.25, ...stroke(10)}}>{seg.title}</div>
        {seg.subtitle ? (
          <div style={{marginTop: 34, fontSize: 60, fontWeight: 700, color: theme.accent, lineHeight: 1.4, ...stroke(6)}}>{seg.subtitle}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
