import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { GlassState } from '../lib/types';
import { glassVariables } from '../lib/exportCode';

export interface LiquidGlassProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  state: GlassState;
  width?: number | string;
  height?: number | string;
  shape?: GlassState['shape'];
  draggable?: boolean;
  /** Visual scale applied by an ancestor (keeps drag 1:1 with the pointer) */
  dragScale?: number;
}

/**
 * Preview node: a plain `<div class="liquid-glass">` whose CSS variables
 * carry the settings. The exported jQuery plugin renders the effect.
 */
export function LiquidGlass({
  children,
  className = '',
  style,
  state,
  width,
  height,
  shape = 'rounded',
  draggable = false,
  dragScale = 1,
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, ox: 0, oy: 0, x: 0, y: 0 });
  const scaleRef = useRef(1);

  useEffect(() => {
    scaleRef.current = dragScale > 0 ? dragScale : 1;
  }, [dragScale]);

  useEffect(() => {
    if (!draggable) return;
    const el = ref.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      const s = scaleRef.current;
      drag.current.active = true;
      drag.current.ox = e.clientX - drag.current.x * s;
      drag.current.oy = e.clientY - drag.current.y * s;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const s = scaleRef.current;
      drag.current.x = (e.clientX - drag.current.ox) / s;
      drag.current.y = (e.clientY - drag.current.oy) / s;
      el.style.transform = `translate3d(${drag.current.x}px, ${drag.current.y}px, 0)`;
    };
    const onUp = (e: PointerEvent) => {
      drag.current.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      el.style.cursor = 'grab';
    };

    el.style.cursor = 'grab';
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [draggable]);

  const vars = {
    ...glassVariables({ ...state, shape }),
    width,
    height,
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} className={`liquid-glass ${className}`} style={vars}>
      {children}
    </div>
  );
}
