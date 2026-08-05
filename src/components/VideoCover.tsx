import React from 'react';

/**
 * Standalone video cover page (/cover.html).
 *
 * Text mirrors PlayModeIntroCard (same fonts/classes/animation). Vendor
 * icons sit on an ellipse centered on the text block, evenly spaced every
 * 40 degrees - colored brand marks, mildly transparent, slightly tilted.
 */

const line = (delayMs: number): React.CSSProperties => ({
  animationDelay: `${delayMs}ms`,
});

interface CoverIconSpec {
  file: string;
  alt: string;
  /** Angle on the ring; -90 = top center, then clockwise. */
  angleDeg: number;
  size: number;
  rotateDeg: number;
  opacity: number;
}

/** Ellipse radii as % of the text block (width / height). */
const RING_RX_PERCENT = 82;
const RING_RY_PERCENT = 95;

const COVER_ICONS: readonly CoverIconSpec[] = [
  { file: 'meta.svg', alt: 'Meta', angleDeg: -90, size: 72, rotateDeg: 4, opacity: 0.82 },
  { file: 'openai.svg', alt: 'OpenAI', angleDeg: -50, size: 88, rotateDeg: 7, opacity: 0.88 },
  { file: 'xai.svg', alt: 'Grok', angleDeg: -10, size: 70, rotateDeg: -6, opacity: 0.84 },
  { file: 'zhipu.svg', alt: 'Z.ai', angleDeg: 30, size: 66, rotateDeg: 8, opacity: 0.78 },
  { file: 'alibaba.svg', alt: 'Qwen', angleDeg: 70, size: 70, rotateDeg: -5, opacity: 0.8 },
  { file: 'deepseek.svg', alt: 'DeepSeek', angleDeg: 110, size: 68, rotateDeg: -10, opacity: 0.78 },
  { file: 'google.svg', alt: 'Gemini', angleDeg: 150, size: 80, rotateDeg: 4, opacity: 0.8 },
  { file: 'anthropic.svg', alt: 'Claude', angleDeg: 190, size: 80, rotateDeg: -8, opacity: 0.86 },
  { file: 'moonshot.svg', alt: 'Kimi', angleDeg: 230, size: 64, rotateDeg: 9, opacity: 0.76 },
];

export const VideoCover: React.FC = () => {
  const now = new Date();
  const dateLabel = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  return (
    <div className="play-mode-scene-enter relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white font-brand-mono">
      <div className="relative inline-block select-none text-center">
        {COVER_ICONS.map((icon) => {
          const rad = (icon.angleDeg * Math.PI) / 180;
          const left = 50 + RING_RX_PERCENT * Math.cos(rad);
          const top = 50 + RING_RY_PERCENT * Math.sin(rad);
          return (
            <img
              key={icon.file}
              src={`/vendor-icons/${icon.file}`}
              alt={icon.alt}
              aria-hidden="true"
              className="pointer-events-none absolute select-none"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: icon.size,
                opacity: icon.opacity,
                transform: `translate(-50%, -50%) rotate(${icon.rotateDeg}deg)`,
              }}
            />
          );
        })}

        <h1
          className="title-card-line-enter relative text-7xl font-black tracking-tight text-neutral-950 sm:text-8xl"
          style={line(120)}
        >
          LLMpk
        </h1>
        <div
          className="title-card-line-enter relative mt-14 text-3xl font-bold tracking-widest text-neutral-700 sm:text-4xl"
          style={line(340)}
        >
          {dateLabel}
        </div>
      </div>
    </div>
  );
};
