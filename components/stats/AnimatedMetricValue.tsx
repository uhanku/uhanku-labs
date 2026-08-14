'use client';

import { useEffect, useState } from 'react';

import styles from './AnimatedMetricValue.module.css';

type AnimatedMetricValueProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
};

export function AnimatedMetricValue({
  value,
  suffix = '%',
  prefix = '',
  duration = 650,
}: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reduceMotion.matches) {
      setDisplayValue(value);
      return undefined;
    }

    const startedAt = performance.now();
    let frameId = 0;

    const frame = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(frame);
      }
    };

    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return (
    <strong className={styles.value} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {displayValue}
      {suffix}
    </strong>
  );
}
