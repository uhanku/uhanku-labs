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
    'An interactive visual history of AI progress from 2020 to 2026, from GAN photorealism and diffusion to multimodal agents, audiovisual generation, and robotics.',
};

const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'] as const;

const images2020: readonly HorizontalMediaItem[] = [
  {
    id: '2020-ddpm-faces',
    eyebrow: '2020 · DDPM',
    title: 'Portrait grid',
    description:
      'Official sample faces, showing how strong narrow-domain photorealism already looked.',
    sourceHref: 'https://hojonathanho.github.io/diffusion/',
    media: {
      kind: 'image',
      src: '/media/ddpm-faces-grid-6f3012c4c08f.png',
      alt: 'Grid of synthetic human face examples from a 2020 official diffusion project page',
    },
  },
  {
    id: '2020-ddpm-composite',
    eyebrow: '2020 · DDPM PAPER',
    title: 'Portraits plus tiny class samples',
    description:
      'A single official figure that captures both the promise and the limits of 2020 generation.',
    sourceHref: 'https://arxiv.org/abs/2006.11239',
    media: {
      kind: 'image',
      src: '/media/ddpm-figure-composite-06a25ba5ba10.png',
      alt: 'Official DDPM figure with generated CelebA-HQ portrait samples and CIFAR-10 examples',
    },
  },
  {
    id: '2020-ddpm-cifar',
    eyebrow: '2020 · EARLY DIFFUSION',
    title: 'Small category samples',
    description:
      'Primitive by later standards, but this is part of the diffusion foundation modern systems are built on.',
    sourceHref: 'https://arxiv.org/abs/2006.11239',
    media: {
      kind: 'image',
      src: '/media/ddpm-cifar-grid-52e8e634eba1.png',
      alt: 'Tiny CIFAR-10 class samples from the 2020 DDPM paper',
    },
  },
] as const;

const images2021: readonly HorizontalMediaItem[] = [
  {
    id: '2021-dalle-mosaic',
    eyebrow: '2021 · DALL·E',
    title: 'Generative concept mosaic',
    description:
      'OpenAI’s early visual shorthand for text-to-image breadth: many concepts, many styles, one language-driven system.',
    sourceHref: 'https://openai.com/index/dall-e/?output=1',
    media: {
      kind: 'image',
      src: '/media/dalle-mosaic-sphere-762a4ed22227.png',
      alt: 'Official DALL-E 2021 visual made from many generated images arranged as a mosaic sphere',
      contain: true,
    },
  },
  {
    id: '2021-dalle-fox-soft',
    eyebrow: '2021 · DALL·E',
    title: 'Prompted scene, soft rendering',
    description:
      'The idea is recognizable, but the texture and structure still feel loose and dreamlike.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/media/dalle-fox-field-soft-a20529669e8f.png',
      alt: 'Painterly fox in a field from an official early DALL-E example',
    },
  },
  {
    id: '2021-dalle-fox-vivid',
    eyebrow: '2021 · DALL·E',
    title: 'Concept over precision',
    description:
      '2021 images make the prompting breakthrough obvious, even before the image quality becomes truly polished.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/media/dalle-fox-field-vivid-51b5708791b7.png',
      alt: 'Highly colorful early DALL-E fox image in a grassy field',
    },
  },
] as const;

const images2022: readonly HorizontalMediaItem[] = [
  {
    id: '2022-dalle2-space-horse',
    eyebrow: '2022 · DALL·E 2',
    title: 'Astronaut on horseback',
    description: 'One of the clearest examples of improved concept alignment and image realism.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/media/dalle2-astronaut-horse-space-04721e97ab71.png',
      alt: 'DALL-E 2 example of an astronaut riding a white horse in space',
    },
  },
  {
    id: '2022-dalle2-mars-horse',
    eyebrow: '2022 · DALL·E 2',
    title: 'Prompt variation, same core idea',
    description:
      'Different framing and setting, but the prompt intent stays stable in a much more usable way.',
    sourceHref: 'https://openai.com/index/dall-e-2/?output=1',
    media: {
      kind: 'image',
      src: '/media/dalle2-astronaut-horse-mars-6ab6c4806c4f.png',
      alt: 'DALL-E 2 example of an astronaut riding a horse in a red landscape',
    },
  },
  {
    id: '2022-imagen-rocket',
    eyebrow: '2022 · IMAGEN',
    title: 'Conceptual prompt following',
    description: 'Whimsical combinations become much easier to visualize cleanly and legibly.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/media/imagen-brain-rocket-50af99bab5a4.png',
      alt: 'Imagen example of a cartoon brain riding a red rocket through space',
    },
  },
  {
    id: '2022-imagen-chess',
    eyebrow: '2022 · IMAGEN',
    title: 'Broader composition range',
    description:
      'Scenes feel more coherent and much more ready for real-world creative use.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/media/imagen-cat-chess-902f6778a9d3.png',
      alt: 'Imagen example of a cat playing chess',
    },
  },
  {
    id: '2022-imagen-corgi',
    eyebrow: '2022 · IMAGEN',
    title: 'Polish and visual confidence',
    description:
      'By this point the outputs already feel much closer to the modern text-to-image experience.',
    sourceHref: 'https://imagen.research.google/',
    media: {
      kind: 'image',
      src: '/media/imagen-corgi-city-66f9e9645621.png',
      alt: 'Imagen example of a corgi wearing sunglasses in a city street',
    },
  },
] as const;

const videos2023: readonly HorizontalMediaItem[] = [
  {
    id: '2023-runway-gen2',
    eyebrow: 'VIDEO / 2023',
    title: 'Runway Gen-2',
    description:
      'Runway Gen-2 creates and transforms videos from text prompts, images, or existing video clips.',
    sourceHref: 'https://runway.com/research/gen-2',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/gen2-7f903d844b51.mp4',
      ariaLabel: 'Runway Gen-2 generated video example',
    },
  },
  {
    id: '2025-veo-kalshi',
    eyebrow: 'VIDEO / 2025',
    title: 'Veo 3 · Kalshi',
    description:
      'A commercial workflow merging AI with cultural references: historic moments and odds in a Veo 3 Kalshi ad.',
    sourceHref: 'https://aistudio.google.com/models/veo',
    sourceLabel: 'VEO ↗',
    media: {
      kind: 'video',
      src: '/media/d0saunno1yeyw8fi-628c08fad602.mp4',
      ariaLabel: 'Veo 3 Kalshi generated video example',
    },
  },
  {
    id: '2024-sora-space-man',
    eyebrow: 'VIDEO / 2024',
    title: 'Sora · Space Mans',
    description:
      'A movie trailer featuring the adventures of the 30-year-old space mans.',
    sourceHref: 'https://openai.com/index/sora/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/mitten-astronaut-7be2e0f50378.mp4',
      ariaLabel: 'OpenAI Sora space man generated video example',
    },
  },
  {
    id: '2024-sora-tokyo',
    eyebrow: 'VIDEO / 2024',
    title: 'Sora · Tokyo walk',
    description: 'A stylish woman walks down a Tokyo street filled with warm glowing neon.',
    sourceHref: 'https://openai.com/index/sora/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/tokyo-walk-9153b2bce8ca.mp4',
      ariaLabel: 'OpenAI Sora Tokyo walk generated video example',
    },
  },
  {
    id: '2025-veo-sailor',
    eyebrow: 'VIDEO / 2025',
    title: 'Veo 3 · Sailor',
    description: 'A realistic depiction of a sailor on the ocean.',
    sourceHref: 'https://deepmind.google/models/veo/',
    sourceLabel: 'OFFICIAL PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/veo-veo-3-sailor-a1a1eba5e9d4.webm',
      ariaLabel: 'Veo 3 sailor generated video example',
    },
  },
] as const;

const videos2024: readonly HorizontalMediaItem[] = [
  {
    id: '2024-project-astra',
    eyebrow: 'VIDEO / 2024',
    title: 'Project Astra',
    description:
      'A prototype assistant that can see, understand context, remember, and take actions in real time.',
    sourceHref: 'https://deepmind.google/models/project-astra/',
    sourceLabel: 'OFFICIAL ASTRA PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/project-astra-our-vision-for-the-future-of-ai-assistants-46e578b1c4df.mp4',
      ariaLabel: 'Project Astra assistant vision video example',
    },
  },
  {
    id: '2024-gpt4o',
    eyebrow: 'VIDEO / 2024',
    title: 'GPT-4o',
    description:
      'Sora is OpenAI’s text-to-video model that turns natural-language prompts into realistic, dynamic videos.',
    sourceHref: 'https://openai.com/index/hello-gpt-4o/',
    sourceLabel: 'OFFICIAL GPT-4O PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/openais-chat-gpt-4o-demo-in-under-60-seconds-5405b34fc8d6.mp4',
      ariaLabel: 'OpenAI Chat GPT-4o demo in under 60 seconds video example',
    },
  },
] as const;

const videos2025: readonly HorizontalMediaItem[] = [
  {
    id: '2025-gamma',
    eyebrow: 'VIDEO / 2025',
    title: 'Gamma',
    description:
      'An AI-powered platform that turns ideas or text into polished presentations, documents, websites, and social content.',
    sourceHref: 'https://gamma.app/',
    sourceLabel: 'OFFICIAL GAMMA PAGE ↗',
    media: {
      kind: 'video',
      src: '/media/gamma-what-s-your-big-idea-gamma-720p-h264-f982da9e9e8c.mp4',
      ariaLabel: "Gamma: What's Your Big Idea? video example",
    },
  },
  {
    id: '2025-elevenlabs',
    eyebrow: 'VIDEO / 2025',
    title: 'ElevenLabs Agents',
    description:
      'Human-like, multilingual AI agents on WhatsApp automate customer support and workflows instantly and at scale.',
    sourceHref: 'https://elevenlabs.io/blog/elevenlabs-agents-whatsapp-support',
    sourceLabel: 'OFFICIAL PAGE ↗',
media: {
      kind: 'video',
      src: '/media/ai-agents-on-whatsapp-scalable-support-with-elevenlabs-257e858aba05.mp4',
      ariaLabel: 'AI Agents on WhatsApp: Scalable Support with ElevenLabs video example',
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
      kind: 'video',
      src: '/media/chg-chg-4xfa4ms8eqq9e-c31fe3d8c159.webm',
      ariaLabel: 'Seedance 2.5 multi-shot generated video example',
    },
  },
] as const;

export default function Aie2020To2026Page() {
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
                become a natural-language image tool. The gallery below shows that split clearly:
                convincing faces on one end, tiny early diffusion samples on the other.
              </p>
            }
            secondary={
              <p>
                <strong>StyleGAN2</strong> represented the peak of the GAN era, while{' '}
                <strong>DDPM</strong> introduced the denoising approach that would later power
                modern diffusion systems.
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
                introText="Swipe or scroll horizontally. These are authentic examples from official 2020 project and paper materials."
              />
            }
          />

          <ProgressYearSection
            year="2021"
            era="LANGUAGE STARTS STEERING IMAGES"
            title="Words become the control surface."
            description={
              <p>
                In 2021, image generation stopped being only about sampling one visual
                distribution well. The important shift was that{' '}
                <strong>language started steering the output.</strong> The results were still
                rougher than what came next, but the visual idea was now being described in words
                instead of hidden in a latent vector.
              </p>
            }
            secondary={
              <p>
                <strong>DALL·E</strong>, <strong>VQGAN + CLIP</strong>, and <strong>GLIDE</strong>{' '}
                signaled the same transition: prompting, concept mixing, and text-conditioned
                generation were becoming real.
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
                introText="Scroll across the examples to see the transition from broad visual concept collections to direct prompt-style imagery."
              />
            }
          />

          <ProgressYearSection
            year="2022"
            era="MODERN TEXT-TO-IMAGE ARRIVES"
            title="The jump becomes obvious."
            description={
              <p>
                By 2022, the pieces finally came together. Diffusion was stronger, language
                understanding was better, and the output no longer felt like a lab curiosity.
                This is the year when modern text-to-image starts looking familiar.
              </p>
            }
            secondary={
              <p>
                <strong>DALL·E 2</strong>, <strong>Imagen</strong>, and the broader 2022 diffusion
                wave made the progression visually undeniable: better prompt following, stronger
                composition, cleaner aesthetics, and much wider generality.
              </p>
            }
            signalLabel="THE 2022 FEELING"
            signalText="General-purpose image generation arrives. The system is no longer just illustrating a concept, it is plausibly composing a scene."
            signalTone="hot"
            watchLabel="WHAT TO NOTICE"
            watchText="Compare the 2022 cards with 2020 and 2021. The quality, semantic accuracy, and polish are now immediately visible without needing a technical explanation."
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
              people could guide it with everyday language. By 2022, text-to-image tools became
              faster, easier to use, and available to many more people.
            </p>
          </div>

          <ProgressYearSection
            year="2023"
            era="GENERATIVE VIDEO"
            title="AI starts turning ideas into video."
            description={
              <p>
                Generative AI moved beyond still images. A simple text prompt, a single image, or
                an existing video clip could now become the starting point for an entirely new
                video, with AI creating the scenes, movement, and style.
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
                vision, and text in a single experience. Google&apos;s Project Astra showed a
                similar vision of the future: an assistant that can look through a camera,
                understand what is happening around you, remember what it has seen, and respond as
                you move through the world.
              </p>
            }
            signalLabel="PROJECT ASTRA · GPT-4o"
            signalText="AI moves from answering prompts to understanding the world around you."
            watchText="The interaction becomes continuous. Instead of uploading something and waiting for an answer, you can show, speak and ask questions while the AI follows along in real time."
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
                AI agents moved from demos into real workflows. They could plan across multiple
                steps, use tools, write and run code, browse for information, and keep working
                toward a goal with less human supervision.{' '}
                <strong>AI was becoming a collaborator that could take action.</strong>
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
                Seedance 2.5 pushed video generation beyond isolated moments. It could build
                connected stories across multiple shots, extend them over multiple rounds,
                preserve characters and environments, and use images, video, and audio as
                references. <strong>Generation is becoming a creative workflow.</strong>
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
            The broader AI story follows the same trajectory: from isolated outputs toward systems
            that can perceive, reason, plan, act, observe, and correct.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>AI PROGRESS / 2020–2026</strong>
          <p>
            Built from the supplied research summary. All image and video examples are stored
            locally in managed media storage.
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