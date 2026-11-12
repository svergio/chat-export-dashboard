import { useEffect, useState } from 'react';

type Props = {
  t: (key: string) => string;
};

export function LegalFooter({ t }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <footer className="legal-footer" role="contentinfo">
        <button
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
            Extension Issues
          </a>
          <span className="legal-footer__sep" aria-hidden="true">
            ·
          </span>
          <a
            href="https://github.com/svergio/chat-export-server/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Server Issues
          </a>
          <span className="legal-footer__sep" aria-hidden="true">
            ·
          </span>
          <a
            href="https://mcpservers.org/ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
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
            aria-labelledby="legal-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="legal-modal__head">
              <h2 id="legal-modal-title">{t('legalModalTitle')}</h2>
              <button
                type="button"
                className="btn btn--sm"
                onClick={() => setOpen(false)}
              >
                {t('legalClose')}
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
