import { useCallback, useEffect, useMemo, useState } from 'react';
import { LiquidGlass } from './components/LiquidGlass';
import {
  Slider,
  Section,
  Segmented,
  ColorField,
  PresetChip,
  ToggleChip,
} from './components/ControlPanel';
import { PreviewStage, BACKGROUNDS } from './components/PreviewStage';
import { ExportModal } from './components/ExportModal';
import { DEFAULT_GLASS, type GlassState } from './lib/types';
import {
  buildHtml,
  buildCss,
  buildStandaloneDemo,
  JQUERY_PLUGIN,
} from './lib/exportCode';

type Shape = GlassState['shape'];
type PreviewMode = 'card' | 'button' | 'nav' | 'widget';

const MODES: { id: PreviewMode; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'button', label: 'Button' },
  { id: 'nav', label: 'Navbar' },
  { id: 'widget', label: 'Widget' },
];

const PRESETS: { name: string; values: Partial<GlassState> }[] = [
  {
    name: 'iOS 26',
    values: {
      scale: -120, chroma: 5, border: 0.08, mapBlur: 14, blur: 2.5, saturate: 1.55,
      radius: 28, fallbackBlur: 18, tintColor: '#ffffff', tintOpacity: 0.14,
      specular: 55, shadow: 42, shape: 'rounded',
    },
  },
  {
    name: 'visionOS',
    values: {
      scale: -140, chroma: 7, border: 0.1, mapBlur: 18, blur: 4, saturate: 1.7,
      radius: 36, fallbackBlur: 22, tintColor: '#e8eef8', tintOpacity: 0.18,
      specular: 70, shadow: 55, shape: 'rounded',
    },
  },
  {
    name: 'Subtle',
    values: {
      scale: -70, chroma: 2, border: 0.12, mapBlur: 10, blur: 6, saturate: 1.3,
      radius: 20, fallbackBlur: 14, tintColor: '#ffffff', tintOpacity: 0.1,
      specular: 35, shadow: 28, shape: 'rounded',
    },
  },
  {
    name: 'Crystal',
    values: {
      scale: -160, chroma: 10, border: 0.05, mapBlur: 8, blur: 1.5, saturate: 1.8,
      radius: 24, fallbackBlur: 12, tintColor: '#f0f7ff', tintOpacity: 0.08,
      specular: 80, shadow: 36, shape: 'rounded',
    },
  },
  {
    name: 'Dark',
    values: {
      scale: -110, chroma: 4, border: 0.09, mapBlur: 12, blur: 3, saturate: 1.4,
      radius: 26, fallbackBlur: 16, tintColor: '#0a0a12', tintOpacity: 0.32,
      specular: 45, shadow: 48, shape: 'rounded',
    },
  },
  {
    name: 'Pill',
    values: {
      scale: -100, chroma: 4, border: 0.15, mapBlur: 12, blur: 3, saturate: 1.5,
      radius: 999, fallbackBlur: 16, tintColor: '#ffffff', tintOpacity: 0.16,
      specular: 60, shadow: 30, shape: 'pill', width: 280, height: 56,
    },
  },
];

const STEPS = [
  {
    title: 'Design your glass',
    text: 'Pick a preset or tune refraction, chromatic fringe, frost, tint and shape with the live controls. Every slider also accepts a typed value.',
  },
  {
    title: 'Preview on any scene',
    text: 'Drag the glass across colorful backdrops, stripes and grids to check the refraction. Test it as a card, button, navbar or widget.',
  },
  {
    title: 'Export the code',
    text: 'Click Export code and download index.html, liquid-glass.css and liquid-glass.js — or grab everything as a single ZIP.',
  },
  {
    title: 'Drop it in your project',
    text: 'Link the CSS and JS, then add class="liquid-glass" to any div. Tune everything later from CSS variables — no JavaScript changes needed.',
  },
];

const FAQS = [
  {
    q: 'What is the liquid glass effect?',
    a: 'Liquid glass is Apple\u2019s translucent material introduced with iOS 26 and used across macOS, visionOS and Figma designs. It combines background blur, edge refraction, chromatic fringe and specular light so UI panels look like real physical glass.',
  },
  {
    q: 'Does the exported code need any framework?',
    a: 'No. The export is plain HTML, CSS and a small jQuery plugin. There are no build steps, no npm packages and no other libraries \u2014 just include the two files and jQuery.',
  },
  {
    q: 'Which browsers are supported?',
    a: 'Photo backgrounds use the same image-refraction filter and glossy surface in modern Safari, Firefox and Chrome. Put the image on a parent element as a CSS background. Refraction of arbitrary live HTML behind the glass is not interoperable across browsers; that content keeps the glossy surface and backdrop blur instead.',
  },
  {
    q: 'How do I customise the effect after exporting?',
    a: 'Everything is exposed as CSS variables on the .liquid-glass class \u2014 refraction strength, blur, tint, radius and more. Change them in your stylesheet and the plugin re-renders automatically.',
  },
];

export default function App() {
  const [state, setState] = useState<GlassState>({ ...DEFAULT_GLASS });
  const [bgId, setBgId] = useState(BACKGROUNDS[0].id);
  const [showPattern, setShowPattern] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [mode, setMode] = useState<PreviewMode>('card');
  const [activePreset, setActivePreset] = useState('iOS 26');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onStageSize = useCallback((w: number, h: number) => setStage({ w, h }), []);

  const set = <K extends keyof GlassState>(key: K, value: GlassState[K]) => {
    setActivePreset('');
    setState((s) => ({ ...s, [key]: value }));
  };

  const applyPreset = (name: string) => {
    const p = PRESETS.find((x) => x.name === name);
    if (!p) return;
    setActivePreset(name);
    setState((s) => ({ ...s, ...p.values }));
  };

  const reset = () => {
    setState({ ...DEFAULT_GLASS });
    setActivePreset('iOS 26');
  };

  const dims = useMemo(() => {
    if (mode === 'button') return { w: Math.min(state.width, 220), h: 52 };
    if (mode === 'nav') return { w: Math.min(Math.max(state.width, 320), 480), h: 64 };
    if (mode === 'widget') return { w: 180, h: 180 };
    return { w: state.width, h: state.height };
  }, [mode, state.width, state.height]);

  const shape: Shape =
    mode === 'widget' ? 'circle' : mode === 'button' || mode === 'nav' ? 'pill' : state.shape;

  const exportCode = useMemo(() => {
    const output = { ...state, width: dims.w, height: dims.h, shape };
    const photo = BACKGROUNDS.find((background) => background.id === bgId) ?? BACKGROUNDS[0];
    const scene = { url: photo.url, stripes: showPattern, grid: showGrid };
    return {
      html: buildHtml(output, scene),
      css: buildCss(output),
      jquery: JQUERY_PLUGIN,
      bundle: buildStandaloneDemo(output, scene),
    };
  }, [state, dims, shape, bgId, showPattern, showGrid]);

  const fit = useMemo(() => {
    if (!stage.w || !stage.h) return 1;
    const pad = 20;
    return Math.max(
      0.25,
      Math.min(1, (stage.w - pad * 2) / dims.w, (stage.h - pad * 2) / dims.h),
    );
  }, [stage, dims]);

  const modeSwitch = (
    <Segmented<PreviewMode>
      value={mode}
      onChange={setMode}
      options={MODES}
      className="w-full sm:w-auto sm:min-w-[296px]"
    />
  );

  return (
    <div className="app-root text-neutral-800">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200/80 bg-white/90 px-3 backdrop-blur-xl sm:px-5">
        <a href="#generator" className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[14px] font-semibold tracking-tight text-neutral-900">
              Liquid Glass
            </span>
            <span className="hidden text-[10.5px] font-medium text-neutral-400 sm:block">
              Generator
            </span>
          </span>
        </a>
        <button
          type="button"
          onClick={() => setIsExportOpen(true)}
          title="Export code (Ctrl/⌘ + E)"
          className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-[11px] bg-gradient-to-r from-teal-700 to-teal-400 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-[0_4px_12px_-4px_rgba(13,148,136,0.5)] transition hover:brightness-110 active:scale-[.97]"
        >
          <CodeIcon />
          <span className="hidden sm:inline">Export code</span>
          <span className="sm:hidden">Export</span>
        </button>
      </header>

      {/* Generator */}
      <section id="generator" className="mx-auto w-full max-w-[1400px] px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col lg:h-[calc(100dvh-5.5rem)] lg:overflow-hidden lg:flex-row lg:gap-4">
          {/* Stage */}
          <main className="sticky top-16 z-30 shrink-0 bg-[#f3f4f6]/95 px-0 pb-2 pt-1 backdrop-blur-xl lg:static lg:z-auto lg:min-h-0 lg:min-w-0 lg:flex-1 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex h-[clamp(210px,40dvh,380px)] flex-col gap-3 lg:h-full">
              <div className="hidden flex-wrap items-center justify-between gap-2 lg:flex">
                {modeSwitch}
                <BackdropPicker bgId={bgId} setBgId={setBgId} showPattern={showPattern} setShowPattern={setShowPattern} showGrid={showGrid} setShowGrid={setShowGrid} />
              </div>

              <div className="min-h-0 flex-1">
                <PreviewStage
                  bgId={bgId}
                  showPattern={showPattern}
                  showGrid={showGrid}
                  onSizeChange={onStageSize}
                  badge={fit < 0.995 ? `Fit ${Math.round(fit * 100)}%` : undefined}
                >
                  <div className="shrink-0 origin-center" style={{ transform: `scale(${fit})` }}>
                    <LiquidGlass
                      key={`${mode}-${state.shape}`}
                      state={state}
                      draggable
                      dragScale={fit}
                      width={dims.w}
                      height={dims.h}
                      shape={shape}
                    >
                      <PreviewContent mode={mode} />
                    </LiquidGlass>
                  </div>
                </PreviewStage>
              </div>

              <p className="hidden text-center text-[11px] text-neutral-400 lg:block">
                Drag the glass across the scene — the preview is rendered by the exact code you export.
              </p>
            </div>
          </main>

          {/* Controls */}
          <aside className="mt-3 flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white lg:mt-0 lg:min-h-0 lg:w-[366px] xl:w-[390px]">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-[13px] font-semibold tracking-tight text-neutral-900">Design</h2>
                <span className="truncate rounded-full bg-neutral-100 px-2 py-0.5 text-[10.5px] font-medium text-neutral-500">
                  {activePreset || 'Custom'}
                </span>
              </div>
              <ResetChip onClick={reset} />
            </div>

            <div className="scroll-thin space-y-7 p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {/* Preview options */}
              <div className="lg:hidden">
                <Section title="Preview" icon={<IconEye />}>
                  {modeSwitch}
                  <BackdropPicker bgId={bgId} setBgId={setBgId} showPattern={showPattern} setShowPattern={setShowPattern} showGrid={showGrid} setShowGrid={setShowGrid} />
                </Section>
              </div>

              {/* Presets */}
              <Section title="Presets" icon={<PresetIcon />}>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <PresetChip
                      key={p.name}
                      label={p.name}
                      active={activePreset === p.name}
                      onClick={() => applyPreset(p.name)}
                    />
                  ))}
                </div>
              </Section>

              {/* Color */}
              <Section title="Tint &amp; Glass" icon={<DropIcon />}>
                <ColorField
                  label="Tint"
                  value={state.tintColor}
                  onChange={(v) => set('tintColor', v)}
                />
                <Slider
                  label="Tint opacity"
                  value={state.tintOpacity}
                  min={0}
                  max={0.55}
                  step={0.01}
                  onChange={(v) => set('tintOpacity', v)}
                />
                <Slider
                  label="Specular"
                  value={state.specular}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => set('specular', v)}
                  hint="Specular light strength — the shiny reflection on the glass"
                />
                <Slider
                  label="Shadow"
                  value={state.shadow}
                  min={0}
                  max={80}
                  step={1}
                  onChange={(v) => set('shadow', v)}
                  hint="Drop shadow depth"
                />
              </Section>

              {/* Optics */}
              <Section title="Refraction" icon={<IconAperture />}>
                <Slider
                  label="Refraction"
                  value={Math.abs(state.scale)}
                  min={20}
                  max={200}
                  step={1}
                  onChange={(v) => set('scale', -v)}
                  hint="Lens strength around the glass edge"
                />
                <Slider
                  label="Chromatic fringe"
                  value={state.chroma}
                  min={0}
                  max={16}
                  step={0.5}
                  onChange={(v) => set('chroma', v)}
                  hint="RGB split at the edge — like a prism effect"
                />
                <Slider
                  label="Edge band"
                  value={state.border}
                  min={0.02}
                  max={0.25}
                  step={0.01}
                  onChange={(v) => set('border', v)}
                  hint="How far the refraction reaches inward from the edge"
                />
                <Slider
                  label="Rim curvature"
                  value={state.mapBlur}
                  min={0}
                  max={32}
                  step={1}
                  onChange={(v) => set('mapBlur', v)}
                  hint="Soft dome vs. hard bevel around the edge of the glass"
                />
              </Section>

              {/* Material */}
              <Section title="Frost" icon={<IconDroplet />}>
                <Slider
                  label="Backdrop blur"
                  value={state.blur}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="px"
                  onChange={(v) => set('blur', v)}
                  hint="How much the background behind the glass is blurred"
                />
                <Slider
                  label="Saturation"
                  value={state.saturate}
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  onChange={(v) => set('saturate', v)}
                  hint="Boost the color of the blurred background"
                />
                <Slider
                  label="Rim softness"
                  value={state.fallbackBlur}
                  min={4}
                  max={40}
                  step={1}
                  unit="px"
                  onChange={(v) => set('fallbackBlur', v)}
                  hint="Softness of the reflected light along the inner rim"
                />
              </Section>

              {/* Shape */}
              <Section title="Shape &amp; Size" icon={<IconShape />}>
                <Segmented<Shape>
                  value={state.shape}
                  onChange={(v) => set('shape', v)}
                  options={[
                    { id: 'rounded', label: 'Round' },
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'pill', label: 'Pill' },
                    { id: 'circle', label: 'Circle' },
                  ]}
                />
                <Slider
                  label="Radius"
                  value={Math.min(state.radius, 80)}
                  min={0}
                  max={80}
                  step={1}
                  unit="px"
                  onChange={(v) => set('radius', v)}
                />
                <Slider
                  label="Width"
                  value={state.width}
                  min={120}
                  max={520}
                  step={4}
                  unit="px"
                  onChange={(v) => set('width', v)}
                />
                <Slider
                  label="Height"
                  value={state.height}
                  min={48}
                  max={400}
                  step={4}
                  unit="px"
                  onChange={(v) => set('height', v)}
                />
              </Section>

              {/* Info */}
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-[11.5px] leading-relaxed text-neutral-500">
                  <span className="font-semibold text-neutral-900">How to use in your project:</span>{' '}
                  export the three files — <code className="text-neutral-900">liquid-glass.css</code>,{' '}
                  <code className="text-neutral-900">liquid-glass.js</code> and plain{' '}
                  <code className="text-neutral-900">index.html</code> — then link them with jQuery. Every
                  control above maps to a CSS variable you can change from any stylesheet.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-neutral-200/80 bg-white">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-widest text-teal-800">
              Step by step
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
              From idea to glass in four steps
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-neutral-500">
              Design Apple-style liquid glass visually, then export clean HTML, CSS and a small jQuery plugin
              that works in any project — no frameworks, no build tools.
            </p>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-neutral-50 p-5 transition hover:bg-teal-50/70">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-teal-700 to-teal-400 font-mono text-[12px] font-bold text-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[14px] font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-start gap-3 rounded-2xl bg-neutral-900 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13.5px] font-semibold text-white">
                The markup stays this simple
              </p>
              <code className="mt-1 block font-mono text-[12.5px] text-teal-300">
                &lt;div class="liquid-glass"&gt;Your content&lt;/div&gt;
              </code>
            </div>
            <a
              href="#generator"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] bg-gradient-to-r from-teal-700 to-teal-400 px-4 text-[12.5px] font-semibold text-white transition hover:brightness-110 active:scale-[.97]"
            >
              Back to the generator
            </a>
          </div>
        </div>
      </section>

      {/* Compatibility */}
      <section className="border-t border-neutral-200/80 bg-[#f3f4f6]" aria-labelledby="compat-heading">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <h2 id="compat-heading" className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
            One material. One rendering approach.
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            The preview and exported files use an aligned copy of the image background for
            refraction, with the same tint, highlights and rim lighting across browsers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:bg-teal-50/50">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal-50 text-teal-700">
                <IconAperture />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold text-neutral-900">True refraction</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
                A regular SVG filter bends the background image at the rim and separates the
                color channels. No Chrome-only backdrop filter is required.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:bg-teal-50/50">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal-50 text-teal-700">
                <IconDroplet />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold text-neutral-900">Consistent gloss</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
                The specular sheen and fine edge reflections are always present. The renderer
                does not replace the material with a blur-only version on another browser.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:bg-teal-50/50">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-teal-50 text-teal-700">
                <IconShape />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold text-neutral-900">A simple integration</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
                Add the class, include the stylesheet and plugin alongside jQuery, and put a
                photo background on the parent. All material controls stay in CSS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-neutral-200/80 bg-white">
        <div className="mx-auto w-full max-w-[820px] px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[32px]">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-2.5">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                question={f.q}
                answer={f.a}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center gap-3 px-4 py-6 text-center sm:flex-row sm:justify-between sm:gap-4 sm:px-6 sm:text-left">
          <p className="order-2 text-[11.5px] text-neutral-400 sm:order-1">© 2026 Liquid Glass Generator</p>
          <p className="order-1 text-[11.5px] font-medium text-neutral-500 sm:order-2">
            Developed by <span className="font-semibold text-neutral-900">
              <a href="https://github.com/Samanway-Koley" target="_blank" rel="noreferrer" aria-label="Samanway Koley on Github" className='hover:text-teal-600'>Samanway Koley</a>
            </span>
          </p>
          <div className="order-3 flex items-center gap-2">
            <a
              href="https://www.linkedin.com/in/samanway-koley"
              target="_blank"
              rel="noreferrer"
              aria-label="Samanway Koley on LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-600 transition hover:bg-teal-600 hover:text-white"
            >
              <LinkedInIcon />
            </a>
            <a
              href="mailto:samanway.koley@gmail.com"
              aria-label="Email Samanway Koley"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-neutral-100 text-neutral-600 transition hover:bg-teal-600 hover:text-white"
            >
              <MailIcon />
            </a>
          </div>
        </div>
      </footer>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        html={exportCode.html}
        css={exportCode.css}
        jquery={exportCode.jquery}
        bundle={exportCode.bundle}
      />
    </div>
  );
}

/* ---------- Responsive mode + backdrop controls ---------- */
function BackdropPicker({
  bgId,
  setBgId,
  showPattern,
  setShowPattern,
  showGrid,
  setShowGrid,
}: {
  bgId: string;
  setBgId: (id: string) => void;
  showPattern: boolean;
  setShowPattern: (v: boolean) => void;
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {BACKGROUNDS.map((b) => (
        <button
          key={b.id}
          type="button"
          title={b.label}
          aria-label={`Backdrop: ${b.label}`}
          onClick={() => setBgId(b.id)}
          className={`h-6 w-6 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-white transition sm:h-7 sm:w-7 ${
            bgId === b.id ? 'scale-105 ring-neutral-900' : 'ring-neutral-200 hover:ring-neutral-400'
          }`}
          style={
            b.url
              ? { backgroundImage: `url(${b.url})`, backgroundSize: 'cover' }
              : { background: '#354845' }
          }
        />
      ))}
      <span className="mx-1 h-4 w-px bg-neutral-300" />
      <ToggleChip active={showPattern} onClick={() => setShowPattern(!showPattern)}>
        Stripes
      </ToggleChip>
      <ToggleChip active={showGrid} onClick={() => setShowGrid(!showGrid)}>
        Grid
      </ToggleChip>
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors ${
        open ? 'border-neutral-200 bg-neutral-50' : 'border-transparent bg-neutral-50'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[14px] font-semibold text-neutral-900">{question}</span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all ${
            open ? 'rotate-45 bg-teal-600 text-white' : 'bg-white text-neutral-500'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-4 text-[13px] leading-relaxed text-neutral-500">{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Brand ---------- */
function BrandMark() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-teal-700 to-teal-400 shadow-[0_4px_10px_-4px_rgba(13,148,136,0.6)]"
      aria-hidden="true"
    >
      {/* Glass pane catching a highlight — the product's core idea */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="2.75"
          y="2.75"
          width="14.5"
          height="14.5"
          rx="4.75"
          stroke="#ffffff"
          strokeWidth="1.7"
        />
        <path
          d="M6.4 13.2c0-3.9 2.9-6.8 6.8-6.8"
          stroke="#ffffff"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="7.5" cy="7.5" r="1.35" fill="#ffffff" />
      </svg>
    </span>
  );
}

/* ---------- Icons ---------- */
function IconEye() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconAperture() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 4.5 12 12l7.5 2.5M9.5 19.5 12 12 4.5 9.5M19.5 14.5 12 12l-2.5 7.5" />
    </svg>
  );
}
function IconDroplet() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3c-2 4-6 5.5-6 10a6 6 0 0 0 12 0c0-4.5-4-6-6-10Z" />
    </svg>
  );
}
function IconShape() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="5" />
    </svg>
  );
}
function PresetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="7" width="16" height="7" rx="1.5" />
    </svg>
  );
}
function DropIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4c-2 3.5-5 5.5-5.6 7.1-1.4 3.3-.6 5.6.6 6.5 1 1 2.3 1.1 3.3 1.5a4.4 4.4 0 0 1 3.2 0c1 0 2.3-.4 3.3-1.5.9-1 1.7-3.2.6-6.5C11.6 9.5 11.2 8 9.2 7c-.1-1.5.5-3 .6-4.5Z" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
function ResetChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-[9px] px-2 py-1 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
      Reset
    </button>
  );
}
function LinkedInIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.55V9h3.57v11.45Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

/* ---------- Preview content ---------- */
function PreviewContent({ mode }: { mode: PreviewMode }) {
  if (mode === 'button') {
    return (
      <div className="flex h-full items-center justify-center gap-2 px-6">
        <span className="h-9 w-9 shrink-0 rounded-full bg-neutral-500/60 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-100">
            <polyline points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
        <span className="text-[14px] font-semibold tracking-wide text-neutral-100 drop-shadow">Get Started</span>
      </div>
    );
  }
  if (mode === 'nav') {
    return (
      <div className="flex h-full w-full items-center justify-between px-5 text-neutral-100">
        <span className="font-semibold tracking-tight text-neutral-100 drop-shadow">Liquid</span>
        <div className="flex gap-4 text-[12px] font-medium">
          <span>Design</span>
          <span>Develop</span>
          <span className="text-neutral-100">Glass</span>
        </div>
        <span className="rounded-full bg-neutral-700/60 px-3 py-1 text-[11px] font-semibold text-neutral-100 drop-shadow">Open</span>
      </div>
    );
  }
  if (mode === 'widget') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-neutral-100">
        <span className="text-[11px] font-medium uppercase tracking-widest">Fri</span>
        <span className="text-5xl font-semibold tabular-nums drop-shadow-md">26</span>
        <span className="text-[11px]">Liquid Glass</span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col justify-between p-6 text-neutral-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em]">Apple material</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight drop-shadow">Liquid Glass</h3>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700/60 ring-1 ring-neutral-400/30">
          <DropIconSmall />
        </div>
      </div>
      <p className="max-w-[240px] text-[12.5px] leading-relaxed text-neutral-50">
        Real refraction, chromatic rim and specular light — the same language as iOS 26 &amp; Figma glass.
      </p>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-neutral-700/60 px-3 py-1.5 text-[11px] font-semibold text-neutral-100 ring-1 ring-neutral-400/30">Preview</span>
        <span className="text-[11px]">Drag me around</span>
      </div>
    </div>
  );
}
function DropIconSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 4c-2 3.5-5 5.5-5.6 7.1-1.4 3.3-.6 5.6.6 6.5 1 1 2.3 1.1 3.3 1.5a4.4 4.4 0 0 1 3.2 0c1 0 2.3-.4 3.3-1.5.9-1 1.7-3.2.6-6.5C11.6 9.5 11.2 8 9.2 7c-.1-1.5.5-3 .6-4.5Z" fill="#f3eee7" fillOpacity="0.7" />
    </svg>
  );
}

