import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { ApiClientError } from '../api/client';
import { AppearanceControls } from './AppearanceControls';
import { LegalFooter } from './LegalFooter';
import type { LocalePref, SchemePref, Skin } from '../hooks/useTheme';
import type { FontPref, UiSizePref } from '../hooks/useUiPrefs';

type Props = {
  t: (key: string) => string;
  onSuccess: (username: string) => void;
  initialError?: string;
  localePref: LocalePref;
  schemePref: SchemePref;
  skin: Skin;
  fontPref: FontPref;
  uiSizePref: UiSizePref;
  onLocale: (v: LocalePref) => void;
  onScheme: (v: SchemePref) => void;
  onSkin: (v: Skin) => void;
  onFont: (v: FontPref) => void;
  onUiSize: (v: UiSizePref) => void;
};

export function LoginScreen({
  t,
  onSuccess,
  initialError,
  localePref,
  schemePref,
  skin,
  fontPref,
  uiSizePref,
  onLocale,
  onScheme,
  onSkin,
  onFont,
  onUiSize
}: Props) {
  const [error, setError] = useState(initialError ?? '');
  const [showError, setShowError] = useState(Boolean(initialError));

  const onSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setShowError(false);
    const form = ev.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      const data = await api<{ username?: string }>('POST', '/login', { username, password });
      onSuccess(data.username || username);
    } catch (err) {
      const raw = err instanceof ApiClientError ? err.message : '';
      const isGenericAuth =
        !raw ||
        /invalid credentials|unauthorized|dashboard login required/i.test(raw);
      setError(isGenericAuth ? t('loginFailed') : raw);
      setShowError(true);
    }
  };

  return (
    <div className="login-shell">
      <header className="login-chrome">
        <span className="login-chrome__brand">{t('appTitle')}</span>
        <AppearanceControls
          t={t}
          localePref={localePref}
          schemePref={schemePref}
          skin={skin}
          fontPref={fontPref}
          uiSizePref={uiSizePref}
          onLocale={onLocale}
          onScheme={onScheme}
          onSkin={onSkin}
          onFont={onFont}
          onUiSize={onUiSize}
          compact
        />
      </header>
      <section className="login-screen">
        <div className="login-card">
          <h1>{t('loginTitle')}</h1>
          <p>{t('loginHint')}</p>
          <div className={`msg msg--error${showError ? '' : ' hidden'}`} role="alert">
            {error}
          </div>
          <form onSubmit={onSubmit}>
            <div className="form-row">
              <label htmlFor="login-username">{t('username')}</label>
              <input id="login-username" name="username" type="text" autoComplete="username" required />
            </div>
            <div className="form-row">
              <label htmlFor="login-password">{t('password')}</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary btn--sign-in">
              {t('signIn')}
            </button>
          </form>
        </div>
      </section>
      <LegalFooter t={t} />
    </div>
  );
}
