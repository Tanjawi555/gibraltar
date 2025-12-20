'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Notification {
  type: string;
  rental: {
    start_date: string;
    return_date: string;
    model: string;
    plate_number: string;
    full_name: string;
  };
  severity: string;
}

interface DashboardData {
  carStats: {
    total: number;
    available: number;
    rented: number;
    reserved: number;
  };
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  notifications: Notification[];
  username: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
      document.documentElement.lang = savedLang;
      document.documentElement.dir = isRTL(savedLang) ? 'rtl' : 'ltr';
      if (isRTL(savedLang)) {
        document.body.classList.add('rtl');
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setT(getTranslations(newLang));
    localStorage.setItem('lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
    if (isRTL(newLang)) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
      <div className="container-fluid py-4">
        {/* Welcome Section */}
        <div className="d-flex justify-content-between align-items-center mb-5 animate-fade-in-up">
          <div>
            <h2 className="fw-bold mb-1">
              {t.dashboard}
            </h2>
            <p className="text-muted mb-0">
              {t.welcome}, <span className="text-primary fw-bold">{data?.username || session.user?.name}</span>
            </p>
          </div>
          <div className="d-none d-md-block">
            <span className="badge bg-white text-dark shadow-sm py-2 px-3">
              <i className="bi bi-calendar-check me-2 text-primary"></i>
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Car Stats Row */}
        <div className="row g-4 mb-4">
          <div className="col-6 col-lg-3 animate-fade-in-up delay-1">
            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="stat-label mb-1">{t.total_cars}</p>
                  <h3 className="stat-value">{data?.carStats.total || 0}</h3>
                </div>
                <div className="card-icon-wrapper icon-blue mb-0">
                  <i className="bi bi-car-front-fill"></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div className="progress-bar bg-primary" role="progressbar" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-lg-3 animate-fade-in-up delay-1">
            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="stat-label mb-1">{t.available}</p>
                  <h3 className="stat-value text-success">{data?.carStats.available || 0}</h3>
                </div>
                <div className="card-icon-wrapper icon-green mb-0">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
              </div>
               <div className="progress mt-3" style={{ height: '4px' }}>
                <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(data?.carStats.total ? ((data?.carStats.available || 0) / data.carStats.total) * 100 : 0)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3 animate-fade-in-up delay-2">
            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="stat-label mb-1">{t.reserved}</p>
                  <h3 className="stat-value text-warning">{data?.carStats.reserved || 0}</h3>
                </div>
                <div className="card-icon-wrapper icon-yellow mb-0">
                  <i className="bi bi-hourglass-split"></i>
                </div>
              </div>
              <div className="progress mt-3" style={{ height: '4px' }}>
                <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${(data?.carStats.total ? ((data?.carStats.reserved || 0) / data.carStats.total) * 100 : 0)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3 animate-fade-in-up delay-2">
            <div className="dashboard-card p-4">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="stat-label mb-1">{t.rented}</p>
                  <h3 className="stat-value text-info">{data?.carStats.rented || 0}</h3>
                </div>
                <div className="card-icon-wrapper icon-cyan mb-0">
                  <i className="bi bi-key-fill"></i>
                </div>
              </div>
               <div className="progress mt-3" style={{ height: '4px' }}>
                <div className="progress-bar bg-info" role="progressbar" style={{ width: `${(data?.carStats.total ? ((data?.carStats.rented || 0) / data.carStats.total) * 100 : 0)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Stats Row */}
        <div className="row g-4 mb-4">
          <div className="col-md-4 animate-fade-in-up delay-3">
            <div className="dashboard-card p-4 h-100 border-start border-4 border-danger">
              <div className="d-flex align-items-center">
                <div className="card-icon-wrapper bg-danger bg-opacity-10 text-danger mb-0 me-3">
                   <i className="bi bi-cash-coin"></i>
                </div>
                <div>
                  <p className="stat-label mb-1">{t.total_expenses}</p>
                  <h3 className="fw-bold mb-0 text-dark">{(data?.totalExpenses || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 animate-fade-in-up delay-3">
             <div className="dashboard-card p-4 h-100 border-start border-4 border-primary">
              <div className="d-flex align-items-center">
                <div className="card-icon-wrapper bg-primary bg-opacity-10 text-primary mb-0 me-3">
                   <i className="bi bi-wallet2"></i>
                </div>
                <div>
                  <p className="stat-label mb-1">{t.total_revenue}</p>
                  <h3 className="fw-bold mb-0 text-dark">{(data?.totalRevenue || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 animate-fade-in-up delay-3">
             <div className={`dashboard-card p-4 h-100 border-start border-4 ${(data?.totalProfit || 0) >= 0 ? 'border-success' : 'border-danger'}`}>
              <div className="d-flex align-items-center">
                <div className={`card-icon-wrapper ${(data?.totalProfit || 0) >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} mb-0 me-3`}>
                   <i className={`bi bi-graph-up-arrow`}></i>
                </div>
                <div>
                  <p className="stat-label mb-1">{t.total_profit}</p>
                  <h3 className={`fw-bold mb-0 ${(data?.totalProfit || 0) >= 0 ? 'text-success' : 'text-danger'}`}>{(data?.totalProfit || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="row animate-fade-in-up delay-3">
            <div className="col-12">
            <div className="dashboard-card">
              <div className="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <div className="card-icon-wrapper icon-blue mb-0 me-3" style={{width: '40px', height: '40px', fontSize: '1.2rem'}}>
                        <i className="bi bi-bell-fill"></i>
                    </div>
                    <h5 className="mb-0 fw-bold">{t.notifications}</h5>
                </div>
                
                {data?.notifications && data.notifications.length > 0 && (
                  <span className="badge bg-danger rounded-pill shadow-sm">
                    {data.notifications.length} {t.notifications}
                  </span>
                )}
              </div>
              <div className="card-body p-0">
                {data?.notifications && data.notifications.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {data.notifications.map((notif, index) => (
                      <div key={index} className={`list-group-item notification-item border-0 px-4 py-3 status-${notif.severity}`}>
                        <div className="d-flex align-items-center">
                           <div className="flex-shrink-0 me-3">
                            {notif.type === 'start_today' && <i className="bi bi-calendar-event-fill text-warning fs-4"></i>}
                            {notif.type === 'start_tomorrow' && <i className="bi bi-calendar-plus-fill text-info fs-4"></i>}
                            {notif.type === 'return_today' && <i className="bi bi-calendar-check-fill text-primary fs-4"></i>}
                            {notif.type === 'overdue' && <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>}
                           </div>
                           <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap">
                                    <h6 className="mb-0 fw-bold">
                                        {notif.type === 'start_today' && t.start_today}
                                        {notif.type === 'start_tomorrow' && t.start_tomorrow}
                                        {notif.type === 'return_today' && t.return_today}
                                        {notif.type === 'overdue' && t.overdue}
                                    </h6>
                                    <span className="text-muted small">
                                      <i className="bi bi-clock me-1"></i>
                                      {notif.rental.start_date} <i className="bi bi-arrow-right mx-1"></i> {notif.rental.return_date}
                                    </span>
                                </div>
                                <p className="mb-0 text-muted small">
                                    <span className="fw-semibold text-dark">{notif.rental.model}</span> 
                                    <span className="mx-2">•</span>
                                    {notif.rental.plate_number}
                                    <span className="mx-2">•</span>
                                    <span className="text-primary">{notif.rental.full_name}</span>
                                </p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3 opacity-25">
                      <i className="bi bi-bell-slash" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <p className="text-muted mb-0 fw-medium">{t.no_notifications}</p>
                  </div>
                )}
              </div>
            </div>
            </div>
        </div>
      </div>
    </>
  );
}
