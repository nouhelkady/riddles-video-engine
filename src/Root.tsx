import React from 'react';
import {Composition} from 'remotion';
import {Episode} from './Episode';
import {EpisodeProps, FPS, HEIGHT, WIDTH, segmentFrames} from './types';
import sample from './sample-episode.json';

export const Root: React.FC = () => (
  <Composition
    id="Episode"
    component={Episode}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={FPS * 60}
    defaultProps={sample as EpisodeProps}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, props.segments.reduce((sum, s) => sum + segmentFrames(s, props), 0)),
    })}
  />
);
