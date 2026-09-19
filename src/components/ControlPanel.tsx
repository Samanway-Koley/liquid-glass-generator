import { useEffect, useState, type ReactNode } from 'react';

/* ---------- helpers ---------- */

function decimalsOf(step: number) {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

function fmt(v: number) {
  return Number(v.toFixed(3)).toString();
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/* ---------- Slider with editable value ---------- */

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  hint?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  hint,
}: SliderProps) {
  const [draft, setDraft] = useState(() => fmt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(fmt(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) {
      setDraft(fmt(value));
      return;
    }
    const precision = Math.max(decimalsOf(step), 2);
    const v = Number(clamp(n, min, max).toFixed(precision));
    onChange(v);
    setDraft(fmt(v));
  };

  const nudge = (dir: 1 | -1) => {
    const v = Number(clamp(value + dir * step, min, max).toFixed(3));
    onChange(v);
    setDraft(fmt(v));
  };

  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="min-w-0 truncate text-[12px] font-medium text-neutral-600">
          {label}
        </label>
        <div className="flex shrink-0 items-center overflow-hidden rounded-[10px] border border-transparent bg-neutral-100 transition focus-within:border-neutral-900 focus-within:bg-white">
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            min={min}
            max={max}
            step={step}
            aria-label={`${label} value`}
            onFocus={(e) => {
              setFocused(true);
              e.target.select();
            }}
            onBlur={(e) => {
              setFocused(false);
              commit(e.target.value);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commit(draft);
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setDraft(fmt(value));
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                nudge(1);
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                nudge(-1);
              }
            }}
            className="h-7 w-14 bg-transparent px-2 text-right font-mono text-[11.5px] tabular-nums text-neutral-900 outline-none"
          />
          {unit && (
            <span className="pr-2 text-[10px] font-medium text-neutral-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex h-5 items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-neutral-200" />
        <div
          className="absolute left-0 h-1.5 rounded-full bg-gradient-to-r from-teal-700 to-teal-400"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamp(value, min, max)}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer"
        />
      </div>

      {hint && (
        <p className="text-[10.5px] leading-snug text-neutral-400">{hint}</p>
      )}
    </div>
  );
}

/* ---------- Section ---------- */

export function Section({
  title,
  children,
  icon,
  action,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-500">
            {icon}
          </span>
        )}
        <h3 className="text-[12.5px] font-semibold text-neutral-900">{title}</h3>
        <div className="h-px flex-1 bg-neutral-100" />
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex rounded-[12px] bg-neutral-100 p-1 ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-w-0 flex-1 truncate rounded-[9px] px-2 py-1.5 text-[11.5px] font-semibold transition-all ${
            value === o.id
              ? 'bg-white text-neutral-900 shadow-[0_1px_3px_rgba(20,22,26,0.12)]'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Color field ---------- */

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = /^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] font-medium text-neutral-600">{label}</span>
      <div className="flex items-center gap-2 rounded-[10px] border border-transparent bg-neutral-100 py-1 pl-1.5 pr-2 transition focus-within:border-neutral-900 focus-within:bg-white">
        <label
          className="relative h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-black/10"
          style={{ background: valid }}
          aria-label={`${label} picker`}
        >
          <input
            type="color"
            value={valid}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          className="w-[4.5rem] bg-transparent font-mono text-[11.5px] uppercase text-neutral-900 outline-none"
          aria-label={`${label} hex`}
        />
      </div>
    </div>
  );
}

/* ---------- Chips ---------- */

export function PresetChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
        active
          ? 'bg-teal-700 text-white'
          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
      }`}
    >
      {label}
    </button>
  );
}

export function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-[9px] px-2.5 py-1 text-[11px] font-semibold transition ${
        active
          ? 'bg-teal-700 text-white'
          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'
      }`}
    >
      {children}
    </button>
  );
}
