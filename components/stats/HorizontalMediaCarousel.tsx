'use client';

import Image from 'next/image';
import { useRef, type KeyboardEvent } from 'react';

import styles from './HorizontalMediaCarousel.module.css';

export type HorizontalMediaItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  sourceHref: string;
  sourceLabel?: string;
  media:
    | {
        kind: 'image';
        src: string;
        alt: string;
        contain?: boolean;
      }
    | {
        kind: 'video';
        src: string;
        ariaLabel: string;
      }
    | {
        kind: 'embed';
        src: string;
        title: string;
      }
    | {
        kind: 'external';
        href: string;
        title: string;
        description?: string;
      };
};

type HorizontalMediaCarouselProps = {
  id: string;
  items: readonly HorizontalMediaItem[];
  ariaLabel: string;
  layout?: 'gallery' | 'video';
  introEyebrow?: string;
  introText?: string;
  hint?: string;
};

export function HorizontalMediaCarousel({
  id,
  items,
  ariaLabel,
  layout = 'gallery',
  introEyebrow,
  introText,
  hint = 'SCROLL →',
}: HorizontalMediaCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const card = scroller.querySelector<HTMLElement>(`[data-media-card]`);
    const track = scroller.querySelector<HTMLElement>(`[data-media-track]`);
    const trackStyles = track ? window.getComputedStyle(track) : null;
    const gap = Number.parseFloat(trackStyles?.columnGap || trackStyles?.gap || '0');
    const amount = (card?.getBoundingClientRect().width ?? scroller.clientWidth * 0.85) + gap;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    scroller.scrollBy({
      left: amount * direction,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  const scrollToCard = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = [...scroller.querySelectorAll<HTMLElement>('[data-media-card]')];
    const target = cards[index];
    if (!target) return;

    const left = scroller.scrollLeft + target.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    scroller.scrollTo({
      left,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByCard(1);
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByCard(-1);
    }
  };

  return (
    <div className={styles.root} data-layout={layout}>
      {introEyebrow || introText ? (
        <div className={styles.intro}>
          <div>
            {introEyebrow ? <span className={styles.introEyebrow}>{introEyebrow}</span> : null}
            {introText ? <p>{introText}</p> : null}
          </div>
          <span className={styles.hint}>{hint}</span>
        </div>
      ) : null}

      <div className={styles.shell}>
        <button
          className={styles.arrow}
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-controls={id}
          aria-label={`Scroll ${ariaLabel} left`}
        >
          ←
        </button>

        <div
          className={styles.scroller}
          id={id}
          ref={scrollerRef}
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
        >
          <div className={styles.track} data-media-track>
            {items.map((item, index) => (
              <article className={styles.card} data-media-card key={item.id}>
                <div className={styles.media} data-kind={item.media.kind}>
                  {item.media.kind === 'image' ? (
                    <Image
                      src={item.media.src}
                      alt={item.media.alt}
                      fill
                      sizes={layout === 'gallery' ? '(max-width: 720px) 86vw, 410px' : '70vw'}
                      className={item.media.contain ? styles.contain : undefined}
                    />
                  ) : null}

                  {item.media.kind === 'video' ? (
                    <video
                      src={item.media.src}
                      aria-label={item.media.ariaLabel}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      onEnded={() => scrollToCard(index + 1)}
                    />
                  ) : null}

                  {item.media.kind === 'embed' ? (
                    <iframe
                      src={item.media.src}
                      title={item.media.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : null}

                  {item.media.kind === 'external' ? (
                    <a className={styles.externalMedia} href={item.media.href} target="_blank" rel="noreferrer">
                      <span>OFFICIAL MEDIA</span>
                      <strong>{item.media.title}</strong>
                      {item.media.description ? <small>{item.media.description}</small> : null}
                      <em>OPEN FILM ↗</em>
                    </a>
                  ) : null}
                </div>

                {layout === 'video' ? (
                  <div className={styles.cardIndex}>
                    {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                  </div>
                ) : null}

                <div className={styles.caption}>
                  <span>{item.eyebrow}</span>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                  <a href={item.sourceHref} target="_blank" rel="noreferrer">
                    {item.sourceLabel ?? 'SOURCE ↗'}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button
          className={styles.arrow}
          type="button"
          onClick={() => scrollByCard(1)}
          aria-controls={id}
          aria-label={`Scroll ${ariaLabel} right`}
        >
          →
        </button>
      </div>
    </div>
  );
}
