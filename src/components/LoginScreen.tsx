import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { ApiClientError } from '../api/client';

type Props = {
  t: (key: string) => string;
  onSuccess: (username: string) => void;
  initialError?: string;
};

export function LoginScreen({ t, onSuccess, initialError }: Props) {
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
      const msg = err instanceof ApiClientError ? err.message : t('loginFailed');
      setError(msg || t('loginFailed'));
      setShowError(true);
    }
  };

  return (
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
          <button type="submit" className="btn btn--primary">
            {t('signIn')}
          </button>
        </form>
      </div>
    </section>
  );
}
