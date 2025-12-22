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
}

interface Expense {
  _id: string;
  category: string;
  amount: number;
  expense_date: string;
  car_id?: string;
  car_model?: string;
  plate_number?: string;
  description?: string;
}

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'maintenance',
    amount: '',
    expense_date: toBusinessInputString(new Date()).split('T')[0],
    car_id: '',
    description: '',
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  
  // Date Filter
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
    if (session) fetchData();
  }, [session, filterDate]);

  const fetchData = async () => {
    try {
      const [year, month] = filterDate.split('-');
      const res = await fetch(`/api/expenses?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
        setCars(data.cars);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
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
      if (editingExpense) {
        await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingExpense._id, ...formData }),
        });
      } else {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      showMessage_('success', t.success);
      setShowModal(false);
      setEditingExpense(null);
      setFormData({
        category: 'maintenance',
        amount: '',
        expense_date: toBusinessInputString(new Date()).split('T')[0],
        car_id: '',
        description: '',
      });
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchData();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      car_id: expense.car_id || '',
      description: expense.description || '',
    });
    setShowModal(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'maintenance': return t.maintenance;
      case 'insurance': return t.insurance;
      case 'local': return t.cat_local;
      case 'wifi': return t.cat_wifi;
      case 'orange_network': return t.cat_orange;
      case 'oil_change': return t.cat_oil;
      case 'timing_belt': return t.cat_belt;
      case 'tires': return t.cat_tires;
      case 'tax': return t.cat_tax;
      case 'cnss': return t.cat_cnss;
      case 'fuel': return t.fuel; // Keep for backward compatibility mostly
      default: return t.other;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'maintenance': return 'bg-primary';
      case 'insurance': return 'bg-info';
      case 'fuel': return 'bg-warning text-dark';
      case 'local': return 'bg-primary bg-opacity-75';
      case 'wifi': return 'bg-info text-dark';
      case 'orange_network': return 'bg-warning text-dark';
      case 'oil_change': return 'bg-secondary';
      case 'timing_belt': return 'bg-danger';
      case 'tires': return 'bg-dark';
      case 'tax': return 'bg-danger';
      case 'cnss': return 'bg-success';
      default: return 'bg-secondary';
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
            <h2 className="fw-bold mb-1"><i className="bi bi-cash-stack text-primary me-2"></i>{t.expenses}</h2>
            <p className="text-muted mb-0">{t.total_expenses}: {expenses.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)} DH</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={() => {
            setEditingExpense(null);
            setFormData({
              category: 'maintenance',
              amount: '',
              expense_date: toBusinessInputString(new Date()).split('T')[0],
              car_id: '',
              description: '',
            });
            setShowModal(true);
          }}>
            <i className="bi bi-plus-lg me-2"></i> {t.add_expense}
          </button>
        </div>
        
        {/* Month Filter */}
        <div className="mb-4 animate-fade-in-up delay-1" style={{maxWidth: '300px'}}>
            <div className="card border-0 shadow-sm" style={{borderRadius: '1rem'}}>
                <div className="card-body p-2 d-flex align-items-center">
                    <span className="ps-3 text-muted me-2"><i className="bi bi-calendar-month"></i></span>
                    <input 
                        type="month" 
                        className="form-control border-0 shadow-none bg-transparent"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Expenses Table */}
        <div className="dashboard-card animate-fade-in-up delay-1" style={{overflow: 'hidden'}}>
          <div className="card-body p-0">
            {expenses.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 ps-4 text-secondary text-uppercase small bg-transparent">#</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.category}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.amount}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.date}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.link_car}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-md-table-cell">{t.description}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent text-end pe-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr key={expense._id} className="border-bottom border-light">
                        <td className="ps-4 fw-medium text-muted">{index + 1}</td>
                        <td>
                          <span className={`badge ${getCategoryBadgeClass(expense.category)} bg-opacity-10 text-dark rounded-pill px-3 py-2 border`}>
                            <i className="bi bi-tag-fill me-1 opacity-50"></i>
                            {getCategoryLabel(expense.category)}
                          </span>
                        </td>
                        <td className="fw-bold text-danger">-{expense.amount.toFixed(2)}</td>
                        <td>
                           <div className="d-flex align-items-center text-muted">
                                 <i className="bi bi-calendar-event me-2 text-primary opacity-50"></i>
                                {formatInBusinessTime(expense.expense_date, 'dd MMM yyyy')}
                             </div>
                        </td>
                        <td>
                          {expense.car_model ? (
                             <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-1 me-2 d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}>
                                  <i className="bi bi-car-front-fill small"></i>
                                </div>
                                <div>
                                  <div className="fw-medium text-dark">{expense.car_model}</div>
                                  <div className="small text-muted font-monospace">{expense.plate_number}</div>
                                </div>
                            </div>
                          ) : (
                            <span className="badge bg-light text-muted fw-normal border px-3 py-2">{t.no_car}</span>
                          )}
                        </td>
                        <td className="d-none d-md-table-cell text-muted"><small>{expense.description || '-'}</small></td>
                        <td className="text-end pe-4">
                          <div className="btn-group">
                            <button onClick={() => handleEdit(expense)} className="btn btn-sm btn-light text-primary me-1" title={t.edit}>
                              <i className="bi bi-pencil-fill fs-6"></i>
                            </button>
                            <button onClick={() => handleDelete(expense._id)} className="btn btn-sm btn-light text-danger" title={t.delete}>
                              <i className="bi bi-trash-fill fs-6"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="text-center py-5">
                    <div className="mb-3 opacity-25">
                      <i className="bi bi-cash-stack" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h5 className="text-muted fw-medium">{t.no_data}</h5>
                    <p className="text-muted small">Try adding a new expense to get started.</p>
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
                    <h5 className="modal-title">{editingExpense ? t.edit : t.add_expense}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="row">
                        <div className="col-md-6 mb-3">
                           <label className="form-label">{t.category}</label>
                           <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                                <option value="maintenance">{t.maintenance}</option>
                                <option value="insurance">{t.insurance}</option>
                                <option value="local">{t.cat_local}</option>
                                <option value="wifi">{t.cat_wifi}</option>
                                <option value="orange_network">{t.cat_orange}</option>
                                <option value="oil_change">{t.cat_oil}</option>
                                <option value="timing_belt">{t.cat_belt}</option>
                                <option value="tires">{t.cat_tires}</option>
                                <option value="tax">{t.cat_tax}</option>
                                <option value="cnss">{t.cat_cnss}</option>
                                <option value="other">{t.other}</option>
                           </select>
                        </div>
                        <div className="col-md-6 mb-3">
                           <label className="form-label">{t.amount}</label>
                           <div className="input-group">
                              <input type="number" step="0.01" min="0" className="form-control" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                              <span className="input-group-text bg-light">DH</span>
                           </div>
                        </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.date}</label>
                        <input type="date" className="form-control" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">{t.link_car}</label>
                        <select className="form-select" value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}>
                            <option value="">-- {t.no_car} --</option>
                            {cars.map((car) => (
                            <option key={car._id} value={car._id}>{car.model} ({car.plate_number})</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">{t.description}</label>
                      <textarea className="form-control" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
    </AppLayout>
  );
}
