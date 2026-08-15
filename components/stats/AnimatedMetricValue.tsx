'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import styles from './AnimatedMetricValue.module.css';

type AnimatedMetricValueProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
};

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener('change', onChange);

  return () => mediaQuery.removeEventListener('change', onChange);
}

function getReducedMotionPreference() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotionPreference() {
  return false;
}

export function AnimatedMetricValue({
  value,
  suffix = '%',
  prefix = '',
  duration = 650,
}: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    getServerReducedMotionPreference,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
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
  }, [duration, prefersReducedMotion, value]);

  const renderedValue = prefersReducedMotion ? value : displayValue;

  return (
    <strong className={styles.value} aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {renderedValue}
      {suffix}
    </strong>
  );
}
