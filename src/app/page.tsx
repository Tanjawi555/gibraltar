'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';
import { toBusinessInputString } from '@/lib/timezone';

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
  
  // Date Filter (YYYY-MM)
  const [filterDate, setFilterDate] = useState(() => {
     // Default to current business month
     const nowStr = toBusinessInputString(new Date());
     return nowStr ? nowStr.slice(0, 7) : new Date().toISOString().slice(0, 7);
  });

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
  }, [session, filterDate]);

  const fetchData = async () => {
    try {
      const [year, month] = filterDate.split('-');
      const res = await fetch(`/api/dashboard?month=${month}&year=${year}`);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
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
    <AppLayout 
      t={t} 
      currentLang={lang} 
      isRtl={isRTL(lang)} 
      onLanguageChange={handleLanguageChange}
      username={data?.username || session.user?.name || undefined}
    >
      <div className="container-fluid py-4">
        {/* Welcome Section & Filter */}
        <div className="d-flex justify-content-between align-items-center mb-5 animate-fade-in-up flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              {t.dashboard}
            </h2>
            <p className="text-muted mb-0">
              {t.welcome}, <span className="text-primary fw-bold">{data?.username || session.user?.name}</span>
            </p>
          </div>
          
          <div className="d-flex align-items-center gap-3">
             {/* Month Filter */}
            <div className="card border-0 shadow-sm" style={{borderRadius: '1rem'}}>
                <div className="card-body p-2 d-flex align-items-center">
                    <span className="ps-3 text-muted me-2"><i className="bi bi-calendar-month"></i></span>
                    <input 
                        type="month" 
                        className="form-control border-0 shadow-none bg-transparent"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
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
          
          
        </div>

        {/* Notifications Section */}
        {/* Smart Alerts Section */}
        {data?.notifications && data.notifications.length > 0 && (
          <div className="mb-4 animate-fade-in-up delay-1">
            <h5 className="fw-bold mb-3">Smart Alerts</h5>
            <div className="d-flex flex-column gap-3">
              {data.notifications.map((notif, index) => {
                let bgColor = 'bg-primary';
                let icon = 'bi-info-circle';
                let title = '';

                let dateLabel = '';
                let dateValue = '';

                switch (notif.type) {
                  case 'overdue':
                    bgColor = 'bg-danger';
                    icon = 'bi-exclamation-triangle';
                    title = `${t.overdue}: ${notif.rental.model}`;
                    dateLabel = t.return_date || 'Return';
                    dateValue = notif.rental.return_date;
                    break;
                  case 'start_today':
                    bgColor = 'bg-success';
                    icon = 'bi-clock';
                    title = `${t.start_today}: ${notif.rental.model}`;
                    dateLabel = t.start_date || 'Start';
                    dateValue = notif.rental.start_date;
                    break;
                   case 'start_tomorrow':
                    bgColor = 'bg-info'; 
                    icon = 'bi-calendar-plus';
                    title = `${t.start_tomorrow}: ${notif.rental.model}`;
                    dateLabel = t.start_date || 'Start';
                    dateValue = notif.rental.start_date;
                    break;
                  case 'return_today':
                    bgColor = 'bg-warning';
                    icon = 'bi-arrow-return-left';
                    title = `${t.return_today}: ${notif.rental.model}`;
                    dateLabel = t.return_date || 'Return';
                    dateValue = notif.rental.return_date;
                    break;
                  default:
                    bgColor = 'bg-secondary';
                    title = 'Notification';
                }

                return (
                  <div key={index} className={`d-flex align-items-center p-3 rounded-3 text-white shadow-sm ${bgColor}`} style={{ minHeight: '80px' }}>
                    <div className="rounded-circle bg-white bg-opacity-25 d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                      <i className={`bi ${icon} fs-4`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>{title}</h6>
                      <div className="d-flex align-items-center opacity-75 small">
                         <div className="d-flex align-items-center me-3">
                            <i className="bi bi-person-fill me-1"></i>
                            <span>{notif.rental.full_name}</span>
                         </div>
                         <div className="d-flex align-items-center">
                            <i className="bi bi-calendar-event-fill me-1"></i>
                            <span>{formatDate(dateValue)}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </AppLayout>
  );
}
