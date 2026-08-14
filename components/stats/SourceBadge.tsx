import styles from './SourceBadge.module.css';

export type StatsSource = 'jetbrains' | 'stackoverflow';

type SourceBadgeProps = {
  source: StatsSource;
};

const sourceLabels: Record<StatsSource, string> = {
  jetbrains: 'JetBrains AI Pulse',
  stackoverflow: 'Stack Overflow Pulse Survey',
};

export function SourceBadge({ source }: SourceBadgeProps) {
  const label = sourceLabels[source];

  return (
    <span className={styles.badge} data-source={source} title={label} aria-label={`Source: ${label}`}>
      {source === 'jetbrains' ? (
        <span className={styles.jetbrainsMark} aria-hidden="true">
          JB
        </span>
      ) : (
        <svg className={styles.stackOverflowMark} viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 18.4h10.8v1.7H6.5zM7.2 14.9l9.7 2 .35-1.7-9.7-2zM8.7 11.3l9 4.15.72-1.55-9-4.16zM11 7.9l7.7 6.3 1.08-1.33-7.7-6.3zM14.2 5l5.7 8.1 1.4-.98-5.7-8.1z" />
          <path d="M4 16.8h1.7v5h12.6v-5H20V23H4z" />
        </svg>
      )}
    </span>
  );
}
