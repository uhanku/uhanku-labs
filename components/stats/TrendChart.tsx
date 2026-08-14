import type { CSSProperties } from 'react';

import styles from './TrendChart.module.css';

export type TrendChartPoint = {
  label: string;
  value: number;
};

type TrendChartProps = {
  points: readonly TrendChartPoint[];
  ariaLabel: string;
  min?: number;
  max?: number;
  tone?: 'acid' | 'cyan' | 'hot';
  valueSuffix?: string;
};

const width = 600;
const height = 250;
const leftPadding = 80;
const rightPadding = 80;
const topPadding = 42;
const bottomPadding = 45;

export function TrendChart({
  points,
  ariaLabel,
  min = 0,
  max = 100,
  tone = 'acid',
  valueSuffix = '%',
}: TrendChartProps) {
  const usableWidth = width - leftPadding - rightPadding;
  const usableHeight = height - topPadding - bottomPadding;
  const range = Math.max(max - min, 1);

  const coordinates = points.map((point, index) => {
    const x =
      points.length <= 1
        ? width / 2
        : leftPadding + (usableWidth * index) / (points.length - 1);
    const normalized = Math.min(Math.max((point.value - min) / range, 0), 1);
    const y = topPadding + usableHeight * (1 - normalized);

    return { ...point, x, y };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(' ');
  const style = {
    '--trend-columns': points.length,
  } as CSSProperties;

  return (
    <div className={styles.chart} data-tone={tone} style={style} aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
        <line
          className={styles.baseline}
          x1={leftPadding - 20}
          y1={height - bottomPadding}
          x2={width - rightPadding + 20}
          y2={height - bottomPadding}
        />
        <polyline className={styles.line} pathLength="1" points={polyline} />
        {coordinates.map((point) => (
          <circle className={styles.point} cx={point.x} cy={point.y} key={point.label} r="6" />
        ))}
      </svg>

      <div className={styles.labels}>
        {points.map((point) => (
          <div key={point.label}>
            <strong>
              {point.value}
              {valueSuffix}
            </strong>
            <span>{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
