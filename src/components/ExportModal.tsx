import { useEffect, useState } from 'react';
import JSZip from 'jszip';

type Tab = 'html' | 'css' | 'js' | 'single';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  css: string;
  jquery: string;
  bundle: string;
}

const TABS: { id: Tab; label: string; file: string; mime: string }[] = [
  { id: 'html', label: 'HTML', file: 'index.html', mime: 'text/html;charset=utf-8' },
  { id: 'css', label: 'CSS', file: 'liquid-glass.css', mime: 'text/css;charset=utf-8' },
  { id: 'js', label: 'jQuery', file: 'liquid-glass.js', mime: 'text/javascript;charset=utf-8' },
  { id: 'single', label: 'Single HTML file', file: 'liquid-glass-demo.html', mime: 'text/html;charset=utf-8' },
];

/** Robust file download — works in normal pages and sandboxed frames. */
function saveFile(filename: string, data: Blob) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 4000);
}

function saveText(filename: string, content: string, mime: string) {
  saveFile(filename, new Blob([content], { type: mime }));
}

export function ExportModal({
  isOpen,
  onClose,
  html,
  css,
  jquery,
  bundle,
}: ExportModalProps) {
  const [tab, setTab] = useState<Tab>('html');
  const [copied, setCopied] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const active = TABS.find((t) => t.id === tab)!;
  const code =
    tab === 'html' ? html : tab === 'css' ? css : tab === 'js' ? jquery : bundle;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const save = () => {
    saveText(active.file, code, active.mime);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const downloadAll = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      zip.file('index.html', html);
      zip.file('liquid-glass.css', css);
      zip.file('liquid-glass.js', jquery);
      zip.file('liquid-glass-demo.html', bundle);
      const blob = await zip.generateAsync({ type: 'blob' });
      saveFile('liquid-glass.zip', blob);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Export code"
    >
      <div
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[88vh] sm:max-w-4xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200/80 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-teal-700 to-teal-400 text-white">
              <CodeIcon />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                Export code
              </h2>
              <p className="truncate text-[11.5px] text-neutral-500">
                Add <code className="font-mono text-neutral-900">class="liquid-glass"</code> to
                any div — that's it
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={downloadAll}
              disabled={zipping}
              className="hidden items-center gap-1.5 rounded-[11px] bg-gradient-to-r from-teal-700 to-teal-400 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110 active:scale-[.98] disabled:opacity-60 sm:inline-flex"
            >
              <DownloadIcon /> {zipping ? 'Zipping…' : 'Download all (.zip)'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-[10px] p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 sm:px-6">
          <div className="no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto px-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-[9px] px-3 py-1.5 text-[11.5px] font-semibold transition ${
                  tab === t.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={save}
              className={`inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[11px] font-semibold transition active:scale-[.98] ${
                saved
                  ? 'bg-teal-50 text-teal-800'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {saved ? <CheckIcon /> : <DownloadIcon />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex items-center gap-1.5 rounded-[9px] px-3 py-1.5 text-[11px] font-semibold text-white transition active:scale-[.98] ${
                copied ? 'bg-gradient-to-r from-teal-700 to-teal-400' : 'bg-neutral-900 hover:bg-neutral-700'
              }`}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="mx-4 my-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#14161a] sm:mx-6 sm:my-4">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-2 text-[10.5px]">
            <span className="truncate font-mono text-teal-300">{active.file}</span>
            <span className="shrink-0 font-mono text-white/40">
              {(code.length / 1024).toFixed(1)} KB
            </span>
          </div>
          <pre className="scroll-dark min-h-[200px] flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-200 sm:text-[11.5px]">
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2.5 border-t border-neutral-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[11px] text-neutral-400">
            Just copy, save or download the file you need.
          </p>
          <button
            type="button"
            onClick={downloadAll}
            disabled={zipping}
            className="inline-flex items-center justify-center gap-1.5 rounded-[11px] bg-gradient-to-r from-teal-700 to-teal-400 px-3.5 py-2.5 text-[12px] font-semibold text-white transition hover:brightness-110 active:scale-[.98] disabled:opacity-60 sm:hidden"
          >
            <DownloadIcon /> {zipping ? 'Zipping…' : 'Download all (.zip)'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
