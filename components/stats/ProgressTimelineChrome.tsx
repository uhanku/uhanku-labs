'use client';

import { useEffect, useState } from 'react';

import styles from './ProgressTimelineChrome.module.css';

type ProgressTimelineChromeProps = {
  years: readonly string[];
  brand?: string;
  endHref?: string;
  endLabel?: string;
};

export function ProgressTimelineChrome({
  years,
  brand = 'AI / 20→26',
  endHref = '#patterns',
  endLabel = 'PATTERNS ↓',
}: ProgressTimelineChromeProps) {
  const [activeYear, setActiveYear] = useState(years[0] ?? '');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(Math.max(ratio, 0), 1));
    };

    const chapters = [...document.querySelectorAll<HTMLElement>('[data-progress-year]')];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const year = (visible[0]?.target as HTMLElement | undefined)?.dataset.progressYear;
        if (year) setActiveYear(year);
      },
      {
        rootMargin: '-25% 0px -50% 0px',
        threshold: [0.05, 0.25, 0.5],
      },
    );

    chapters.forEach((chapter) => observer.observe(chapter));
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <>
      <div className={styles.progressRail} aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>

      <header className={styles.header}>
        <a className={styles.brand} href="#top">
          {brand}
        </a>

        <nav className={styles.yearNav} aria-label="Timeline">
          {years.map((year) => (
            <a
              href={`#y${year}`}
              className={activeYear === year ? styles.active : undefined}
              aria-current={activeYear === year ? 'true' : undefined}
              key={year}
            >
              {year.slice(-2)}
            </a>
          ))}
        </nav>

        <a className={styles.endLink} href={endHref}>
          {endLabel}
        </a>
      </header>
    </>
  );
}
