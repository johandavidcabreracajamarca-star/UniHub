import { Composition } from 'remotion';
import { Promo } from './Promo';
import { FPS, TOTAL } from './theme';

export const RemotionRoot = () => (
  <Composition id="UniHubPromo" component={Promo} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
