'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
    }
    // Database initialization moved to auth flow for security
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setT(getTranslations(newLang));
    localStorage.setItem('lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.invalid_credentials);
    } else {
      router.push('/');
    }
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid ${isRTL(lang) ? 'rtl' : ''}`} dir={isRTL(lang) ? 'rtl' : 'ltr'}>
      <div className="row justify-content-center mt-5">
        <div className="col-md-4 col-lg-3">
          <div className="card shadow">
            <div className="card-header bg-primary text-white text-center">
              <h4>
                <i className="bi bi-car-front-fill"></i> {t.app_name}
              </h4>
            </div>
            <div className="card-body">
              <h5 className="text-center mb-4">{t.login}</h5>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    {t.username}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    autoFocus
                    aria-label="Username"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    aria-label="Password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    t.login_btn
                  )}
                </button>
              </form>

              <hr />
              <div className="text-center">
                <small className="text-muted">{t.language}:</small>
                <div className="btn-group btn-group-sm mt-2">
                  <button
                    className={`btn btn-outline-secondary ${lang === 'ar' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('ar')}
                  >
                    {t.arabic}
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('en')}
                  >
                    {t.english}
                  </button>
                  <button
                    className={`btn btn-outline-secondary ${lang === 'fr' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('fr')}
                  >
                    {t.french}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
