import Link from 'next/link';

import styles from './ArcadeHeader.module.css';

type ArcadeHeaderProps = {
  brand?: string;
  homeHref?: string;
  status?: string;
  meta?: string;
};

export function ArcadeHeader({
  brand = 'UHANKU_OS',
  homeHref = '/',
  status = 'SYSTEM ONLINE',
  meta = 'PORTO / PT',
}: ArcadeHeaderProps) {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} href={homeHref} aria-label={`${brand} home`}>
        <span aria-hidden="true">U</span>
        {brand}
      </Link>

      <div className={styles.status}>
        <span className="arcade-signal-dot" aria-hidden="true" />
        {status}
      </div>

      <div className={styles.meta}>{meta}</div>
    </header>
  );
}
