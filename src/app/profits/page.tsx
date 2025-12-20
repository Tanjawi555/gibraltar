'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Rental {
  _id: string;
  car_model: string;
  plate_number: string;
  client_name: string;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
}

interface ProfitData {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  rentals: Rental[];
}

export default function ProfitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [data, setData] = useState<ProfitData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') as Language;
    if (savedLang && ['ar', 'en', 'fr'].includes(savedLang)) {
      setLang(savedLang);
      setT(getTranslations(savedLang));
      document.documentElement.lang = savedLang;
      document.documentElement.dir = isRTL(savedLang) ? 'rtl' : 'ltr';
      if (isRTL(savedLang)) document.body.classList.add('rtl');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/profits');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch profits:', error);
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
    if (isRTL(newLang)) document.body.classList.add('rtl');
    else document.body.classList.remove('rtl');
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

  if (!session) return null;

  return (
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
      <div className="container-fluid py-4">
        
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 animate-fade-in-up">
           <div>
               <h2 className="fw-bold mb-1"><i className="bi bi-graph-up-arrow text-primary me-2"></i>{t.profit_overview}</h2>
               <p className="text-muted mb-0">{t.app_name}</p>
           </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-4 mb-4 animate-fade-in-up delay-1">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(45deg, #4e73df 0%, #224abe 100%)', color: 'white'}}>
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-uppercase mb-2 opacity-75 fw-bold" style={{fontSize: '0.8rem'}}>{t.revenue}</h6>
                  <h3 className="mb-0 fw-bold display-6">{(data?.totalRevenue || 0).toFixed(2)} <span className="fs-6 opacity-75">DZD</span></h3>
                </div>
                <div className="rounded-circle bg-white bg-opacity-25 p-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                   <i className="bi bi-wallet2 fs-2 text-white"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(45deg, #e74a3b 0%, #be2617 100%)', color: 'white'}}>
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                   <h6 className="text-uppercase mb-2 opacity-75 fw-bold" style={{fontSize: '0.8rem'}}>{t.total_expenses}</h6>
                   <h3 className="mb-0 fw-bold display-6">{(data?.totalExpenses || 0).toFixed(2)} <span className="fs-6 opacity-75">DZD</span></h3>
                </div>
                 <div className="rounded-circle bg-white bg-opacity-25 p-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                   <i className="bi bi-cash-stack fs-2 text-white"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
             <div className="card border-0 shadow-sm h-100" style={{
                background: (data?.totalProfit || 0) >= 0 
                  ? 'linear-gradient(45deg, #1cc88a 0%, #13855c 100%)' 
                  : 'linear-gradient(45deg, #e74a3b 0%, #be2617 100%)',
                color: 'white'
              }}>
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                   <h6 className="text-uppercase mb-2 opacity-75 fw-bold" style={{fontSize: '0.8rem'}}>{t.net_profit}</h6>
                   <h3 className="mb-0 fw-bold display-6">{(data?.totalProfit || 0).toFixed(2)} <span className="fs-6 opacity-75">DZD</span></h3>
                </div>
                 <div className="rounded-circle bg-white bg-opacity-25 p-3 d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px'}}>
                   <i className="bi bi-graph-up-arrow fs-2 text-white"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed List */}
        <div className="dashboard-card animate-fade-in-up delay-2" style={{overflow: 'hidden'}}>
          <div className="card-header bg-white py-3 border-0">
             <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-list-ul me-2 text-primary"></i> {t.rentals}</h5>
          </div>
          <div className="card-body p-0">
            {data?.rentals && data.rentals.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 ps-4 text-secondary text-uppercase small bg-transparent">#</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.car_model}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.full_name}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.start_date}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.return_date}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.rental_price}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent text-end pe-4">{t.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rentals.map((rental, index) => (
                      <tr key={rental._id} className="border-bottom border-light">
                        <td className="ps-4 fw-medium text-muted">{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-3 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-car-front-fill"></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{rental.car_model}</div>
                                <div className="small text-muted font-monospace">{rental.plate_number}</div>
                              </div>
                          </div>
                        </td>
                        <td>
                            <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-info bg-opacity-10 text-info p-1 me-2 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                    <i className="bi bi-person-fill small"></i>
                                </div>
                                <div>
                                    <div className="fw-medium text-dark">{rental.client_name}</div>
                                    <div className="d-md-none small text-muted"> {rental.start_date} </div>
                                </div>
                            </div>
                        </td>
                        <td className="d-none d-md-table-cell text-muted">{rental.start_date}</td>
                        <td className="d-none d-md-table-cell text-muted">{rental.return_date}</td>
                        <td className="fw-bold text-success">
                          +{rental.rental_price.toFixed(2)} DZD
                        </td>
                        <td className="text-end pe-4">
                          {rental.status === 'reserved' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2">{t.reserved}</span>}
                          {rental.status === 'rented' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2">{t.rented}</span>}
                          {rental.status === 'returned' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">{t.returned}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-3 opacity-25">
                      <i className="bi bi-graph-up-arrow" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h5 className="text-muted fw-medium">{t.no_data}</h5>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
