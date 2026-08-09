import type { ReactNode } from 'react';

import styles from './ArcadePanel.module.css';

type ArcadePanelTone = 'purple' | 'cyan' | 'acid' | 'hot';

type ArcadePanelProps = {
  children: ReactNode;
  tone?: ArcadePanelTone;
  className?: string;
};

export function ArcadePanel({
  children,
  tone = 'purple',
  className = '',
}: ArcadePanelProps) {
  return (
    <section
      className={`${styles.panel} arcade-corner-frame ${className}`.trim()}
      data-tone={tone}
    >
      {children}
    </section>
  );
}
