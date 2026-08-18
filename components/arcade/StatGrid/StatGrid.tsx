import styles from './StatGrid.module.css';

type Stat = {
  value: string;
  label: string;
};

type StatGridProps = {
  items: readonly Stat[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`}>
          <dd>{item.value}</dd>
          <dt>{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
