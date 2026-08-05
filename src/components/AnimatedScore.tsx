import React, { useEffect, useState } from 'react';

interface AnimatedScoreProps {
  value: number | null | undefined;
  decimals?: number;
  showPlus?: boolean;
  suffix?: string;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({
  value,
  decimals = 1,
  showPlus = false,
  suffix = '',
}) => {
  const validValue = typeof value === 'number' && Number.isFinite(value)
    ? value
    : null;
  const [displayValue, setDisplayValue] = useState<number | null>(
    validValue === null ? null : 0,
  );

  useEffect(() => {
    if (validValue === null) {
      setDisplayValue(null);
      return;
    }

    const durationMs = 650;
    const startedAt = performance.now();
    let animationFrame = 0;

    const tick = (now: number) => {
      const linearProgress = Math.min(1, (now - startedAt) / durationMs);
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
      setDisplayValue(validValue * easedProgress);

      if (linearProgress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [validValue]);

  if (displayValue === null) return <>--</>;

  const prefix = showPlus && displayValue > 0 ? '+' : '';
  return <>{`${prefix}${displayValue.toFixed(decimals)}${suffix}`}</>;
};
