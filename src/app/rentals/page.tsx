'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';
import { toBusinessInputString, formatInBusinessTime } from '@/lib/timezone';

interface Car {
  _id: string;
  model: string;
  plate_number: string;
}

interface Client {
  _id: string;
  full_name: string;
}

interface Rental {
  _id: string;
  car_id: string;
  client_id: string;
  car_model: string;
  plate_number: string;
  client_name: string;
  start_date: string;
  return_date: string;
  rental_price: number;
  status: 'reserved' | 'rented' | 'returned';
}

export default function RentalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Initialize with Business Time defaults
  const [formData, setFormData] = useState({
    car_id: '',
    client_id: '',
    start_date: toBusinessInputString(new Date()), 
    return_date: toBusinessInputString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    rental_price: '',
  });
  
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Pagination and Search inputs
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;
  
  // Date Filter (Year-Month)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

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
    if (session) {
      const timer = setTimeout(() => {
        fetchData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [session, page, search, filterDate]);

  const fetchData = async () => {
    try {
      const [year, month] = filterDate.split('-');
      const res = await fetch(`/api/rentals?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setRentals(data.rentals);
        setTotal(data.total);
        if (data.availableCars) setAvailableCars(data.availableCars);
        if (data.clients) setClients(data.clients);
      }
    } catch (error) {
      console.error('Failed to fetch rentals:', error);
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

  const showMessage_ = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };
  
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    
    // Less than an hour
    if (diffTime < 1000 * 60 * 60) {
        const minutes = Math.ceil(diffTime / (1000 * 60));
        return `${minutes} Mins`;
    }
    // Less than a day
    if (diffTime < 1000 * 60 * 60 * 24) {
        const hours = Math.floor(diffTime / (1000 * 60 * 60));
        const minutes = Math.ceil((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        if (minutes === 0) return `${hours} Hours`;
        return `${hours}h ${minutes}m`;
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} Days`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRental) {
        await fetch('/api/rentals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRental._id, ...formData }),
        });
      } else {
        await fetch('/api/rentals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      showMessage_('success', t.success);
      setShowModal(false);
      setEditingRental(null);
      
      // Reset to current Business Time
      setFormData({
        car_id: '',
        client_id: '',
        start_date: toBusinessInputString(new Date()),
        return_date: toBusinessInputString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        rental_price: '',
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/rentals?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setFormData({
      car_id: rental.car_id, 
      client_id: rental.client_id,
      start_date: toBusinessInputString(rental.start_date), // Convert UTC to Business Time
      return_date: toBusinessInputString(rental.return_date),
      rental_price: rental.rental_price.toString(),
    });
    setShowModal(true);
  };

  const formatDate = (dateString?: string) => {
    return formatInBusinessTime(dateString);
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

  if (!session) return null;

  return (
    <AppLayout 
      t={t} 
      currentLang={lang} 
      isRtl={isRTL(lang)} 
      onLanguageChange={handleLanguageChange}
      username={session.user?.name || undefined}
    >
      <div className="container-fluid py-4">
        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)} />
          </div>
        )}

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 animate-fade-in-up">
          <div>
              <h2 className="fw-bold mb-1"><i className="bi bi-calendar-check text-primary me-2"></i>{t.rentals}</h2>
              <p className="text-muted mb-0">{t.total_rentals}: {total}</p>
          </div>
        </div>

         {/* Search Bar & Filter */}
         <div className="row g-3 mb-4 animate-fade-in-up delay-1">
             <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{borderRadius: '1rem'}}>
                    <div className="card-body p-2 d-flex align-items-center">
                        <span className="ps-3 text-muted me-2"><i className="bi bi-calendar-month"></i></span>
                        <input 
                            type="month" 
                            className="form-control border-0 shadow-none bg-transparent"
                            value={filterDate}
                            onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
             </div>
             <div className="col-md-8">
                <div className="card border-0 shadow-sm" style={{borderRadius: '1rem', overflow: 'hidden'}}>
                  <div className="card-body p-2">
                    <div className="input-group input-group-lg border-0">
                       <span className="input-group-text bg-transparent border-0 ps-3"><i className="bi bi-search text-muted"></i></span>
                      <input 
                        type="text" 
                        className="form-control border-0 shadow-none bg-transparent" 
                        placeholder={t.search_placeholder || "Search rentals..."} 
                        value={search} 
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                      />
                    </div>
                  </div>
                </div>
             </div>
         </div>

        {/* Rentals List (Mobile Cards & Desktop Table) */}
        <div className="animate-fade-in-up delay-2">
            {loading && rentals.length === 0 ? (
               <div className="p-5 text-center dashboard-card">
                 <div className="spinner-border text-primary" role="status">
                   <span className="visually-hidden">Loading...</span>
                 </div>
               </div>
            ) : rentals.length > 0 ? (
              <>
              {/* Mobile Card View */}
              <div className="d-md-none d-flex flex-column gap-3">
                {rentals.map((rental, index) => (
                  <div key={rental._id} className="dashboard-card p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                       <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                             <i className="bi bi-car-front-fill"></i>
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{rental.car_model}</div>
                            <small className="text-muted font-monospace bg-light border px-1 rounded">{rental.plate_number}</small>
                          </div>
                       </div>
                       {rental.status === 'reserved' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 small">{t.reserved}</span>}
                       {rental.status === 'rented' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-2 py-1 small">{t.rented}</span>}
                       {rental.status === 'returned' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 small">{t.returned}</span>}
                    </div>

                    <div className="mb-2 pb-2 border-bottom border-light">
                      <div className="d-flex align-items-center mb-1">
                         <i className="bi bi-person text-secondary me-2"></i>
                         <span className="fw-medium text-dark">{rental.client_name}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between mb-3 small text-muted">
                        <div>
                           <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-calendar-check me-2 text-primary opacity-50"></i>
                              {formatDate(rental.start_date)}
                           </div>
                           <div className="d-flex align-items-center">
                              <i className="bi bi-calendar-x me-2 text-primary opacity-50"></i>
                              {formatDate(rental.return_date)}
                           </div>
                        </div>
                        <div className="text-end">
                           <div className="fw-bold text-dark mb-1">{rental.rental_price.toFixed(2)} DH</div>
                           <span className="badge bg-light text-secondary border fw-normal">{calculateDuration(rental.start_date, rental.return_date)}</span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                       {rental.status === 'reserved' && (
                          <button onClick={() => handleStatusChange(rental._id, 'rented')} className="btn btn-sm btn-light text-info flex-grow-1" title={t.mark_rented}>
                            <i className="bi bi-key-fill me-1"></i> {t.mark_rented}
                          </button>
                        )}
                        {rental.status === 'rented' && (
                          <button onClick={() => handleStatusChange(rental._id, 'returned')} className="btn btn-sm btn-light text-success flex-grow-1" title={t.mark_returned}>
                            <i className="bi bi-check-circle-fill me-1"></i> {t.mark_returned}
                          </button>
                        )}
                        <button onClick={() => handleEdit(rental)} className="btn btn-sm btn-light text-primary" title={t.edit}>
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button onClick={() => router.push(`/rentals/${rental._id}/contract`)} className="btn btn-sm btn-light text-dark" title={t.contract}>
                          <i className="bi bi-file-text-fill"></i>
                        </button>
                        <button onClick={() => handleDelete(rental._id)} className="btn btn-sm btn-light text-danger" title={t.delete}>
                          <i className="bi bi-trash-fill"></i>
                        </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="d-none d-md-block dashboard-card" style={{overflow: 'hidden'}}>
               <div className="card-body p-0">
               <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 ps-4 text-secondary text-uppercase small bg-transparent">#</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.car_model}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.full_name}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.start_date}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.return_date}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-lg-table-cell">{t.rental_price}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.rental_duration}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.status}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent text-end pe-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentals.map((rental, index) => (
                      <tr key={rental._id} className="border-bottom border-light">
                        <td className="ps-4 fw-medium text-muted">{index + 1 + (page - 1) * limit}</td>
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
                             <div className="fw-medium text-dark">{rental.client_name}</div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                             <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-calendar-check me-2 text-primary opacity-50"></i>
                                {formatDate(rental.start_date)}
                             </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                             <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-calendar-x me-2 text-primary opacity-50"></i>
                                {formatDate(rental.return_date)}
                             </div>
                        </td>
                        <td className="d-none d-lg-table-cell fw-medium text-dark">
                          {rental.rental_price.toFixed(2)}
                        </td>
                        <td className="fw-bold text-center text-primary" style={{ fontSize: '1.2rem' }}>
                          {calculateDuration(rental.start_date, rental.return_date)}
                        </td>
                        <td>
                          {rental.status === 'reserved' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2">{t.reserved}</span>}
                          {rental.status === 'rented' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2">{t.rented}</span>}
                          {rental.status === 'returned' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">{t.returned}</span>}
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group">
                            {rental.status === 'reserved' && (
                              <button onClick={() => handleStatusChange(rental._id, 'rented')} className="btn btn-sm btn-light text-info me-1" title={t.mark_rented} data-bs-toggle="tooltip">
                                <i className="bi bi-key-fill fs-6"></i>
                              </button>
                            )}
                            {rental.status === 'rented' && (
                              <button onClick={() => handleStatusChange(rental._id, 'returned')} className="btn btn-sm btn-light text-success me-1" title={t.mark_returned} data-bs-toggle="tooltip">
                                <i className="bi bi-check-circle-fill fs-6"></i>
                              </button>
                            )}
                            <button onClick={() => handleEdit(rental)} className="btn btn-sm btn-light text-primary me-1" title={t.edit}>
                              <i className="bi bi-pencil-fill fs-6"></i>
                            </button>
                            <button onClick={() => router.push(`/rentals/${rental._id}/contract`)} className="btn btn-sm btn-light text-dark me-1" title={t.contract}>
                              <i className="bi bi-file-text-fill fs-6"></i>
                            </button>
                            <button onClick={() => handleDelete(rental._id)} className="btn btn-sm btn-light text-danger" title={t.delete}>
                              <i className="bi bi-trash-fill fs-6"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
              </div>

              
              {/* Pagination */}
              {total > limit && (
                <div className="d-flex justify-content-center py-4 border-top">
                  <nav>
                     <ul className="pagination pagination-sm mb-0 gap-1">
                      <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link rounded border-0 bg-light text-dark shadow-none" onClick={() => setPage(page - 1)}>&laquo;</button>
                      </li>
                      <li className="page-item disabled">
                        <span className="page-link border-0 bg-transparent fw-medium text-muted">{page} / {Math.ceil(total / limit)}</span>
                      </li>
                      <li className={`page-item ${page * limit >= total ? 'disabled' : ''}`}>
                         <button className="page-link rounded border-0 bg-light text-dark shadow-none" onClick={() => setPage(page + 1)}>&raquo;</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
              </>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-3 opacity-25">
                      <i className="bi bi-calendar-check" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h5 className="text-muted fw-medium">{t.no_data}</h5>
                    <p className="text-muted small">Try adding a new rental to get started.</p>
                </div>
            )}
          </div>


        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingRental ? t.edit : t.add_rental}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                         <div className="col-md-6">
                            <label className="form-label">{t.select_car}</label>
                            {/* Show current car even if not available (if editing) */}
                            <select className="form-select" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })} required>
                                <option value="">-- {t.select_car} --</option>
                                {availableCars.map((car) => (
                                <option key={car._id} value={car._id}>{car.model} ({car.plate_number})</option>
                                ))}
                                {editingRental && !availableCars.find(c => c._id === editingRental.car_id) && (
                                    <option value={editingRental.car_id}>{editingRental.car_model} (Current)</option>
                                )}
                            </select>
                         </div>
                         <div className="col-md-6">
                            <label className="form-label">{t.select_client}</label>
                            <select className="form-select" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} required>
                                <option value="">-- {t.select_client} --</option>
                                {clients.map((client) => (
                                <option key={client._id} value={client._id}>{client.full_name}</option>
                                ))}
                            </select>
                         </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.start_date}</label>
                        <input type="datetime-local" className="form-control" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.return_date}</label>
                        <input type="datetime-local" className="form-control" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.rental_price}</label>
                      <div className="input-group"> 
                        <input type="number" step="0.01" min="0" className="form-control" value={formData.rental_price} onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })} required />
                         <span className="input-group-text bg-light">DH</span>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                    <button type="submit" className="btn btn-primary">{t.save}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Adding Rental */}
        <button 
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-fixed animate-fade-in-up" 
          style={{ width: '60px', height: '60px', bottom: '90px', right: '20px', zIndex: 1050 }}
          onClick={() => {
            setEditingRental(null);
            setFormData({
              car_id: '',
              client_id: '',
              start_date: toBusinessInputString(new Date()),
              return_date: toBusinessInputString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
              rental_price: '',
            });
            setShowModal(true);
          }}
        >
           <i className="bi bi-plus-lg fs-2"></i>
        </button>
      </div>
    </AppLayout>
  );
}
