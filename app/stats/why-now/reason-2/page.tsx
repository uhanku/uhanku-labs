import type { Metadata } from 'next';

import {
  HorizontalMediaCarousel,
  ProgressTimelineChrome,
  ProgressYearSection,
  type HorizontalMediaItem,
} from '@/components/stats';

import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'AI Progress 2020–2026',
  description:
    'A visual history of AI progress from constrained image generation to multimodal assistants, agents, and complete creative workflows.',
};

const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'] as const;

const images2020: readonly HorizontalMediaItem[] = [
  {
    id: '2020-ddpm-faces',
    eyebrow: '2020 · DDPM',
    title: 'Portrait grid',
    description:
      'Official sample faces showing how strong narrow-domain photorealism could already look.',
    sourceHref: 'https://hojonathanho.github.io/diffusion/',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2020/ddpm-faces-grid.webp',
      alt: 'Grid of synthetic human face examples from the 2020 DDPM project page',
    },
  },
  {
    id: '2020-ddpm-composite',
    eyebrow: '2020 · DDPM PAPER',
    title: 'Portraits plus tiny class samples',
    description:
      'One official figure captures both the promise and the limits of 2020 image generation.',
    sourceHref: 'https://arxiv.org/abs/2006.11239',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2020/ddpm-figure-composite.webp',
      alt: 'DDPM paper figure with generated CelebA-HQ portraits and CIFAR-10 samples',
    },
  },
  {
    id: '2020-ddpm-cifar',
    eyebrow: '2020 · EARLY DIFFUSION',
    title: 'Small category samples',
    description:
      'Primitive by later standards, but part of the diffusion foundation that modern systems would build on.',
    sourceHref: 'https://arxiv.org/abs/2006.11239',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2020/ddpm-cifar-grid.webp',
      alt: 'Small CIFAR-10 image samples from the 2020 DDPM paper',
    },
  },
] as const;

const images2021: readonly HorizontalMediaItem[] = [
  {
    id: '2021-dalle-mosaic',
    eyebrow: '2021 · DALL·E',
    title: 'Generative concept mosaic',
    description:
      'An early visual shorthand for text-to-image breadth: many concepts, styles, and combinations driven by language.',
    sourceHref: 'https://openai.com/index/dall-e/?output=1',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2021/dalle-mosaic-sphere.webp',
      alt: 'DALL-E visual made from many generated images arranged as a mosaic sphere',
      contain: true,
    },
  },
  {
    id: '2021-dalle-fox-soft',
    eyebrow: '2021 · DALL·E',
    title: 'Prompted scene, soft rendering',
    description:
      'The idea is recognizable, but texture and structure still feel loose and dreamlike.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2021/dalle-fox-field-soft.webp',
      alt: 'Painterly early DALL-E fox image in a field',
    },
  },
  {
    id: '2021-dalle-fox-vivid',
    eyebrow: '2021 · DALL·E',
    title: 'Concept over precision',
    description:
      'The prompting breakthrough is obvious even before image quality becomes truly polished.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2021/dalle-fox-field-vivid.webp',
      alt: 'Highly colorful early DALL-E fox image in a grassy field',
    },
  },
] as const;

const images2022: readonly HorizontalMediaItem[] = [
  {
    id: '2022-dalle2-space-horse',
    eyebrow: '2022 · DALL·E 2',
    title: 'Astronaut on horseback',
    description:
      'A clear jump in concept alignment and the ability to compose an implausible idea as a coherent image.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2022/dalle2-astronaut-horse-space.webp',
      alt: 'DALL-E 2 example of an astronaut riding a white horse in space',
    },
  },
  {
    id: '2022-dalle2-mars-horse',
    eyebrow: '2022 · DALL·E 2',
    title: 'Prompt variation, same core idea',
    description:
      'Different framing and setting, while the requested subject remains much more stable and usable.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2022/dalle2-astronaut-horse-mars.webp',
      alt: 'DALL-E 2 example of an astronaut riding a horse in a red landscape',
    },
  },
  {
    id: '2022-imagen-rocket',
    eyebrow: '2022 · IMAGEN',
    title: 'Conceptual prompt following',
    description:
      'Whimsical combinations become easier to visualize cleanly as language understanding improves.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2022/imagen-brain-rocket.webp',
      alt: 'Imagen example of a cartoon brain riding a red rocket through space',
    },
  },
  {
    id: '2022-imagen-chess',
    eyebrow: '2022 · IMAGEN',
    title: 'Broader composition range',
    description:
      'Scenes feel more coherent, general-purpose, and much closer to a practical creative tool.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2022/imagen-cat-chess.webp',
      alt: 'Imagen example of a cat playing chess in a surreal painted scene',
    },
  },
  {
    id: '2022-imagen-corgi',
    eyebrow: '2022 · IMAGEN',
    title: 'Polish and visual confidence',
    description:
      'By this point the outputs already resemble the modern text-to-image experience people recognize today.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/stats/why-now/reason-2/images/2022/imagen-corgi-city.webp',
      alt: 'Imagen example of a corgi wearing sunglasses in a busy city street',
    },
  },
] as const;

const videos2023: readonly HorizontalMediaItem[] = [
  {
    id: '2023-runway-gen2',
    eyebrow: 'VIDEO / 2023',
    title: 'Runway Gen-2',
    description:
      'Text, images, or existing footage could become the starting point for a newly generated video.',
    sourceHref: 'https://runway.com/research/gen-2',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: 'https://d3phaj0sisr2ct.cloudfront.net/research/gen1/videos/newyork/newyorkapt.webm',
      ariaLabel: 'Runway Gen-2 generated video example',
    },
  },
  {
    id: '2024-sora-space-man',
    eyebrow: 'VIDEO / 2024',
    title: 'Sora · Space man',
    description:
      'A cinematic movie-trailer style example showing the rapid jump in scene coherence and visual direction.',
    sourceHref: 'https://openai.com/index/sora/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: 'https://cdn.openai.com/sora/videos/space-man.mp4',
      ariaLabel: 'OpenAI Sora space man generated video example',
    },
  },
  {
    id: '2024-sora-tokyo',
    eyebrow: 'VIDEO / 2024',
    title: 'Sora · Tokyo walk',
    description:
      'A neon-lit walking scene where generated video begins to look more like footage than a research artifact.',
    sourceHref: 'https://openai.com/index/sora/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: 'https://cdn.openai.com/sora/videos/tokyo-walk.mp4',
      ariaLabel: 'OpenAI Sora Tokyo walk generated video example',
    },
  },
  {
    id: '2025-veo-kalshi',
    eyebrow: 'VIDEO / 2025',
    title: 'Veo 3 · Commercial production',
    description:
      'Video generation begins showing up in finished commercial workflows rather than isolated model demos.',
    sourceHref: 'https://aistudio.google.com/models/veo',
    sourceLabel: 'VEO ↗',
    media: {
      kind: 'external',
      href: 'https://aistudio.google.com/models/veo',
      title: 'Veo 3',
      description: 'Open the latest audiovisual generation showcase.',
    },
  },
  {
    id: '2025-veo-sailor',
    eyebrow: 'AUDIO + VIDEO / 2025',
    title: 'Veo 3 · Sailor',
    description:
      'Native speech, ambience, and sound effects become part of the generated scene instead of a separate post-production step.',
    sourceHref: 'https://deepmind.google/models/veo/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'external',
      href: 'https://deepmind.google/models/veo/',
      title: 'Veo 3 audiovisual generation',
      description: 'The official showcase includes the sailor dialogue example.',
    },
  },
] as const;

const videos2024: readonly HorizontalMediaItem[] = [
  {
    id: '2024-project-astra',
    eyebrow: 'VIDEO / 2024',
    title: 'Project Astra',
    description:
      'A prototype assistant continuously takes in audio and video, reasons about its surroundings, and responds in real time.',
    sourceHref: 'https://deepmind.google/models/project-astra/',
    sourceLabel: 'OFFICIAL ASTRA PAGE ↗',
    media: {
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/nXVvvRhiGjI',
      title: 'Project Astra: Our vision for the future of AI assistants',
    },
  },
  {
    id: '2024-gpt4o',
    eyebrow: 'VIDEO / 2024',
    title: 'GPT-4o',
    description:
      'Voice, vision, and text move toward one fast multimodal interaction rather than separate AI features.',
    sourceHref: 'https://openai.com/index/hello-gpt-4o/',
    sourceLabel: 'OFFICIAL GPT-4O PAGE ↗',
    media: {
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/OGo42CdXqE8',
      title: 'ChatGPT-4o demo in under 60 seconds',
    },
  },
] as const;

const videos2025: readonly HorizontalMediaItem[] = [
  {
    id: '2025-gamma',
    eyebrow: 'VIDEO / 2025',
    title: 'Gamma',
    description:
      'Ideas or text can be turned into polished presentations, documents, websites, and social content with far less manual design work.',
    sourceHref: 'https://gamma.app/',
    sourceLabel: 'OFFICIAL GAMMA PAGE ↗',
    media: {
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/-CU5DdGZdC8',
      title: "Gamma: What's Your Big Idea?",
    },
  },
  {
    id: '2025-elevenlabs',
    eyebrow: 'VIDEO / 2025',
    title: 'ElevenLabs Agents',
    description:
      'Conversational agents begin taking real actions inside existing channels such as WhatsApp, not just answering questions.',
    sourceHref: 'https://elevenlabs.io/blog/elevenlabs-agents-whatsapp-support',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'embed',
      src: 'https://www.youtube-nocookie.com/embed/8eO3oytgQBU',
      title: 'AI Agents on WhatsApp: Scalable Support with ElevenLabs',
    },
  },
] as const;

const videos2026: readonly HorizontalMediaItem[] = [
  {
    id: '2026-seedance',
    eyebrow: 'MULTI-SHOT / 2026',
    title: 'ByteDance Seedance 2.5',
    description:
      'Media systems can preserve characters, camera language, sound, and story across multiple connected shots.',
    sourceHref:
      'https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5',
    sourceLabel: 'OPEN OFFICIAL FILM ↗',
    media: {
      kind: 'external',
      href: 'https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5',
      title: 'Seedance 2.5',
      description: 'Watch the official end-to-end creative film and long-form examples.',
    },
  },
] as const;

export default function WhyNowReasonTwoStatsPage() {
  return (
    <>
      <ProgressTimelineChrome years={years} />

      <main className={styles.page} id="top">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>AI PROGRESS / 2020–2026</p>
            <h1>
              From teaching AI
              <span>what images look like</span>
              to directing
              <span>an audiovisual story.</span>
            </h1>
            <p className={styles.heroLead}>
              Seven years of AI progress, viewed through the thing that makes the
              change easiest to feel: <strong>what the machines could actually produce and do.</strong>
            </p>
          </div>

          <aside className={styles.heroContrast} aria-label="2020 and 2026 contrast">
            <div>
              <span>2020</span>
              <strong>GENERATE</strong>
              <small>Learn one visual distribution well</small>
            </div>
            <div className={styles.heroArrow}>→</div>
            <div>
              <span>2026</span>
              <strong>DIRECT</strong>
              <small>Plan, generate, edit and extend a sequence</small>
            </div>
          </aside>
        </section>

        <section className={styles.watchLens} aria-labelledby="watch-lens-title">
          <div>
            <p className={styles.sectionLabel}>HOW TO COMPARE</p>
            <h2 id="watch-lens-title">Don&apos;t compare only image quality.</h2>
          </div>
          <div className={styles.lensList} role="list">
            {[
              'realism',
              'generality',
              'language control',
              'editability',
              'consistency',
              'temporal control',
              'audio',
            ].map((item) => (
              <span role="listitem" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className={styles.timeline} aria-label="AI progress timeline">
          <ProgressYearSection
            year="2020"
            era="CONSTRAINED PHOTOREALISM → EARLY DIFFUSION"
            title="Impressive, but still experimental."
            description={
              <p>
                In 2020, the best image generation could already look surprisingly good,
                especially inside narrow categories such as portraits. But the field had not yet
                become a natural-language image tool. The gallery shows that split clearly:
                convincing faces on one end, tiny early diffusion samples on the other.
              </p>
            }
            secondary={
              <p>
                <strong>StyleGAN2</strong> represented the peak of the GAN era, while <strong>DDPM</strong>{' '}
                introduced the denoising approach that would later power modern diffusion systems.
              </p>
            }
            signalLabel="THE 2020 FEELING"
            signalText="AI can generate impressive images, but mostly inside constrained domains, not from open-ended prompts."
            watchLabel="WHAT TO NOTICE"
            watchText="Look for strong portrait realism, then compare it with the much smaller, more primitive category samples. The gap inside a single year is part of the story."
            media={
              <HorizontalMediaCarousel
                id="gallery-2020"
                items={images2020}
                ariaLabel="2020 AI image-generation examples"
                introEyebrow="VISUAL ARCHIVE / 2020"
                introText="Swipe or scroll horizontally through authentic examples from official 2020 project and paper materials."
              />
            }
          />

          <ProgressYearSection
            year="2021"
            era="LANGUAGE STARTS STEERING IMAGES"
            title="Words become the control surface."
            description={
              <p>
                In 2021, image generation stopped being only about sampling one visual distribution
                well. The important shift was that <strong>language started steering the output.</strong>
              </p>
            }
            secondary={
              <p>
                <strong>DALL·E</strong>, <strong>VQGAN + CLIP</strong>, and <strong>GLIDE</strong>{' '}
                signaled the same transition: prompting, concept mixing, and text-conditioned generation
                were becoming real.
              </p>
            }
            signalLabel="THE 2021 FEELING"
            signalText="AI starts trying to draw the concept you describe, even if the result is still painterly, fuzzy, or surreal."
            signalTone="cyan"
            watchLabel="WHAT TO NOTICE"
            watchText="Compared with 2020, the point is not just realism. It is compositionality. You can feel language taking control of the scene."
            media={
              <HorizontalMediaCarousel
                id="gallery-2021"
                items={images2021}
                ariaLabel="2021 AI image-generation examples"
                introEyebrow="VISUAL ARCHIVE / 2021"
                introText="Scroll across the examples to see the transition from broad visual concepts to direct prompt-style imagery."
              />
            }
          />

          <ProgressYearSection
            year="2022"
            era="MODERN TEXT-TO-IMAGE ARRIVES"
            title="The jump becomes obvious."
            description={
              <p>
                By 2022, diffusion was stronger, language understanding was better, and the output no
                longer felt like a lab curiosity. This is the year when modern text-to-image starts
                looking familiar.
              </p>
            }
            secondary={
              <p>
                <strong>DALL·E 2</strong>, <strong>Imagen</strong>, and the broader 2022 diffusion wave made
                the progression visually undeniable: better prompt following, stronger composition,
                cleaner aesthetics, and much wider generality.
              </p>
            }
            signalLabel="THE 2022 FEELING"
            signalText="General-purpose image generation arrives. The system is no longer just illustrating a concept, it is plausibly composing a scene."
            signalTone="hot"
            watchLabel="WHAT TO NOTICE"
            watchText="Compare these cards with 2020 and 2021. The quality, semantic accuracy, and polish are now immediately visible without a technical explanation."
            media={
              <HorizontalMediaCarousel
                id="gallery-2022"
                items={images2022}
                ariaLabel="2022 AI image-generation examples"
                introEyebrow="VISUAL ARCHIVE / 2022"
                introText="The gallery becomes broader and more polished. Scroll through it to feel the moment modern text-to-image really clicks."
              />
            }
          />

          <div className={styles.interlude}>
            <p className={styles.sectionLabel}>THE 2020–2022 FOUNDATION</p>
            <blockquote>
              <strong>AI image generation starts to work.</strong>
              <br />
              <strong>Words become the way we guide it.</strong>
              <br />
              <strong>Creating images becomes faster and easier.</strong>
            </blockquote>
            <p className={styles.interludeNote}>
              The story is simple: in 2020, AI began creating more convincing images. In 2021,
              people could guide it with everyday language. By 2022, text-to-image tools became faster,
              easier to use, and available to many more people.
            </p>
          </div>

          <ProgressYearSection
            year="2023"
            era="GENERATIVE VIDEO"
            title="AI starts turning ideas into video."
            description={
              <p>
                Generative AI moved beyond still images. A simple text prompt, a single image, or an
                existing video clip could now become the starting point for an entirely new video,
                with AI creating the scenes, movement, and style.
              </p>
            }
            signalLabel="TEXT · IMAGE · VIDEO"
            signalText="Different ways to start. A new video as the result."
            watchText="Videos become more cinematic and expressive, but people, objects, and details can still change unexpectedly as the scene moves."
            media={
              <HorizontalMediaCarousel
                id="video-gallery-2023"
                items={videos2023}
                ariaLabel="2023 to 2025 generative video examples"
                layout="video"
              />
            }
          />

          <ProgressYearSection
            year="2024"
            era="ASSISTANT"
            title={'AI learns to see, hear, speak and “think”.'}
            description={
              <p>
                GPT-4o made conversations with AI feel faster and more natural, combining voice,
                vision, and text in a single experience. Google&apos;s Project Astra showed a similar
                vision of the future: an assistant that can look through a camera, understand what is
                happening around you, remember what it has seen, and respond as you move through the world.
              </p>
            }
            signalLabel="PROJECT ASTRA · GPT-4o"
            signalText="AI moves from answering prompts to understanding the world around you."
            watchText="The interaction becomes continuous. Instead of uploading something and waiting, you can show, speak, and ask questions while the AI follows along in real time."
            media={
              <HorizontalMediaCarousel
                id="video-gallery-2024"
                items={videos2024}
                ariaLabel="2024 AI assistant examples"
                layout="video"
              />
            }
          />

          <ProgressYearSection
            year="2025"
            era="ACT"
            title="AI starts acting instead of merely answering."
            description={
              <p>
                AI agents moved from demos into real workflows. They could plan across multiple steps,
                use tools, write and run code, browse for information, and keep working toward a goal
                with less human supervision. <strong>AI was becoming a collaborator that could take action.</strong>
              </p>
            }
            signalLabel="AI AGENTS"
            signalText="From single prompts to multi-step execution."
            signalTone="cyan"
            watchText="Agents coordinating tools, delegating tasks to other agents, maintaining context over long-running work, and completing entire workflows from a single objective."
            media={
              <HorizontalMediaCarousel
                id="video-gallery-2025"
                items={videos2025}
                ariaLabel="2025 AI workflow and agent examples"
                layout="video"
              />
            }
          />

          <ProgressYearSection
            year="2026"
            era="SUSTAIN"
            title="From clips to complete creative works."
            description={
              <p>
                Seedance 2.5 pushed video generation beyond isolated moments. It can build connected
                stories across multiple shots, extend them over multiple rounds, preserve characters and
                environments, and use images, video, and audio as references.{' '}
                <strong>Generation is becoming a creative workflow.</strong>
              </p>
            }
            signalLabel="SEEDANCE 2.5"
            signalText="30-second audiovisual stories in a single generation."
            signalTone="hot"
            watchText="Multi-minute stories with consistent characters, scenes, and sound, guided by multimodal references and refined with timestamp-level editing."
            media={
              <HorizontalMediaCarousel
                id="video-gallery-2026"
                items={videos2026}
                ariaLabel="2026 Seedance 2.5 example"
                layout="video"
              />
            }
            final
          />
        </section>

        <section className={styles.patterns} id="patterns">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>THE BIGGER PATTERN</p>
            <h2>The bottleneck keeps moving.</h2>
          </div>

          <div className={styles.patternGrid}>
            <article>
              <span>01</span>
              <h3>Generate</h3>
              <p>First the breakthrough was producing a plausible output at all.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Reason</h3>
              <p>Then models began spending more computation to solve difficult tasks.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Act</h3>
              <p>Agents started using software and completing multi-step work.</p>
            </article>
            <article>
              <span>04</span>
              <h3>Sustain</h3>
              <p>Now the challenge is coherence, recovery, and objectives maintained over time.</p>
            </article>
          </div>

          <div className={styles.patternStats}>
            <div>
              <strong>53%</strong>
              <span>population adoption in roughly three years for generative AI</span>
            </div>
            <div>
              <strong>12 → 66%</strong>
              <span>reported OSWorld agent-performance jump</span>
            </div>
            <div>
              <strong>88%</strong>
              <span>latest organizational AI-adoption figure cited in the research</span>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <p className={styles.sectionLabel}>2020 → 2026</p>
          <blockquote>
            “Make this portrait move.”
            <span>became</span>
            “Create and edit a coherent multi-shot audiovisual story.”
          </blockquote>
          <p>
            The broader AI story follows the same trajectory: from isolated outputs toward systems that
            can perceive, reason, plan, act, observe, and correct.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>AI PROGRESS / 2020–2026</strong>
          <p>
            Built from the supplied research summary. Image examples are stored locally; later media
            examples use official externally hosted demos because the standalone source ZIP does not bundle its video files.
          </p>
        </div>

        <nav aria-label="Primary sources">
          <a href="https://hojonathanho.github.io/diffusion/" target="_blank" rel="noreferrer">DDPM</a>
          <a href="https://openai.com/index/dall-e/?output=1" target="_blank" rel="noreferrer">DALL·E</a>
          <a href="https://openai.com/index/dall-e-2/?output=1" target="_blank" rel="noreferrer">DALL·E 2</a>
          <a href="https://imagen.research.google/" target="_blank" rel="noreferrer">Imagen</a>
          <a href="https://runway.com/research/gen-2" target="_blank" rel="noreferrer">Runway</a>
          <a href="https://openai.com/index/sora/" target="_blank" rel="noreferrer">OpenAI</a>
          <a href="https://deepmind.google/technologies/veo/" target="_blank" rel="noreferrer">DeepMind</a>
          <a href="https://seed.bytedance.com/" target="_blank" rel="noreferrer">ByteDance</a>
        </nav>
      </footer>
    </>
  );
}
