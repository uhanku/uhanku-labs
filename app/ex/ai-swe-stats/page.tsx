import type { Metadata } from 'next';

import { MetricCard, TrendChart, type TrendChartPoint } from '@/components/stats';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'AI in the Developer Workflow',
  description:
    'A minimal visual summary of AI adoption, daily use, learning, and verification habits among developers.',
};

const learningTrend: readonly TrendChartPoint[] = [
  { label: '2024', value: 37 },
  { label: '2025', value: 44 },
  { label: '2026', value: 64 },
] as const;

export default function AiSweStatsPage() {
  return (
    <main className={styles.page}>
      <header className={`${styles.hero} arcade-reveal`}>
        <p className={styles.eyebrow}>AI × SOFTWARE ENGINEERING</p>
        <h1>
          AI is normal now.
          <br />
          Blind trust is not.
        </h1>
        <p className={styles.intro}>
          Developers are using AI regularly and increasingly every day, but almost
          nobody is relying on it alone.
        </p>
      </header>

      <section
        className={`${styles.headlineGrid} arcade-reveal arcade-reveal--2`}
        aria-label="Key AI developer statistics"
      >
        <MetricCard
          index="01"
          title="ADOPTION"
          value={90}
          description="regularly use AI for coding or development at work"
          footnote="JetBrains · Jan 2026 · 10,000+ professionals"
          source="jetbrains"
          tone="acid"
        />

        <MetricCard
          index="02"
          title="DAILY USE"
          value={58}
          description="use AI at work every day"
          footnote="Stack Overflow · Feb 2026 · ~900 respondents"
          source="stackoverflow"
          tone="cyan"
        />

        <MetricCard
          index="03"
          title="VERIFICATION"
          value={1}
          description="reported using AI alone"
          footnote="Most developers still combine AI with docs, search, or communities"
          source="stackoverflow"
          tone="hot"
        />
      </section>

      <section
        className={`${styles.learningCard} arcade-reveal arcade-reveal--3`}
        aria-labelledby="learning-title"
      >
        <div className={styles.learningCopy}>
          <span className={styles.sectionLabel}>04 / LEARNING</span>
          <h2 id="learning-title">AI is becoming part of how developers learn.</h2>
          <p>Developer use of AI for learning rose sharply from 2024 to 2026.</p>
        </div>

        <TrendChart
          points={learningTrend}
          ariaLabel="Developers using AI to learn: 37% in 2024, 44% in 2025, 64% in 2026"
          tone="acid"
        />
      </section>

      <section className={`${styles.takeaway} arcade-reveal arcade-reveal--4`}>
        <span className={styles.takeawayLabel}>THE CORE SIGNAL</span>
        <p>
          AI has become part of the standard developer workflow, but it still sits
          beside documentation, search, communities, and human judgment.
        </p>
      </section>

      <footer className={styles.footer}>
        <p>
          Different surveys use different populations and definitions of AI use.
          Read each percentage within its own source context.
        </p>

        <div className={styles.sources}>
          <a
            href="https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/"
            target="_blank"
            rel="noreferrer"
          >
            JetBrains AI Pulse ↗
          </a>
          <a
            href="https://stackoverflow.blog/2026/03/16/domain-expertise-still-wanted-the-latest-trends-in-ai/"
            target="_blank"
            rel="noreferrer"
          >
            Stack Overflow Pulse ↗
          </a>
        </div>
      </footer>
    </main>
  );
}