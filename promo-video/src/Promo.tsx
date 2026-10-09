import { AbsoluteFill, Audio, Series, interpolate, staticFile, useVideoConfig } from 'remotion';
import { C, SCENES } from './theme';
import { CategoriesScene, CtaScene, ExploreScene, HookScene, LogoScene, QuestionScene, SellerScene, TrustScene } from './scenes';

export function Promo() {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.surface }}>
      <Audio
        src={staticFile('music.wav')}
        volume={(f) => interpolate(f, [durationInFrames - 40, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
      <Series>
        <Series.Sequence durationInFrames={SCENES.hook}>
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.question}>
          <QuestionScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.logo}>
          <LogoScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.explore}>
          <ExploreScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.categories}>
          <CategoriesScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.trust}>
          <TrustScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.seller}>
          <SellerScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.cta}>
          <CtaScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
