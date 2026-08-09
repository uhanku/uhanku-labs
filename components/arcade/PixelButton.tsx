import Link from 'next/link';
import type { ReactNode } from 'react';

import styles from './PixelButton.module.css';

type PixelButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'hot';
};

export function PixelButton({
  href,
  children,
  variant = 'primary',
}: PixelButtonProps) {
  return (
    <Link className={styles.button} data-variant={variant} href={href}>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
