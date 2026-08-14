import { AnimatedMetricValue } from './AnimatedMetricValue';
import { SourceBadge, type StatsSource } from './SourceBadge';
import styles from './MetricCard.module.css';

type MetricCardTone = 'acid' | 'cyan' | 'hot';

type MetricCardProps = {
  index: string;
  title: string;
  value: number;
  description: string;
  footnote: string;
  source: StatsSource;
  tone?: MetricCardTone;
  suffix?: string;
  prefix?: string;
};

export function MetricCard({
  index,
  title,
  value,
  description,
  footnote,
  source,
  tone = 'cyan',
  suffix,
  prefix,
}: MetricCardProps) {
  return (
    <article className={styles.card} data-tone={tone}>
      <div className={styles.topRow}>
        <span className={styles.index}>
          {index} / {title}
        </span>
        <SourceBadge source={source} />
      </div>

      <AnimatedMetricValue value={value} suffix={suffix} prefix={prefix} />
      <p className={styles.description}>{description}</p>
      <small className={styles.footnote}>{footnote}</small>
    </article>
  );
}
