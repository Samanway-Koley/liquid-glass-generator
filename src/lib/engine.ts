import $ from 'jquery';
import cssSource from '../vendor/liquid-glass.css?raw';

let installed = false;

/**
 * Boots the exact exported engine inside the tool, so the live preview
 * is rendered by the same CSS + jQuery plugin the user downloads.
 */
export async function installLiquidGlassEngine() {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  (window as unknown as { jQuery: typeof $; $: typeof $ }).jQuery = $;
  (window as unknown as { jQuery: typeof $; $: typeof $ }).$ = $;

  const style = document.createElement('style');
  style.setAttribute('data-liquid-glass', 'css');
  style.textContent = cssSource;
  document.head.appendChild(style);

  await import('../vendor/liquid-glass.js');
}
