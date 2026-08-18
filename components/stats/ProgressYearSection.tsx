import type { ReactNode } from 'react';

import styles from './ProgressYearSection.module.css';

export type ProgressYearSectionProps = {
  year: string;
  era: string;
  title: string;
  description: ReactNode;
  secondary?: ReactNode;
  signalLabel: string;
  signalText: ReactNode;
  signalTone?: 'acid' | 'cyan' | 'hot';
  watchLabel?: string;
  watchText: ReactNode;
  media: ReactNode;
  final?: boolean;
};

export function ProgressYearSection({
  year,
  era,
  title,
  description,
  secondary,
  signalLabel,
  signalText,
  signalTone = 'acid',
  watchLabel = 'WATCH FOR',
  watchText,
  media,
  final = false,
}: ProgressYearSectionProps) {
  return (
    <article
      id={`y${year}`}
      className={`${styles.chapter} ${final ? styles.final : ''}`}
      data-progress-year={year}
    >
      <div className={styles.copy}>
        <div className={styles.meta}>
          <span className={styles.year}>{year}</span>
          <span className={styles.era}>{era}</span>
        </div>

        <h2>{title}</h2>
        <div className={styles.description}>{description}</div>
        {secondary ? <div className={styles.secondary}>{secondary}</div> : null}

        <div className={styles.signal} data-tone={signalTone}>
          <span>{signalLabel}</span>
          <strong>{signalText}</strong>
        </div>

        <div className={styles.watchFor}>
          <span>{watchLabel}</span>
          <div>{watchText}</div>
        </div>
      </div>

      <div className={styles.media}>{media}</div>
    </article>
  );
}
