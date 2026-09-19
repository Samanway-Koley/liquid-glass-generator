import pluginSource from '../vendor/liquid-glass.js?raw';
import cssSource from '../vendor/liquid-glass.css?raw';
import { DEFAULT_GLASS, type GlassState } from './types';
import { DEFAULT_SCENE, sceneBackground, type SceneOptions } from './scene';

export const JQUERY_PLUGIN = pluginSource;

export function hexToTriplet(hex: string): string {
  let h = String(hex || '').replace('#', '');
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(h)) h = 'ffffff';
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function radiusValue(s: GlassState): string {
  if (s.shape === 'circle') return '50%';
  if (s.shape === 'pill') return '9999px';
  return `${s.radius}px`;
}

export function glassVariables(s: GlassState): Record<string, string> {
  return {
    '--lg-refraction': String(Math.abs(s.scale)),
    '--lg-chroma': String(s.chroma),
    '--lg-edge': String(s.border),
    '--lg-curvature': String(s.mapBlur),
    '--lg-blur': `${s.blur}px`,
    '--lg-frost': `${s.fallbackBlur}px`,
    '--lg-saturate': String(s.saturate),
    '--lg-tint': hexToTriplet(s.tintColor),
    '--lg-tint-opacity': String(s.tintOpacity),
    '--lg-specular': String(s.specular / 100),
    '--lg-depth': String(s.shadow),
    '--lg-radius': radiusValue(s),
  };
}

// Generate from the preview's stylesheet, never a separate fallback template.
export function buildCss(state: GlassState): string {
  const vars = glassVariables(state);
  const styles = cssSource.replace(/(--lg-[\w-]+):\s*[^;]+;/g, (original, key: string) =>
    key in vars ? `${key}: ${vars[key]};` : original,
  );
  return `${styles}\n.liquid-glass {\n  width: ${state.width}px;\n  height: ${state.height}px;\n  max-width: 100%;\n}\n`;
}

function demoStyles(scene: SceneOptions): string {
  const bg = sceneBackground(scene);
  return `html { min-height: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100svh;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 24px;
  color: #fff;
  font: 16px/1.5 system-ui, sans-serif;
  background-color: ${bg.backgroundColor};
  background-image: ${bg.backgroundImage};
  background-size: ${bg.backgroundSize};
  background-position: ${bg.backgroundPosition};
  background-repeat: ${bg.backgroundRepeat};
}
.liquid-glass {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  font-weight: 600;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
}
.liquid-glass h2 { margin: 0; font-size: 24px; }
.liquid-glass p { margin: 8px 0 0; font-size: 13px; font-weight: 400; }`;
}

function documentHtml(state: GlassState, scene: SceneOptions, single: boolean): string {
  const content = state.height < 120 ? 'Liquid Glass' : '<h2>Liquid Glass</h2>\n    <p>Light, beautifully refracted.</p>';
  const stylesheet = single ? `<style>\n${buildCss(state)}\n</style>` : '<link rel="stylesheet" href="liquid-glass.css">';
  const script = single
    ? `<script>\n${pluginSource.replace(/<\/script/gi, '<\\/script')}\n</script>`
    : '<script src="liquid-glass.js"></script>';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="author" content="">
  <title>Liquid Glass</title>
  ${stylesheet}
  <style>
${demoStyles(scene)}
  </style>
</head>
<body>
  <div class="liquid-glass">
    ${content}
  </div>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  ${script}
</body>
</html>`;
}

export function buildHtml(state: GlassState = DEFAULT_GLASS, scene: SceneOptions = DEFAULT_SCENE): string {
  return documentHtml(state, scene, false);
}

export function buildStandaloneDemo(state: GlassState, scene: SceneOptions = DEFAULT_SCENE): string {
  return documentHtml(state, scene, true);
}