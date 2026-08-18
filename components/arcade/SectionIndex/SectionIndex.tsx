import type { ReactNode } from 'react';

import styles from './SectionIndex.module.css';

type SectionIndexProps = {
  children: ReactNode;
  tone?: 'hot' | 'cyan' | 'acid';
};

export function SectionIndex({ children, tone = 'hot' }: SectionIndexProps) {
  return (
    <span className={styles.index} data-tone={tone}>
      {children}
    </span>
  );
}
