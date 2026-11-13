export type CardSegment = {
  type: 'intro' | 'level' | 'break' | 'outro';
  title: string;
  subtitle?: string;
  seconds?: number;
  /** narration file inside public/episode, and its length in seconds */
  vo?: string;
  voSec?: number;
};

export type RiddleSegment = {
  type: 'riddle';
  /** image = AI picture with numbered options, emojiGrid = find the duplicate, text = spoken riddle card */
  kind: 'image' | 'emojiGrid' | 'text';
  n: number;
  title: string;
  /** file name inside public/episode */
  image?: string;
  /** second picture shown at the reveal (optional) */
  revealImage?: string;
  /** how many numbered choices are drawn over the picture (0 = none) */
  options?: number;
  /** number of the right choice (1-based) */
  answer?: number;
  /** short evidence text shown at the reveal */
  clue?: string;
  /** answer as words, for riddles without numbered choices */
  answerText?: string;
  /** false = leave the answer for the comments */
  reveal: boolean;
  /** text riddles: the riddle itself */
  text?: string;
  /** narration that reads the question, and its length in seconds */
  voQuestion?: string;
  voQuestionSec?: number;
  /** narration that gives the answer, and its length in seconds */
  voAnswer?: string;
  voAnswerSec?: number;
  /** emojiGrid: optional fixed list of emojis; otherwise generated from the riddle number */
  emojis?: string[];
};

export type Segment = CardSegment | RiddleSegment;

export type EpisodeProps = {
  episodeId?: string;
  title?: string;
  /** seconds of thinking time per riddle (the clock ticks once per second) */
  thinkSeconds: number;
  /** seconds the answer stays on screen */
  revealSeconds: number;
  segments: Segment[];
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const CARD_DEFAULTS: Record<CardSegment['type'], number> = {intro: 5, level: 3, break: 6, outro: 6};

/** Thinking time never ends before the narrator has finished the question plus a few quiet seconds. */
export const riddleTiming = (s: RiddleSegment, p: EpisodeProps) => {
  const q = s.voQuestionSec ?? 0;
  const a = s.voAnswerSec ?? 0;
  return {
    think: Math.max(p.thinkSeconds, q > 0 ? Math.ceil(q + 6) : 0),
    reveal: Math.max(p.revealSeconds, a > 0 ? Math.ceil(a + 1.5) : 0),
  };
};

export const segmentSeconds = (s: Segment, p: EpisodeProps): number => {
  if (s.type === 'riddle') {
    const t = riddleTiming(s, p);
    return t.think + t.reveal;
  }
  return Math.max(s.seconds ?? CARD_DEFAULTS[s.type], s.voSec ? s.voSec + 0.8 : 0);
};

export const segmentFrames = (s: Segment, p: EpisodeProps): number => Math.round(segmentSeconds(s, p) * FPS);
