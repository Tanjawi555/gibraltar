'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Translations, Language } from '@/lib/translations';

interface BottomNavProps {
  t: Translations;
  isRtl: boolean;
  onMenuClick: () => void;
}

export default function BottomNav({ t, isRtl, onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed-bottom bg-white border-top shadow-lg" style={{ zIndex: 1030, paddingBottom: 'safe-area-inset-bottom' }}>
      <div className="container-fluid">
        <div className="row g-0 text-center py-2">
          <div className="col">
            <Link href="/" className={`d-flex flex-column align-items-center text-decoration-none ${isActive('/') ? 'text-primary' : 'text-secondary'}`}>
              <i className={`bi bi-speedometer2 fs-4 ${isActive('/') ? 'fill-primary' : ''}`}></i>
              <span style={{ fontSize: '0.7rem', fontWeight: isActive('/') ? 600 : 400 }}>{t.dashboard}</span>
            </Link>
          </div>
          <div className="col">
            <Link href="/cars" className={`d-flex flex-column align-items-center text-decoration-none ${isActive('/cars') ? 'text-primary' : 'text-secondary'}`}>
              <i className={`bi bi-car-front fs-4 ${isActive('/cars') ? 'fill-primary' : ''}`}></i>
              <span style={{ fontSize: '0.7rem', fontWeight: isActive('/cars') ? 600 : 400 }}>{t.cars}</span>
            </Link>
          </div>
          <div className="col">
            <Link href="/rentals" className={`d-flex flex-column align-items-center text-decoration-none ${isActive('/rentals') ? 'text-primary' : 'text-secondary'}`}>
              <i className={`bi bi-calendar-check fs-4 ${isActive('/rentals') ? 'fill-primary' : ''}`}></i>
              <span style={{ fontSize: '0.7rem', fontWeight: isActive('/rentals') ? 600 : 400 }}>{t.rentals}</span>
            </Link>
          </div>
          <div className="col">
            <Link href="/clients" className={`d-flex flex-column align-items-center text-decoration-none ${isActive('/clients') ? 'text-primary' : 'text-secondary'}`}>
              <i className={`bi bi-people fs-4 ${isActive('/clients') ? 'fill-primary' : ''}`}></i>
              <span style={{ fontSize: '0.7rem', fontWeight: isActive('/clients') ? 600 : 400 }}>{t.clients}</span>
            </Link>
          </div>
          <div className="col">
            <button onClick={onMenuClick} className="btn btn-link p-0 w-100 d-flex flex-column align-items-center text-decoration-none text-secondary">
              <i className="bi bi-grid fs-4"></i>
              <span style={{ fontSize: '0.7rem' }}>{t.more || 'Menu'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
