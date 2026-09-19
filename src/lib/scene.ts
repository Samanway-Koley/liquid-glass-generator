const UNSPLASH = '?q=80&w=1600&auto=format&fit=crop';

export const BACKGROUNDS = [
  {
    id: 'aurora',
    label: 'Aurora',
    url: `https://images.unsplash.com/photo-1732464508438-aab5691d1dae${UNSPLASH}`,
  },
  {
    id: 'sunset',
    label: 'Sunset dunes',
    url: `https://images.unsplash.com/photo-1706799687464-0fc4d6050234${UNSPLASH}`,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    url: `https://images.unsplash.com/photo-1516156008625-3a9d6067fab5${UNSPLASH}`,
  },
  {
    id: 'blooms',
    label: 'Blooms',
    url: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e${UNSPLASH}`,
  },
  {
    id: 'city',
    label: 'City night',
    url: `https://images.unsplash.com/photo-1543330091-27228394c7dc${UNSPLASH}`,
  },
];

export interface SceneOptions {
  url: string;
  stripes: boolean;
  grid: boolean;
}

export const DEFAULT_SCENE: SceneOptions = {
  url: BACKGROUNDS[0].url,
  stripes: false,
  grid: false,
};

export function sceneBackground(scene: SceneOptions) {
  const layers: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const addPattern = (layer: string, size: string) => {
    layers.push(layer);
    sizes.push(size);
    positions.push('0 0');
    repeats.push('repeat');
  };
  if (scene.stripes) {
    addPattern('repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,0.1) 23px 25px)', '25px 100%');
  }
  if (scene.grid) {
    addPattern('linear-gradient(rgba(255,255,255,0.24) 1px, transparent 1px)', '48px 48px');
    addPattern('linear-gradient(90deg, rgba(255,255,255,0.24) 1px, transparent 1px)', '48px 48px');
  }
  const safeUrl = scene.url.replace(/[\n\r\f]/g, '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/</g, '\\3c ');
  layers.push(`url("${safeUrl}")`);
  sizes.push('cover');
  positions.push('center center');
  repeats.push('no-repeat');
  return {
    backgroundImage: layers.join(', '),
    backgroundSize: sizes.join(', '),
    backgroundPosition: positions.join(', '),
    backgroundRepeat: repeats.join(', '),
    backgroundColor: '#005f5a',
  };
}