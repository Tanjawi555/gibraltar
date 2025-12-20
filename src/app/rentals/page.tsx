'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

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
  const [formData, setFormData] = useState({
    car_id: '',
    client_id: '',
    start_date: new Date().toISOString().split('T')[0],
    return_date: new Date().toISOString().split('T')[0],
    rental_price: '',
  });
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Pagination and Search inputs
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 20;

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
  }, [session, page, search]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/rentals?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
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
      setFormData({
        car_id: '',
        client_id: '',
        start_date: new Date().toISOString().split('T')[0],
        return_date: new Date().toISOString().split('T')[0],
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
      start_date: rental.start_date,
      return_date: rental.return_date,
      rental_price: rental.rental_price.toString(),
    });
    setShowModal(true);
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
    <>
      <Navbar t={t} currentLang={lang} isRtl={isRTL(lang)} onLanguageChange={handleLanguageChange} />
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
          </div>
          <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={() => {
            setEditingRental(null);
            setFormData({
              car_id: '',
              client_id: '',
              start_date: new Date().toISOString().split('T')[0],
              return_date: new Date().toISOString().split('T')[0],
              rental_price: '',
            });
            setShowModal(true);
          }}>
            <i className="bi bi-plus-lg me-2"></i> {t.add_rental}
          </button>
        </div>

         {/* Search Bar */}
         <div className="card border-0 shadow-sm mb-4 animate-fade-in-up delay-1" style={{borderRadius: '1rem', overflow: 'hidden'}}>
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

        {/* Rentals Table */}
        <div className="dashboard-card animate-fade-in-up delay-2" style={{overflow: 'hidden'}}>
          <div className="card-body p-0">
            {loading && rentals.length === 0 ? (
               <div className="p-5 text-center">
                 <div className="spinner-border text-primary" role="status">
                   <span className="visually-hidden">Loading...</span>
                 </div>
               </div>
            ) : rentals.length > 0 ? (
              <>
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
                             <div>
                                <div className="fw-medium text-dark">{rental.client_name}</div>
                                <div className="d-md-none small text-muted">
                                  {rental.start_date} - {rental.return_date}
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                             <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-calendar-check me-2 text-primary opacity-50"></i>
                                {rental.start_date}
                             </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                             <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-calendar-x me-2 text-primary opacity-50"></i>
                                {rental.return_date}
                             </div>
                        </td>
                        <td className="d-none d-lg-table-cell fw-medium text-dark">
                          {rental.rental_price.toFixed(2)}
                        </td>
                        <td>
                          {rental.status === 'reserved' && <span className="badge bg-warning bg-opacity-10 text-warning rounded-pill px-3 py-2">{t.reserved}</span>}
                          {rental.status === 'rented' && <span className="badge bg-info bg-opacity-10 text-info rounded-pill px-3 py-2">{t.rented}</span>}
                          {rental.status === 'returned' && <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">{t.returned}</span>}
                          <div className="d-lg-none fw-bold mt-1 text-primary">{rental.rental_price.toFixed(2)}</div>
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
                        <input type="date" className="form-control" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.return_date}</label>
                        <input type="date" className="form-control" value={formData.return_date} onChange={(e) => setFormData({ ...formData, return_date: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t.rental_price}</label>
                      <div className="input-group"> 
                        <input type="number" step="0.01" min="0" className="form-control" value={formData.rental_price} onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })} required />
                         <span className="input-group-text bg-light">DZD</span>
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
      </div>
    </>
  );
}
