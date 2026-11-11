import { ReactNode, useEffect, useRef } from 'react';
import { IconChevron } from './SkinIcons';

type Props = {
  valueLabel: string;
  leading?: ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  label?: string;
  compact?: boolean;
  children: ReactNode;
};

export function SelectMenu({
  valueLabel,
  leading,
  open,
  setOpen,
  disabled,
  ariaLabel,
  label,
  compact,
  children
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(ev: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, setOpen]);

  const select = (
    <div className={`ce-select${open ? ' is-open' : ''}${compact ? ' ce-select--compact' : ''}`}>
      <button
        type="button"
        className="ce-select-btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open ? 'true' : 'false'}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
      >
        {leading ? <span className="ce-select-leading">{leading}</span> : null}
        <span className="ce-select-value">{valueLabel}</span>
        <IconChevron size={12} />
      </button>
      {open ? (
        <div className="ce-select-menu" role="listbox" aria-label={ariaLabel}>
          {children}
        </div>
      ) : null}
    </div>
  );

  if (label) {
    return (
      <div className="ce-row ce-select-row" ref={rootRef}>
        <span>{label}</span>
        {select}
      </div>
    );
  }

  return (
    <div className="ce-select-wrap" ref={rootRef}>
      {select}
    </div>
  );
}
