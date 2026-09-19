export interface GlassState {
  /** Refraction strength. Negative = magnifying bulge at rim. */
  scale: number;
  /** RGB prism fringe at the edge. 0 disables. */
  chroma: number;
  /** Neutral interior inset, fraction of the smaller side. */
  border: number;
  /** Rim curvature (map blur). */
  mapBlur: number;
  /** Frost inside the glass. */
  blur: number;
  /** Backdrop saturation multiplier. */
  saturate: number;
  /** Corner radius in px. */
  radius: number;
  /** Softness of the reflected light along the inner rim. */
  fallbackBlur: number;
  /** Glass tint color. */
  tintColor: string;
  /** Tint opacity. */
  tintOpacity: number;
  /** Specular highlight strength. */
  specular: number;
  /** Drop shadow depth. */
  shadow: number;
  width: number;
  height: number;
  shape: 'rounded' | 'pill' | 'circle' | 'squircle';
}

export const DEFAULT_GLASS: GlassState = {
  scale: -120,
  chroma: 5,
  border: 0.08,
  mapBlur: 14,
  blur: 2.5,
  saturate: 1.55,
  radius: 28,
  fallbackBlur: 18,
  tintColor: '#ffffff',
  tintOpacity: 0.14,
  specular: 55,
  shadow: 42,
  width: 340,
  height: 210,
  shape: 'rounded',
};
