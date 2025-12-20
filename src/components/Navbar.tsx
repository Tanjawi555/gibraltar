'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Translations, Language } from '@/lib/translations';

interface NavbarProps {
  t: Translations;
  currentLang: Language;
  isRtl: boolean;
  onLanguageChange: (lang: Language) => void;
}

export default function Navbar({ t, currentLang, isRtl, onLanguageChange }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand fw-bold">
          <i className="bi bi-car-front-fill me-2"></i> {t.app_name}
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              >
                <i className="bi bi-speedometer2 me-1"></i> {t.dashboard}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/cars"
                className={`nav-link ${pathname === '/cars' ? 'active' : ''}`}
              >
                <i className="bi bi-car-front me-1"></i> {t.cars}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/clients"
                className={`nav-link ${pathname === '/clients' ? 'active' : ''}`}
              >
                <i className="bi bi-people me-1"></i> {t.clients}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/rentals"
                className={`nav-link ${pathname === '/rentals' ? 'active' : ''}`}
              >
                <i className="bi bi-calendar-check me-1"></i> {t.rentals}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/expenses"
                className={`nav-link ${pathname === '/expenses' ? 'active' : ''}`}
              >
                <i className="bi bi-cash-stack me-1"></i> {t.expenses}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="/profits"
                className={`nav-link ${pathname === '/profits' ? 'active' : ''}`}
              >
                <i className="bi bi-graph-up-arrow me-1"></i> {t.profits}
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav align-items-center">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="langDropdown"
                role="button"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-globe me-1"></i> {t.language}
              </a>
              <ul className="dropdown-menu dropdown-menu-end shadow">
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'ar' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('ar')}
                  >
                    {t.arabic}
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'en' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('en')}
                  >
                    {t.english}
                  </button>
                </li>
                <li>
                  <button
                    className={`dropdown-item ${currentLang === 'fr' ? 'active' : ''}`}
                    onClick={() => onLanguageChange('fr')}
                  >
                    {t.french}
                  </button>
                </li>
              </ul>
            </li>
            <li className="nav-item border-start ms-2 ps-2">
              <button
                className="nav-link btn btn-link text-white-50 hover-text-white"
                onClick={() => signOut({ callbackUrl: '/login' })}
                title={t.logout}
              >
                <i className="bi bi-box-arrow-right fs-5"></i> 
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
