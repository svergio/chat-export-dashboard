import { useEffect, useId, useRef, useState } from 'react';

type Props = {
  t: (key: string) => string;
};

export function LegalFooter({ t }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        setOpen(false);
        return;
      }
      if (ev.key !== 'Tab' || !closeRef.current) return;
      const root = closeRef.current.closest('.legal-modal');
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      } else {
        triggerRef.current?.focus();
      }
    };
  }, [open]);

  return (
    <>
      <footer className="legal-footer" role="contentinfo">
        <button
          ref={triggerRef}
          type="button"
          className="legal-footer__trigger"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {t('legalBadge')}
        </button>
        <span className="legal-footer__sep" aria-hidden="true">
          ·
        </span>
        <div className="legal-footer__links">
          <a
            href="https://github.com/svergio/chat-export-extension/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('issuesExtension')}
          </a>
          <span className="legal-footer__sep" aria-hidden="true">
            ·
          </span>
          <a
            href="https://github.com/svergio/chat-export-server/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('issuesServer')}
          </a>
          <span className="legal-footer__sep" aria-hidden="true">
            ·
          </span>
          <a href="https://mcpservers.org/ru/" target="_blank" rel="noopener noreferrer">
            mcpservers.org
          </a>
        </div>
      </footer>

      {open ? (
        <div
          className="legal-modal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="legal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="legal-modal__head">
              <h2 id={titleId} className="legal-modal__title">
                {t('legalModalTitle')}
              </h2>
              <button
                ref={closeRef}
                type="button"
                className="legal-modal__close"
                onClick={() => setOpen(false)}
                aria-label={t('legalClose')}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="legal-modal__body">
              <p>{t('legalOssLead')}</p>
              <p className="legal-modal__warn">{t('legalRiskLead')}</p>
              <p>{t('legalLocalLead')}</p>
              <p>
                {t('legalIssueLead')}{' '}
                <a
                  href="https://github.com/svergio/chat-export-extension/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  chat-export-extension/issues
                </a>{' '}
                /{' '}
                <a
                  href="https://github.com/svergio/chat-export-server/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  chat-export-server/issues
                </a>
                {' · '}
                <a
                  href="https://mcpservers.org/ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mcpservers.org/ru/
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
