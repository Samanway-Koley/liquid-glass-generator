import { useEffect, useRef, type ReactNode } from 'react';
import { BACKGROUNDS, sceneBackground } from '../lib/scene';

export { BACKGROUNDS } from '../lib/scene';

export function PreviewStage({
  bgId,
  children,
  showGrid,
  showPattern,
  onSizeChange,
  badge,
}: {
  bgId: string;
  children: ReactNode;
  showGrid?: boolean;
  showPattern?: boolean;
  onSizeChange?: (w: number, h: number) => void;
  badge?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0];

  useEffect(() => {
    const el = ref.current;
    if (!el || !onSizeChange) return;
    const report = () => onSizeChange(el.clientWidth, el.clientHeight);
    report();
    if (!window.ResizeObserver) {
      window.addEventListener('resize', report);
      return () => window.removeEventListener('resize', report);
    }
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSizeChange]);

  return (
    <div
      ref={ref}
      className="liquid-glass-scene relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-black/10 sm:rounded-3xl"
      style={sceneBackground({ url: bg.url, stripes: !!showPattern, grid: !!showGrid })}
      aria-label={`${bg.label} glass preview`}
    >
      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-8">
        {children}
      </div>
      {badge && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] text-white">
          {badge}
        </div>
      )}
    </div>
  );
}