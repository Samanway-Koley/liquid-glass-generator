<div align="center">

# Liquid Glass Generator

**Design glossy, physically-inspired glass surfaces with pure CSS variables, then export production-ready code.**

<!-- ![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Browsers](https://img.shields.io/badge/browsers-Chromium%20%7C%20Firefox%20%7C%20WebKit-orange)
![jQuery](https://img.shields.io/badge/jQuery-3.7.1-0769ad) -->

<!-- Developed by **Samanway Koley** -->

<!-- Replace docs/screenshot.png with a screenshot of the software (recommended: 1600x900 PNG). -->
<img src="docs/screenshot.png" alt="Liquid Glass Generator screenshot" width="800">

</div>

---

## Table of Contents

| Group | Sections |
| :--- | :--- |
| **Getting Started** | [1. Overview](#1-overview) · [2. Quick Start](#2-quick-start) · [3. Requirements](#3-requirements) · [4. Integration Guide](#4-integration-guide) |
| **Reference** | [5. Configuration](#5-configuration-reference) · [6. JavaScript API](#6-javascript-api) · [7. How It Works](#7-how-it-works) |
| **Compatibility** | [8. Cross-Browser Rendering](#8-cross-browser-rendering) · [9. Supported Scenarios](#9-supported-and-unsupported-scenarios) · [10. Accessibility](#10-accessibility-and-user-preferences) |
| **Project** | [11. Exporting](#11-exporting-from-the-generator) · [12. Architecture](#12-project-architecture) · [13. Development](#13-development) · [14. Testing](#14-browser-regression-testing) |
| **Help** | [15. Troubleshooting](#15-troubleshooting) · [16. FAQ](#16-frequently-asked-questions) · [17. Migration Notes](#17-migration-notes) · [18. Release Notes](#18-versioning-and-release-notes) |

---

## 1. Overview

**Liquid Glass Generator** is a visual tool and runtime library for creating glossy, lens-like glass surfaces on the web. You tune the look interactively, then export a ready-to-use bundle:

| Exported file | Purpose |
| --- | --- |
| `index.html` | A working example page with a photo background and all required scripts |
| `liquid-glass.css` | Stylesheet containing the glass material and your chosen variable values |
| `liquid-glass.js` | jQuery plugin that builds and maintains the glass optics |

### Key Features

- **CSS-first configuration.** Every appearance control is a CSS custom property on `.liquid-glass`. No data attributes or JavaScript options are required.
- **Minimal markup.** A single element is enough: `<div class="liquid-glass">Your content</div>`.
- **True refraction in every supported browser.** Chrome, Firefox and Safari use the same displacement map, RGB passes, tint and specular layers.
- **Automatic background detection.** The nearest ancestor with a CSS `background-image` is used as the refraction source.
- **Live updates.** The plugin reacts to resize, scroll and stylesheet changes without manual calls.
- **No canvas pixel reads.** Because image data is never read through canvas, no CORS headers are required for the background image.
- **Graceful fallback.** If a background image cannot be loaded, the CSS gloss remains active and your content stays visible.
- **Cross-browser regression suite.** Automated Playwright tests run in Chromium, Firefox and WebKit.

---

## 2. Quick Start

**Step 1.** Add the stylesheet, jQuery 3.7.1 and the plugin to your page:

```html
<link rel="stylesheet" href="liquid-glass.css">

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="liquid-glass.js"></script>
```

**Step 2.** Place a background photo on the glass element's parent using ordinary CSS:

```css
.scene {
  background-image: url("photo.jpg");
  background-size: cover;
  background-position: center;
}
```

**Step 3.** Add the glass element:

```html
<div class="scene">
  <div class="liquid-glass">Your content</div>
</div>
```

That is the complete setup. New `.liquid-glass` elements are initialized automatically.

---

## 3. Requirements

| Requirement | Details |
| --- | --- |
| **jQuery** | Version 3.7.1 |
| **Browsers** | Current Chromium-based browsers, Firefox and Safari (WebKit) |
| **Background image** | A successfully loading image or CSS background on an ancestor element (or on the element named by `--lg-source`) |
| **Node.js and npm** | Only required to develop the generator itself, not to use the exported files |

The single-file HTML export inlines the plugin and styles, but it still loads jQuery and the selected photograph from their sources. Host those assets locally if you need offline use.

---

## 4. Integration Guide

### 4.1 Including the Assets

Load the stylesheet in `<head>`, then jQuery, then the plugin before `</body>`:

```html
<head>
  <link rel="stylesheet" href="liquid-glass.css">
</head>
<body>
  <!-- your page -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script src="liquid-glass.js"></script>
</body>
```

### 4.2 Markup

The only markup is a single element with the `liquid-glass` class:

```html
<div class="liquid-glass">Your content</div>
```

You can add as many glass elements as you like. Each one is initialized independently, and multiple elements on the same page are supported.

### 4.3 Providing a Background (Recommended Setup)

For consistent refraction, put the background photo on the glass element's **parent** using normal CSS `background-image`, `background-size` and `background-position`.

The plugin walks up the DOM and automatically detects the **nearest ancestor with a background image**. The HTML generated by the tool already includes a photo background and all required scripts.

```css
.hero {
  background-image: url("images/mountains.jpg");
  background-size: cover;
  background-position: center;
  min-height: 100vh;
}
```

### 4.4 Using a Background in a Different Element

If the background lives somewhere other than an ancestor, set `--lg-source` to a CSS selector. The selector can target either a background container or an `<img>` element:

```css
.liquid-glass {
  --lg-source: "#backdrop";
}
```

```html
<img id="backdrop" src="images/mountains.jpg" alt="">
<div class="liquid-glass">Your content</div>
```

### 4.5 Opting Out of Image Replication

Set `--lg-source: none` to disable image replication. Use this when the glass sits over complex live content (for example text, video or overlapping elements) that cannot be represented by a single background image plane:

```css
.liquid-glass.over-live-content {
  --lg-source: none;
}
```

In this mode, gloss and ordinary backdrop blur remain available; only the refracted image copy is disabled.

### 4.6 Source Selection Summary

| Situation | What to do |
| --- | --- |
| Background image is on an ancestor of the glass | Nothing. It is detected automatically. |
| Background is on a separate element or an `<img>` | Set `--lg-source` to its selector. |
| Glass floats over live content (video, iframes, text) | Set `--lg-source: none`. |
| No background image available | The CSS gloss and backdrop blur remain active. |

---

## 5. Configuration Reference

All appearance controls are CSS variables set on `.liquid-glass` (or on any selector that targets glass elements). Because they are ordinary custom properties, you can override them per element, per component, per theme or per media query.

### 5.1 Variable Table

| Variable | Category | Purpose |
| --- | --- | --- |
| `--lg-refraction` | Optics | Lens displacement strength |
| `--lg-chroma` | Optics | RGB separation at the rim |
| `--lg-edge` | Shape | Bevel width as a fraction of the shorter side |
| `--lg-curvature` | Shape | Bevel falloff |
| `--lg-radius` | Shape | CSS corner radius |
| `--lg-blur` | Material | Background softness |
| `--lg-frost` | Material | Inner reflected-light softness |
| `--lg-saturate` | Material | Background saturation |
| `--lg-tint` | Material | Space-separated RGB channels |
| `--lg-tint-opacity` | Material | Tint opacity |
| `--lg-specular` | Light | Reflection intensity, from 0 to 1 |
| `--lg-depth` | Light | Shadow depth |
| `--lg-source` | Source | Selector for a custom background source, or `none` |

### 5.2 Detailed Descriptions

**Optics**

- **`--lg-refraction`** controls how strongly the lens displaces the background image. Higher values bend the background more dramatically near the edges. Set it to zero to disable refraction while keeping reflection and material effects.
- **`--lg-chroma`** controls the amount of RGB channel separation at the rim, producing a subtle prismatic fringe. Lower values give a cleaner, more neutral glass.

**Shape**

- **`--lg-edge`** sets the width of the bevel as a fraction of the element's **shorter side**. Because it is relative, the bevel scales naturally with the element size.
- **`--lg-curvature`** controls how the bevel falls off toward the interior of the surface.
- **`--lg-radius`** is the CSS corner radius of the glass element.

**Material**

- **`--lg-blur`** sets how soft the refracted background appears.
- **`--lg-frost`** sets the softness of the inner reflected light, giving a frosted or polished feel.
- **`--lg-saturate`** adjusts the saturation of the background seen through the glass.
- **`--lg-tint`** sets the tint colour as **space-separated RGB channels** (for example `255 255 255`).
- **`--lg-tint-opacity`** sets how strongly the tint is applied.

**Light and Depth**

- **`--lg-specular`** sets reflection intensity on a scale from `0` (none) to `1` (full).
- **`--lg-depth`** sets the depth of the drop shadow beneath the glass.

### 5.3 Example Usage

> The values below are illustrative. Open the exported `liquid-glass.css` to see the exact defaults and units your generated design uses, and adjust from there.

```css
.liquid-glass {
  --lg-refraction: 1;
  --lg-chroma: 0.5;
  --lg-edge: 0.2;
  --lg-curvature: 1;
  --lg-blur: 4px;
  --lg-frost: 0.5;
  --lg-saturate: 1.2;
  --lg-tint: 255 255 255;
  --lg-tint-opacity: 0.1;
  --lg-specular: 0.6;
  --lg-depth: 0.5;
  --lg-radius: 24px;
}
```

### 5.4 Per-Element Overrides

Because the controls are CSS variables, one style can be reused with local variations:

```css
.liquid-glass.card {
  --lg-radius: 16px;
  --lg-blur: 6px;
}

.liquid-glass.pill {
  --lg-radius: 999px;
  --lg-specular: 0.8;
}
```

```html
<div class="liquid-glass card">Card</div>
<div class="liquid-glass pill">Pill</div>
```

### 5.5 Theming

Since the variables cascade like any other CSS property, you can theme glass surfaces with media queries or class toggles:

```css
@media (prefers-color-scheme: dark) {
  .liquid-glass {
    --lg-tint: 20 24 40;
    --lg-tint-opacity: 0.25;
  }
}
```

The plugin polls for stylesheet changes, so updated variable values are picked up automatically.

---

## 6. JavaScript API

The plugin needs no configuration to run. New `.liquid-glass` elements are initialized automatically, and the plugin updates after window resize and scroll and polls for stylesheet changes.

For the rare cases where you want explicit control, a small jQuery API is available.

### 6.1 Methods

| Call | Description |
| --- | --- |
| `$(element).liquidGlass()` | Enables the glass optics on the element. Also re-enables an element that was destroyed. |
| `$(element).liquidGlass('refresh')` | Requests an immediate update of the element's optics. |
| `$(element).liquidGlass('destroy')` | Removes the generated optics from the element. |

### 6.2 Examples

**Force an immediate update after a layout change**

```js
$('.liquid-glass').liquidGlass('refresh');
```

**Temporarily remove the effect, then restore it**

```js
$('#panel').liquidGlass('destroy');   // remove generated optics
$('#panel').liquidGlass();            // enable them again
```

**Refresh after dynamically resizing a container**

```js
$('#panel').css('width', '480px');
$('#panel').liquidGlass('refresh');
```

### 6.3 Automatic Behaviours

| Trigger | Behaviour |
| --- | --- |
| New `.liquid-glass` element appears | Initialized automatically |
| Window resize | Optics are updated |
| Scroll | Background mapping is updated |
| Stylesheet or CSS variable change | Detected by polling and applied |

---

## 7. How It Works

This section explains the rendering model so you can predict how the effect behaves in your own layouts.

### 7.1 Rendering Pipeline

1. **Source detection.** The plugin finds the background source: the value of `--lg-source` if set, otherwise the nearest ancestor with a CSS background image.
2. **Aligned copy.** An aligned copy of that background image is created inside the glass element, positioned so it matches the real background exactly. Cover sizing, tiling, translation, scaling, resize and scroll are all accounted for.
3. **Displacement.** An ordinary SVG `filter` displaces the aligned copy using a generated displacement map, producing the lens-like bend near the bevel.
4. **RGB passes.** The red, green and blue channels are processed separately to produce chromatic separation at the rim.
5. **Material layers.** Blur, frost, saturation and the tint layer are applied.
6. **Specular layer.** Reflection highlights are added according to `--lg-specular`.
7. **Depth.** A shadow is applied according to `--lg-depth`.

### 6.2 Why an SVG `filter` on an Image Copy

Earlier versions relied on `backdrop-filter: url(#...)`, which cannot perform this kind of displacement in Safari or Firefox. The current approach applies a standard SVG `filter` to an aligned copy of the background image. Standard SVG filters are supported in all three major browser engines, so the same displacement map, RGB passes, tint and specular layers are used everywhere.

### 7.3 No Canvas, No CORS Requirement

The plugin never reads image pixels through a canvas. As a result, the technique does not require CORS headers on your background image, and third-party photos work as long as they load successfully.

### 7.4 Efficiency

The filter is reused while an element moves, rather than being rebuilt on every frame, which keeps scrolling and movement smooth.

---

## 8. Cross-Browser Rendering

| Engine | Browsers | Refraction | Notes |
| --- | --- | --- | --- |
| Chromium | Chrome, Edge and other Chromium browsers | Yes | Same rendering path as other engines |
| Gecko | Firefox | Yes | Same rendering path as other engines |
| WebKit | Safari (macOS and iOS) | Yes | Same rendering path as other engines |

There is **no user-agent switch** that deliberately turns off refraction in another browser. All engines use the same code path.

**Rendering variance.** Browser rasterization can vary slightly between engines and versions. The result is a close cross-browser match, but it is **not** Apple's or Figma's proprietary rendering engine.

**Native-device verification.** Automated tests cover Chromium, Firefox and WebKit, but WebKit automation is not a replacement for a final visual check in the shipping Safari version on your Mac or iPhone. Verify on real devices before release.

---

## 9. Supported and Unsupported Scenarios

### 9.1 Supported

| Scenario | Support |
| --- | --- |
| Background photo on an ancestor via CSS `background-image` | Supported (automatic) |
| Background in another element or `<img>` via `--lg-source` | Supported |
| `background-size: cover` and other sizing modes | Supported |
| Tiled backgrounds | Supported |
| Translation and scaling of the background | Supported |
| Window resize and scroll | Supported |
| Multiple glass elements on one page | Supported |
| Unrotated, axis-aligned backgrounds | Supported |

### 9.2 Not Supported (Out of Model)

| Scenario | Behaviour |
| --- | --- |
| Refracting arbitrary live DOM content (text, videos, iframes, overlapping elements) | Not captured or duplicated. Use `--lg-source: none` and rely on gloss and backdrop blur. |
| Rotated backgrounds | Outside the supported mapping model |
| Mixed fixed and scrolling background layers | Outside the supported mapping model |
| 3D-transformed scenes | Outside the supported mapping model |

### 9.3 Important Boundaries

- The effect refracts **the selected image or background plane**, not a screenshot of the live page.
- Local or third-party images **must load successfully**. If an image is unavailable, the CSS gloss stays active instead of hiding the element's content.
- When there is no background source, gloss and ordinary backdrop blur remain available.

---

## 10. Accessibility and User Preferences

- **Reduced transparency.** When a user's system requests reduced transparency, the effect intentionally replaces transparency with a more opaque material. This is by design and improves legibility for users who prefer it.
- **Content is never hidden.** If the background image fails to load, content inside the glass element remains visible and readable.
- **Contrast.** Glass surfaces sit over variable backgrounds. Check text contrast against your actual imagery, and adjust `--lg-tint`, `--lg-tint-opacity` and `--lg-blur` to meet your contrast goals.

---

## 11. Exporting from the Generator

The generator lets you tune every control visually and then download your design.

### 11.1 What You Get

| File | Description |
| --- | --- |
| `index.html` | Example page that already includes a photo background and the required scripts |
| `liquid-glass.css` | Glass material with your chosen variable values |
| `liquid-glass.js` | The plugin |

Files can also be downloaded as a ZIP. A single-file HTML export is available which inlines the plugin and styles.

### 11.2 Single-File HTML Export

The single HTML file inlines the plugin and styles but **still loads jQuery and the selected photograph** from their sources. For fully offline use, download those assets, host them locally and update the references.

### 11.3 How Exports Are Built

Both the live preview and all downloads are produced from the same source files. The exporter changes only:

- the CSS variable defaults, and
- the output dimensions.

Background settings are shared across all exports. This guarantees that what you see in the preview is what you get in the downloaded files.

---

## 12. Project Architecture

### 12.1 Shared Source of Truth

| Path | Role |
| --- | --- |
| `src/vendor/liquid-glass.css` | Shared stylesheet source for preview and downloads |
| `src/vendor/liquid-glass.js` | Shared plugin source for preview and downloads |
| `src/lib/exportCode.ts` | Generates export output; modifies only CSS variable defaults and output dimensions |
| `src/lib/scene.ts` | Defines background settings shared by all exports |

Using a single shared source removes the possibility of the preview and the exported files drifting apart. A previous implementation maintained a separate exported stylesheet that became outdated; that duplication has been eliminated.

### 12.2 Design Principles

- **One implementation, many outputs.** Preview and exports share the same plugin and stylesheet.
- **CSS as the public interface.** Appearance is controlled with CSS variables rather than JavaScript options or data attributes.
- **No browser sniffing.** Rendering paths are identical across browsers.
- **Fail visible.** If something cannot render, content remains visible.

---

## 13. Development

### 13.1 Setup

```bash
npm ci
```

### 13.2 Scripts

| Command | Description |
| --- | --- |
| `npm ci` | Install dependencies from the lockfile |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Produce the production build output |

### 13.3 Contribution Guidelines

1. Make changes in the shared sources under `src/vendor/` and `src/lib/`. Do not create parallel copies of the stylesheet or plugin for exports.
2. Run the browser regression tests (see the next section) before submitting changes.
3. Keep public behaviour driven by CSS variables. Avoid adding data-attribute or option-based configuration.
4. Update this documentation when you add, rename or remove a variable or API method.

---

## 14. Browser Regression Testing

### 14.1 Running the Tests

Install the test browsers, then run the suite:

```bash
npx playwright install --with-deps
npx playwright test
```

The suite runs in **Chromium, Firefox and WebKit**. The GitHub workflow runs this matrix on **Linux and macOS** and retains failure screenshots.

### 14.2 What Is Covered

| Area | Verification |
| --- | --- |
| Refraction | Visible pixel displacement |
| Reflection | Visible reflection with refraction disabled |
| Performance behaviour | Filter reuse during movement |
| Multiple elements | Several glass elements on one page |
| Cleanup | Removal of generated optics |
| Generator controls | Typed control input |
| Responsive UI | The Export action at 320px width |
| Export packaging | ZIP contents |
| Exported files | Initialization of exported files |

### 14.3 Test Fixtures

Image fixtures are deterministic and do not rely on a third-party photo server, so results are reproducible.

### 14.4 Scope of Testing

The tests are provided as **regression coverage**, not as a claim of completed native-device testing. WebKit automation is not a replacement for a final visual check in the shipping Safari version on your Mac or iPhone.

---

## 15. Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| No refraction; only a glossy surface | No background image was detected, or the image failed to load | Put a `background-image` on the glass element's parent, or set `--lg-source` to a valid selector. Confirm the image URL loads. |
| Refraction looks misaligned | Unsupported background configuration (rotation, mixed fixed and scroll layers, or 3D transforms) | Use an unrotated, axis-aligned background with a single consistent attachment mode. |
| Text or video behind the glass is not refracted | The effect refracts the selected image plane only | Expected behaviour. Set `--lg-source: none` and use blur and gloss instead. |
| Glass is more opaque than expected | The user's system has reduced transparency enabled | Expected behaviour; this is an intentional accessibility feature. |
| Changes to variables do not appear | The page has not refreshed the optics yet | The plugin polls for stylesheet changes, or call `$(element).liquidGlass('refresh')`. |
| Effect stays after removing the class or element content changes | Generated optics were not removed | Call `$(element).liquidGlass('destroy')`. |
| Exported page shows no photo offline | jQuery and the photograph are still loaded externally | Host jQuery and the image locally and update the references. |
| Slight visual differences between browsers | Normal rasterization differences between engines | Verify on the real target browsers and devices. |
| Nothing happens at all | The plugin script is missing or loaded before jQuery | Load jQuery 3.7.1 first, then `liquid-glass.js`. |

---

## 16. Frequently Asked Questions

**Getting started**

<details>
<summary><b>Do I need to write any JavaScript?</b></summary>

No. Include the scripts, add the `liquid-glass` class, and elements are initialized automatically.

</details>

<details>
<summary><b>Can I put multiple glass elements on one page?</b></summary>

Yes. Each element is handled independently, and multiple elements are covered by the test suite.

</details>

<details>
<summary><b>How do I change the look after exporting?</b></summary>

Edit the CSS variables in `liquid-glass.css`, or override them in your own stylesheet.

</details>

<details>
<summary><b>Can I remove the effect from one element?</b></summary>

Yes. Call `$(element).liquidGlass('destroy')`.

</details>

**Compatibility**

<details>
<summary><b>Does it work in Safari and Firefox?</b></summary>

Yes. The same rendering path is used in Chrome, Firefox and Safari.

</details>

<details>
<summary><b>Can I use a background image hosted on another domain?</b></summary>

Yes. Image pixels are not read via canvas, so CORS headers are not required. The image only has to load successfully.

</details>

<details>
<summary><b>Will it work offline?</b></summary>

Yes, if you host jQuery and your background image locally.

</details>

**Limits**

<details>
<summary><b>Can the glass refract text, video or other elements behind it?</b></summary>

No. It refracts the selected image or background plane only. Use `--lg-source: none` if the glass overlays complex live content.

</details>

<details>
<summary><b>Is this the same as Apple's Liquid Glass?</b></summary>

No. It is an independent implementation, and browser rasterization can vary slightly. It is not Apple's or Figma's proprietary rendering engine.

</details>

---

## 17. Migration Notes

The current implementation replaces an earlier approach with two known problems:

1. It used `backdrop-filter: url(#...)`, which cannot perform displacement in Safari or Firefox.
2. It maintained a separate, outdated exported stylesheet.

Both causes have been removed:

- Rendering now uses an ordinary SVG `filter` on an aligned copy of the background image, giving the same result in Chrome, Firefox and Safari.
- Preview and downloads now share one stylesheet and one plugin under `src/vendor/`.

If you are upgrading from an older export, replace your existing `liquid-glass.css` and `liquid-glass.js` with the new files, and make sure the glass element's parent has a CSS background image (or set `--lg-source`).

---

## 18. Versioning and Release Notes

### 1.0.0

- CSS-variable-driven configuration for all appearance controls.
- Cross-browser refraction using SVG filters on an aligned background copy.
- Automatic background source detection with optional `--lg-source` override and `none` opt-out.
- jQuery API: `liquidGlass()`, `'refresh'` and `'destroy'`.
- Automatic updates on resize, scroll and stylesheet changes.
- Shared source for preview and exports.
- Playwright regression suite for Chromium, Firefox and WebKit on Linux and macOS.