'use client';

import { useState, ReactNode } from 'react';
import BottomNav from './BottomNav';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Translations, Language } from '@/lib/translations';

interface AppLayoutProps {
  children: ReactNode;
  t: Translations;
  currentLang: Language;
  isRtl: boolean;
  onLanguageChange: (lang: Language) => void;
  username?: string;
}

export default function AppLayout({ children, t, currentLang, isRtl, onLanguageChange, username }: AppLayoutProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" style={{ paddingBottom: '80px' }}>
      
      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>

      <BottomNav t={t} isRtl={isRtl} onMenuClick={() => setShowMenu(true)} />

      {/* Menu Offcanvas/Modal */}
      {showMenu && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }}>
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" onClick={() => setShowMenu(false)}></div>
          <div className={`position-absolute bottom-0 w-100 bg-white rounded-top-4 p-4 animate-fade-in-up`} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
               <h5 className="fw-bold mb-0">{t.app_name}</h5>
               <button className="btn-close" onClick={() => setShowMenu(false)}></button>
            </div>

            {/* User Info */}
            <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-3">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px', fontSize: '1.25rem'}}>
                    {username ? username[0].toUpperCase() : 'U'}
                </div>
                <div>
                    <h6 className="mb-0 fw-bold">{username || 'User'}</h6>
                    <small className="text-muted">Manager</small>
                </div>
            </div>

            <div className="row g-3">
               <div className="col-6">
                 <Link href="/expenses" className="btn btn-outline-light text-dark border w-100 p-3 d-flex flex-column align-items-center gap-2" onClick={() => setShowMenu(false)}>
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2">
                        <i className="bi bi-cash-stack fs-4"></i>
                    </div>
                    <span>{t.expenses}</span>
                 </Link>
               </div>
               <div className="col-6">
                 <Link href="/profits" className="btn btn-outline-light text-dark border w-100 p-3 d-flex flex-column align-items-center gap-2" onClick={() => setShowMenu(false)}>
                    <div className="bg-success bg-opacity-10 text-success rounded-circle p-2">
                        <i className="bi bi-graph-up-arrow fs-4"></i>
                    </div>
                    <span>{t.profits}</span>
                 </Link>
               </div>
               <div className="col-6">
                 <Link href="/documents" className="btn btn-outline-light text-dark border w-100 p-3 d-flex flex-column align-items-center gap-2" onClick={() => setShowMenu(false)}>
                    <div className="bg-info bg-opacity-10 text-info rounded-circle p-2">
                        <i className="bi bi-file-earmark-image fs-4"></i>
                    </div>
                    <span>{t.documents || 'Documents'}</span>
                 </Link>
               </div>
               <div className="col-6">
                 <Link href="/cars" className="btn btn-outline-light text-dark border w-100 p-3 d-flex flex-column align-items-center gap-2" onClick={() => setShowMenu(false)}>
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2">
                        <i className="bi bi-tools fs-4"></i>
                    </div>
                    <span>{t.service_technic || 'Service'}</span>
                 </Link>
               </div>
            </div>

            <hr className="my-4" />

            {/* Language Selector */}
            <div className="mb-4">
                <label className="form-label text-muted small text-uppercase fw-bold mb-3">{t.language}</label>
                <div className="btn-group w-100" role="group">
                    <button type="button" className={`btn ${currentLang === 'ar' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => onLanguageChange('ar')}>{t.arabic}</button>
                    <button type="button" className={`btn ${currentLang === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => onLanguageChange('en')}>{t.english}</button>
                    <button type="button" className={`btn ${currentLang === 'fr' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => onLanguageChange('fr')}>{t.french}</button>
                </div>
            </div>

            {/* Logout */}
             <button className="btn btn-danger w-100 py-3 d-flex align-items-center justify-content-center gap-2" onClick={() => signOut({ callbackUrl: '/login' })}>
                <i className="bi bi-box-arrow-right"></i> {t.logout}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
