import {
  ArcadeHeader,
  ArcadePanel,
  PixelButton,
  SectionIndex,
  StatGrid,
} from '@/components/arcade';

import styles from './page.module.css';

const stats = [
  { value: '06+', label: 'Years building' },
  { value: '04', label: 'Active systems' },
  { value: '99', label: 'Curiosity' },
] as const;

const foundations = [
  {
    index: '01',
    title: 'Dark grid canvas',
    text: 'A near-black base, restrained purple depth, 32px grid and low-opacity scanlines create the environment without fighting the content.',
    tone: 'purple' as const,
  },
  {
    index: '02',
    title: 'Signal colours',
    text: 'Acid is primary and active, cyan is technical and informative, hot pink carries emphasis, and purple provides structural depth.',
    tone: 'cyan' as const,
  },
  {
    index: '03',
    title: 'Two type voices',
    text: 'Geist handles readable UI and prose. Press Start 2P is reserved for compact labels, statuses, metadata and control language.',
    tone: 'acid' as const,
  },
  {
    index: '04',
    title: 'Pixel geometry',
    text: 'Thin borders, square panels and hard offset shadows create the arcade identity. Motion stays small, fast and purposeful.',
    tone: 'hot' as const,
  },
] as const;

export default function Home() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <ArcadeHeader meta="NEXT.JS / DESIGN BASE" />

      <main id="main-content" className={`${styles.main} arcade-container`}>
        <section className={styles.hero}>
          <div className={`${styles.heroCopy} arcade-reveal`}>
            <SectionIndex>00 / DESIGN FOUNDATION</SectionIndex>
            <p className="arcade-label">UHANKU SYSTEM / NEXT APP ROUTER</p>
            <h1>Build the system, not just the screen.</h1>
            <p className={styles.intro}>
              This starter carries the visual language of the existing Uhanku site
              into a reusable Next.js structure. Tokens remain global, while
              components own their layout and interaction styling.
            </p>

            <div className={styles.actions}>
              <PixelButton href="#foundations">Explore foundation</PixelButton>
              <PixelButton href="#structure" variant="ghost">
                View structure
              </PixelButton>
            </div>
          </div>

          <ArcadePanel className={`${styles.systemPanel} arcade-reveal arcade-reveal--2`} tone="cyan">
            <div className={styles.panelHeader}>
              <span>APPLICATION PROFILE</span>
              <span>READY</span>
            </div>

            <dl className={styles.systemData}>
              <div>
                <dt>Framework</dt>
                <dd>Next.js / App Router</dd>
              </div>
              <div>
                <dt>Styling</dt>
                <dd>Tokens + CSS Modules</dd>
              </div>
              <div>
                <dt>Primary font</dt>
                <dd>Geist</dd>
              </div>
              <div>
                <dt>Signal font</dt>
                <dd>Press Start 2P</dd>
              </div>
            </dl>

            <StatGrid items={stats} />
          </ArcadePanel>
        </section>

        <section className={styles.section} id="foundations">
          <header className={styles.sectionHeader}>
            <div>
              <SectionIndex tone="cyan">01 / VISUAL LANGUAGE</SectionIndex>
              <h2>Foundations</h2>
              <p>
                The new application should feel related to uhanku.com without
                depending on page-specific CSS from the original project.
              </p>
            </div>
            <code>src/styles/*</code>
          </header>

          <div className={styles.foundationGrid}>
            {foundations.map((foundation, index) => (
              <ArcadePanel
                className={`arcade-reveal arcade-reveal--${Math.min(index + 1, 4)}`}
                key={foundation.title}
                tone={foundation.tone}
              >
                <article className={styles.foundationCard}>
                  <span>{foundation.index}</span>
                  <h3>{foundation.title}</h3>
                  <p>{foundation.text}</p>
                </article>
              </ArcadePanel>
            ))}
          </div>
        </section>

        <section className={styles.section} id="structure">
          <header className={styles.sectionHeader}>
            <div>
              <SectionIndex tone="acid">02 / PROJECT SHAPE</SectionIndex>
              <h2>Reusable by default</h2>
              <p>
                Route code composes primitives instead of inheriting one giant
                stylesheet. This keeps the arcade identity consistent as the app
                grows into new features.
              </p>
            </div>
            <code>src/components/arcade/*</code>
          </header>

          <ArcadePanel tone="acid">
            <div className={styles.structurePanel}>
              <pre aria-label="Recommended project structure">
{`src/
  app/
    layout.tsx
    page.tsx
  components/
    arcade/
      ArcadeHeader.tsx
      ArcadePanel.tsx
      PixelButton.tsx
      SectionIndex.tsx
      StatGrid.tsx
  design-system/
    README.md
  styles/
    tokens.css
    foundation.css
    effects.css`}
              </pre>

              <div>
                <span className="arcade-label">RULE / 001</span>
                <h3>Visual primitives stay generic.</h3>
                <p>
                  Feature-specific cards, forms and data views should compose these
                  primitives rather than being added to the design-system folder.
                </p>
                <PixelButton href="/" variant="hot">
                  Start building
                </PixelButton>
              </div>
            </div>
          </ArcadePanel>
        </section>
      </main>
    </div>
  );
}
