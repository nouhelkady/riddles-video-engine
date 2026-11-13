import React from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {Card} from './Card';
import {Riddle} from './Riddle';
import {ensureFonts, FONT} from './fonts';
import {EpisodeProps, riddleTiming, segmentFrames} from './types';

ensureFonts();

export const Episode: React.FC<EpisodeProps> = (props) => (
  <AbsoluteFill style={{backgroundColor: '#101426', fontFamily: `${FONT}, 'Noto Color Emoji', sans-serif`, direction: 'rtl'}}>
    <Series>
      {props.segments.map((seg, i) => (
        <Series.Sequence key={i} durationInFrames={segmentFrames(seg, props)}>
          {seg.type === 'riddle' ? (
            <Riddle seg={seg} thinkSeconds={riddleTiming(seg, props).think} />
          ) : (
            <Card seg={seg} />
          )}
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
