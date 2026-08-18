import type { CSSProperties } from 'react';

import styles from './AdoptionTimeline.module.css';

export type AdoptionTimelineItem = {
  year: string;
  label: string;
  detail: string;
  kind?: 'milestone' | 'survey' | 'current';
};

type AdoptionTimelineProps = {
  items: readonly AdoptionTimelineItem[];
  ariaLabel?: string;
};

export function AdoptionTimeline({
  items,
  ariaLabel = 'Adoption timeline',
}: AdoptionTimelineProps) {
  const style = {
    '--timeline-columns': items.length,
  } as CSSProperties;

  return (
    <div className={styles.timeline} style={style} aria-label={ariaLabel}>
      <div className={styles.line} aria-hidden="true" />

      {items.map((item) => (
        <article className={styles.event} data-kind={item.kind ?? 'milestone'} key={item.year}>
          <span className={styles.dot} aria-hidden="true" />
          <strong className={styles.year}>{item.year}</strong>
          <p className={styles.label}>{item.label}</p>
          <small className={styles.detail}>{item.detail}</small>
        </article>
      ))}
    </div>
  );
}
