'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { toBusinessInputString, formatInBusinessTime } from '@/lib/timezone';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Car {
  _id: string;
  model: string;
  plate_number: string;
  status: 'available' | 'rented' | 'reserved';
  current_rental?: {
    _id: string;
    client_id: string;
    start_date: string;
    return_date: string;
    rental_price: number;
  };
}

interface Client {
  _id: string;
  full_name: string;
}

export default function CarsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({ model: '', plate_number: '' });
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Reservation Modal State
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [modalMode, setModalMode] = useState<'reserve' | 'rent' | 'edit'>('reserve');
  const [clients, setClients] = useState<Client[]>([]);
  const [reservationData, setReservationData] = useState({
    _id: '',
    car_id: '',
    client_id: '',
    start_date: '',
    return_date: '',
    rental_price: ''
  });
  
  // ... (pagination states same) ...
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

  // ... (useEffect hooks same) ...
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
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        fetchCars();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, page, search]);

  const fetchCars = async () => {
    // setLoading(true); // Don't set loading to true on every keystroke/page change to avoid flickering, or handle gracefully
    try {
      const res = await fetch(`/api/cars?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
      try {
          const res = await fetch('/api/clients?limit=100'); // Fetch enough consumers
          if(res.ok) {
              const data = await res.json();
              if(data.clients) setClients(data.clients);
              else if(Array.isArray(data)) setClients(data);
          }
      } catch(e) {
          console.error("Failed to fetch clients", e);
      }
  };

  useEffect(() => {
    if (showReservationModal && clients.length === 0) {
        fetchClients();
    }
  }, [showReservationModal]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCar) {
        await fetch('/api/cars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCar._id, ...formData }),
        });
      } else {
        await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      showMessage_('success', t.success);
      setShowModal(false);
      setEditingCar(null);
      setFormData({ model: '', plate_number: '' });
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/cars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/cars?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchCars();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const openReservationModal = (car: Car, mode: 'reserve' | 'rent' | 'edit' = 'reserve') => {
    setModalMode(mode);
    
    if (mode === 'edit' && car.current_rental) {
        setReservationData({
            _id: car.current_rental._id || '',
            car_id: car._id,
            client_id: car.current_rental.client_id || '',
            start_date: toBusinessInputString(car.current_rental.start_date),
            return_date: toBusinessInputString(car.current_rental.return_date),
            rental_price: (car.current_rental as any).rental_price ? (car.current_rental as any).rental_price.toString() : ''
        });
    } else {
        setReservationData({
            _id: '',
            car_id: car._id,
            client_id: '',
            start_date: toBusinessInputString(new Date()),
            return_date: toBusinessInputString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
            rental_price: ''
        });
    }
    setShowReservationModal(true);
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        let url = '/api/rentals';
        let method = 'POST';
        let body: any = {
            ...reservationData,
            status: modalMode === 'rent' ? 'rented' : 'reserved'
        };

        if (modalMode === 'edit' && reservationData._id) {
            method = 'PUT';
            body = {
                id: reservationData._id,
                car_id: reservationData.car_id,
                client_id: reservationData.client_id,
                start_date: reservationData.start_date,
                return_date: reservationData.return_date,
                rental_price: parseFloat(reservationData.rental_price)
            };
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if(res.ok) {
            showMessage_('success', t.success || 'Saved successfully');
            setShowReservationModal(false);
            fetchCars();
        } else {
            showMessage_('danger', data.error || t.error || 'Failed to save');
        }
    } catch (error) {
        showMessage_('danger', t.error || 'Failed to save');
    }
  };

  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setFormData({ model: car.model, plate_number: car.plate_number });
    setShowModal(true);
  };

  const formatDate = (dateString?: string) => {
    return formatInBusinessTime(dateString);
  };

  const formatTotalDuration = (ms: number) => {
      if (!ms) return '';
      const diffTime = Math.abs(ms);
      
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
              <h2 className="fw-bold mb-1"><i className="bi bi-car-front text-primary me-2"></i>{t.cars}</h2>
              <p className="text-muted mb-0">{t.total_cars}: {total}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card border-0 shadow-sm mb-4 animate-fade-in-up delay-1" style={{borderRadius: '1rem', overflow: 'hidden'}}>
          <div className="card-body p-2">
            <div className="input-group input-group-lg border-0">
               <span className="input-group-text bg-transparent border-0 ps-3"><i className="bi bi-search text-muted"></i></span>
              <input 
                type="text" 
                className="form-control border-0 shadow-none bg-transparent" 
                placeholder={t.car_model || "Search cars..."} 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
          </div>
        </div>

        {/* Cars Table */}
        <div className="dashboard-card animate-fade-in-up delay-2" style={{overflow: 'hidden'}}>
          <div className="card-body p-0">
            {loading && cars.length === 0 ? (
               <div className="p-5 text-center">
                 <div className="spinner-border text-primary" role="status">
                   <span className="visually-hidden">Loading...</span>
                 </div>
               </div>
            ) : cars.length > 0 ? (
              <>
              {/* Mobile Card View */}
              <div className="d-md-none d-flex flex-column gap-3">
                 {cars.map(car => (
                    <div key={car._id} className="dashboard-card p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                           <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-car-front-fill"></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark">{car.model}</div>
                                <span className="font-monospace bg-light px-2 py-0 rounded text-secondary border small">{car.plate_number}</span>
                              </div>
                           </div>
                           <div>
                              {car.status === 'available' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 small">{t.available}</span>}
                              {car.status === 'rented' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-2 py-1 small">{t.rented}</span>}
                              {car.status === 'reserved' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-2 py-1 small">{t.reserved}</span>}
                           </div>
                        </div>

                        {(car.current_rental || (car as any).total_rented_ms > 0) && (
                            <div className="mb-3 small text-muted border-top pt-2 mt-2">
                               {car.current_rental && (
                                   <div className="d-flex align-items-center mb-1">
                                      <i className="bi bi-calendar3 me-2 text-primary opacity-50"></i>
                                      <span>{formatDate(car.current_rental.start_date)} - {formatDate(car.current_rental.return_date)}</span>
                                   </div>
                               )}
                               {(car as any).total_rented_ms > 0 && (
                                  <div className="d-flex align-items-center">
                                     <i className="bi bi-clock-history me-2 text-primary opacity-50"></i>
                                     <span>Total Rented: {formatTotalDuration((car as any).total_rented_ms)}</span>
                                  </div>
                               )}
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            {car.status === 'available' ? (
                                <>
                                    <button onClick={() => openReservationModal(car, 'reserve')} className="btn btn-sm btn-light text-warning flex-grow-1" title={t.reserved}>
                                        <i className="bi bi-clock-fill me-1"></i> {t.reserved}
                                    </button>
                                    <button onClick={() => openReservationModal(car, 'rent')} className="btn btn-sm btn-light text-info flex-grow-1" title={t.rented}>
                                        <i className="bi bi-key-fill me-1"></i> {t.rented}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => openReservationModal(car, 'edit')} className="btn btn-sm btn-light text-primary flex-grow-1" title={t.edit_rental || 'Edit/Extend'}>
                                    <i className="bi bi-pencil-square me-1"></i> {t.edit_rental || 'Edit/Extend'}
                                </button>
                            )}
                            {car.status !== 'available' && car.status === 'rented' && (
                                <button onClick={() => handleStatusChange(car._id, 'available')} className="btn btn-sm btn-light text-success flex-grow-1" title={t.available}>
                                    <i className="bi bi-check-lg"></i>
                                </button>
                            )}
                            <button onClick={() => openEditModal(car)} className="btn btn-sm btn-light text-primary" title={t.edit}>
                                <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button onClick={() => handleDelete(car._id)} className="btn btn-sm btn-light text-danger" title={t.delete}>
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
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.plate_number}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.status}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent text-end pe-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car, index) => (
                      <tr key={car._id} className="border-bottom border-light">
                        <td className="ps-4 fw-medium text-muted">{index + 1 + (page - 1) * limit}</td>
                        <td>
                          <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-3 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-car-front-fill"></i>
                              </div>
                              <div className="d-flex flex-wrap align-items-center">
                                <span className="fw-bold text-dark me-2">{car.model}</span>
                              </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <div className="d-flex flex-column align-items-start">
                            <span className="font-monospace bg-light px-2 py-1 rounded text-secondary border">
                                {car.plate_number}
                            </span>
                            {(car as any).total_rented_ms > 0 && (
                              <small className="text-muted mt-1 align-items-center d-flex" title={t.total_rentals || 'Total Rented Duration'}>
                                  <i className="bi bi-clock-history me-1 text-primary"></i> 
                                  {formatTotalDuration((car as any).total_rented_ms)}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          {car.status === 'available' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">{t.available}</span>}
                          {car.status === 'rented' && (
                            <div className="d-flex flex-column align-items-start">
                              <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2 mb-1">{t.rented}</span>
                              {car.current_rental && (
                                <small className="text-muted d-flex align-items-center" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {formatDate(car.current_rental.start_date)} 
                                  <span className="mx-1">–</span> 
                                  {formatDate(car.current_rental.return_date)}
                                </small>
                              )}
                            </div>
                          )}
                          {car.status === 'reserved' && (
                             <div className="d-flex flex-column align-items-start">
                              <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2 mb-1">{t.reserved}</span>
                              {car.current_rental && (
                                <small className="text-muted d-flex align-items-center" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                  <i className="bi bi-calendar3 me-1"></i>
                                  {formatDate(car.current_rental.start_date)} 
                                  <span className="mx-1">–</span> 
                                  {formatDate(car.current_rental.return_date)}
                                </small>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-2"> 
                            {/* Action Buttons styled like Image 2 */}
                            {car.status === 'available' ? (
                                <>
                                     <button onClick={() => openReservationModal(car, 'reserve')} className="btn btn-sm btn-light text-warning rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.reserved}>
                                         <i className="bi bi-clock-fill fs-6"></i>
                                     </button>
    
                                     <button onClick={() => openReservationModal(car, 'rent')} className="btn btn-sm btn-light text-info rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.rented}>
                                         <i className="bi bi-key-fill fs-6"></i>
                                     </button>
                                </>
                            ) : (
                                <button onClick={() => openReservationModal(car, 'edit')} className="btn btn-sm btn-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.edit_rental || 'Edit/Extend'}>
                                     <i className="bi bi-pencil-square fs-6"></i>
                                </button>
                            )}
                            {car.status !== 'available' && car.status === 'rented' && (
                                <button onClick={() => handleStatusChange(car._id, 'available')} className="btn btn-sm btn-light text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.available}>
                                    <i className="bi bi-check-lg fs-6"></i>
                                </button>
                            )}

                            <button onClick={() => openEditModal(car)} className="btn btn-sm btn-light text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.edit}>
                              <i className="bi bi-pencil-fill fs-6"></i>
                            </button>
                            <button onClick={() => handleDelete(car._id)} className="btn btn-sm btn-light text-danger rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}} title={t.delete}>
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
                      <i className="bi bi-car-front" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h5 className="text-muted fw-medium">{t.no_data}</h5>
                    <p className="text-muted small">Try adding a new car to get started.</p>
                </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingCar ? `${t.edit} - ${editingCar.model}` : t.add_car}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t.car_model}</label>
                      <input type="text" className="form-control" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.plate_number}</label>
                      <input type="text" className="form-control" value={formData.plate_number} onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })} required />
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

        {showReservationModal && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleReservationSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{modalMode === 'edit' ? (t.edit_rental || 'Edit Rental') : modalMode === 'rent' ? (t.rented || 'Rent Car') : (t.reserved || 'Reserve Car')}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowReservationModal(false)} />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">{t.select_client || 'Client'}</label>
                                    <select className="form-select" value={reservationData.client_id} onChange={(e) => setReservationData({ ...reservationData, client_id: e.target.value })} required>
                                        <option value="">-- Select Client --</option>
                                        {clients.map(client => (
                                            <option key={client._id} value={client._id}>{client.full_name}</option>
                                        ))}
                                    </select>
                                    {clients.length === 0 && <small className="text-muted">No clients found. Add a client first.</small>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t.start_date || 'Start Date'}</label>
                                    <input type="datetime-local" className="form-control" value={reservationData.start_date} onChange={(e) => setReservationData({ ...reservationData, start_date: e.target.value })} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t.return_date || 'Return Date'}</label>
                                    <input type="datetime-local" className="form-control" value={reservationData.return_date} onChange={(e) => setReservationData({ ...reservationData, return_date: e.target.value })} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t.rental_price || 'Price'}</label>
                                    <div className="input-group">
                                        <input type="number" className="form-control" value={reservationData.rental_price} onChange={(e) => setReservationData({ ...reservationData, rental_price: e.target.value })} required />
                                        <span className="input-group-text">DH</span>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowReservationModal(false)}>{t.cancel}</button>
                                <button type="submit" className="btn btn-primary">{t.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {/* Floating Action Button for Adding Car */}
        <button 
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-fixed animate-fade-in-up" 
          style={{ width: '60px', height: '60px', bottom: '90px', right: '20px', zIndex: 1050 }}
          onClick={() => { setEditingCar(null); setFormData({ model: '', plate_number: '' }); setShowModal(true); }}
        >
           <i className="bi bi-plus-lg fs-2"></i>
        </button>
      </div>
    </AppLayout>
  );
}
