import type { Metadata } from "next";

import {
  AdoptionTimeline,
  MetricCard,
  TrendChart,
  type AdoptionTimelineItem,
  type TrendChartPoint,
} from "@/components/stats";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "AI in the Developer Workflow",
  description:
    "A focused visual summary of AI adoption, daily use, learning, and verification habits among developers.",
};

const adoptionHistory: readonly AdoptionTimelineItem[] = [
  {
    year: "2020",
    label: "GPT-3 API",
    detail: "private beta",
    kind: "milestone",
  },
  {
    year: "2021",
    label: "Copilot",
    detail: "technical preview",
    kind: "milestone",
  },
  {
    year: "2022",
    label: "Copilot",
    detail: "general availability",
    kind: "milestone",
  },
  {
    year: "2023",
    label: "70%",
    detail: "use / plan to use",
    kind: "survey",
  },
  {
    year: "2024",
    label: "76%",
    detail: "use / plan to use",
    kind: "survey",
  },
  {
    year: "2025",
    label: "84%",
    detail: "use / plan to use",
    kind: "survey",
  },
  {
    year: "2026",
    label: "90%",
    detail: "regular use at work",
    kind: "current",
  },
] as const;

const learningTrend: readonly TrendChartPoint[] = [
  { label: "2024", value: 37 },
  { label: "2025", value: 44 },
  { label: "2026", value: 64 },
] as const;

export default function WhyNowReasonOneStatsPage() {
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
          Developers are using AI regularly and increasingly every day, but
          almost nobody is relying on it alone.
        </p>
      </header>

      <section
        className={styles.headlineGrid}
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
          footnote="Most still combine AI with docs, search, or communities"
          source="stackoverflow"
          tone="hot"
        />
      </section>

      <section
        className={`${styles.adoptionHistory} arcade-reveal arcade-reveal--2`}
      >
        <header className={styles.adoptionHeader}>
          <span className={styles.sectionLabel}>ADOPTION / 2020 → 2026</span>
          <h2>Experiment to Workflow.</h2>
        </header>

        <AdoptionTimeline
          items={adoptionHistory}
          ariaLabel="Developer AI adoption history from 2020 to 2026"
        />

        <p className={styles.adoptionNote}>
          2020–2022 mark major developer-AI product milestones. Survey
          percentages begin in 2023; the 2026 JetBrains measure is stricter and
          not directly identical to Stack Overflow&apos;s “use or plan to use”
          question.
        </p>
      </section>

      <section
        className={`${styles.learningCard} arcade-reveal arcade-reveal--3`}
        aria-labelledby="learning-title"
      >
        <div className={styles.learningCopy}>
          <span className={styles.sectionLabel}>04 / LEARNING</span>
          <h2 id="learning-title">
            AI is becoming part of how developers learn.
          </h2>
          <p>
            Developer use of AI for learning rose sharply from 2024 to 2026.
          </p>
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
          AI has become part of the standard developer workflow, but it still
          sits beside documentation, search, communities, and human judgment.
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
            JetBrains ↗
          </a>
          <a
            href="https://survey.stackoverflow.co/2025/ai"
            target="_blank"
            rel="noreferrer"
          >
            Stack Overflow ↗
          </a>
          <a
            href="https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
