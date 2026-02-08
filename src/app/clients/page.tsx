'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

interface Client {
  _id: string;
  full_name: string;
  passport_image?: string;
  license_image?: string;
  address?: string;
  passport_id?: string;
  driving_license?: string;
  id_number?: string;
  date_of_birth?: string;
  license_expiry_date?: string;
  passport_expiry_date?: string;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ 
    full_name: '', 
    address: '', 
    passport_id: '', 
    driving_license: '', 
    id_number: '',
    date_of_birth: '',
    license_expiry_date: '',
    passport_expiry_date: '' 
  });
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null);
  const [passportBackFile, setPassportBackFile] = useState<File | null>(null);
  const [licenseFrontFile, setLicenseFrontFile] = useState<File | null>(null);
  const [licenseBackFile, setLicenseBackFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    if (status === 'authenticated') {
      const timer = setTimeout(() => {
        fetchClients();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, page, search]);

  const fetchClients = async () => {
    try {
      const res = await fetch(`/api/clients?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
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

  const uploadToCloudinary = async (file: File, publicId?: string): Promise<string | null> => {
    const url = `https://api.cloudinary.com/v1_1/dduryumsi/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gibraltar');
    if (publicId) {
        formData.append('public_id', publicId);
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      showMessage_('danger', `Upload failed: ${(error as Error).message}`);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
    const getPublicId = (type: string, suffix: string) => {
        const cleanName = formData.full_name.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'client';
        const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        return `${cleanName}_${type}_${suffix}_${dateStr}`;
    };

      // Handle Passport Images
      let currentPassportImages = editingClient?.passport_image ? editingClient.passport_image.split(',') : [];
      let passportFrontUrl = currentPassportImages[0] || '';
      let passportBackUrl = currentPassportImages[1] || '';

      if (passportFrontFile) {
        const url = await uploadToCloudinary(passportFrontFile, getPublicId('Passport', 'Front'));
        if (url) passportFrontUrl = url;
        else { setUploading(false); return; }
      }
      if (passportBackFile) {
        const url = await uploadToCloudinary(passportBackFile, getPublicId('Passport', 'Back'));
        if (url) passportBackUrl = url;
        else { setUploading(false); return; }
      }
      const passportArray = [passportFrontUrl, passportBackUrl];
      const passport_image = passportArray.every(u => !u) ? '' : passportArray.join(',');

      // Handle License Images
      let currentLicenseImages = editingClient?.license_image ? editingClient.license_image.split(',') : [];
      let licenseFrontUrl = currentLicenseImages[0] || '';
      let licenseBackUrl = currentLicenseImages[1] || '';

      if (licenseFrontFile) {
        const url = await uploadToCloudinary(licenseFrontFile, getPublicId('License', 'Front'));
        if (url) licenseFrontUrl = url;
        else { setUploading(false); return; }
      }
      if (licenseBackFile) {
        const url = await uploadToCloudinary(licenseBackFile, getPublicId('License', 'Back'));
        if (url) licenseBackUrl = url;
        else { setUploading(false); return; }
      }
      const licenseArray = [licenseFrontUrl, licenseBackUrl];
      const license_image = licenseArray.every(u => !u) ? '' : licenseArray.join(',');

      if (editingClient) {
        await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingClient._id, 
            ...formData,
            passport_image, 
            license_image
          }),
        });
      } else {
        await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, passport_image, license_image }),
        });
      }
      showMessage_('success', t.success);
      setShowModal(false);
      setEditingClient(null);
      setEditingClient(null);
      setFormData({ full_name: '', address: '', passport_id: '', driving_license: '', id_number: '', date_of_birth: '', license_expiry_date: '', passport_expiry_date: '' });
      setPassportFrontFile(null);
      setPassportFrontFile(null);
      setPassportBackFile(null);
      setLicenseFrontFile(null);
      setLicenseBackFile(null);
      fetchClients();
    } catch (error) {
      showMessage_('danger', t.error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      showMessage_('success', t.success);
      fetchClients();
    } catch (error) {
      showMessage_('danger', t.error);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ 
      full_name: client.full_name,
      address: client.address || '',
      passport_id: client.passport_id || '',
      driving_license: client.driving_license || '',
      id_number: client.id_number || '',
      date_of_birth: client.date_of_birth || '',
      license_expiry_date: client.license_expiry_date || '',
      passport_expiry_date: client.passport_expiry_date || ''
    });
    setShowModal(true);
    setPassportFrontFile(null);
    setPassportBackFile(null);
    setLicenseFrontFile(null);
    setLicenseBackFile(null);
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
              <h2 className="fw-bold mb-1"><i className="bi bi-people text-primary me-2"></i>{t.clients}</h2>
              <p className="text-muted mb-0">{t.total_clients || 'Total Clients'}: {total}</p>
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
                placeholder={t.full_name || "Search clients..."} 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="dashboard-card animate-fade-in-up delay-2" style={{overflow: 'hidden'}}>
          <div className="card-body p-0">
            {loading && clients.length === 0 ? (
               <div className="p-5 text-center">
                 <div className="spinner-border text-primary" role="status">
                   <span className="visually-hidden">Loading...</span>
                 </div>
               </div>
            ) : clients.length > 0 ? (
              <>
              {/* Mobile Card View */}
              <div className="d-md-none d-flex flex-column gap-3">
                {clients.map((client) => (
                  <div key={client._id} className="dashboard-card p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                       <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{client.full_name}</div>
                            {client.address && <small className="text-muted d-block"><i className="bi bi-geo-alt-fill me-1"></i>{client.address}</small>}
                          </div>
                       </div>
                    </div>

                    <div className="mb-3 small text-muted">
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                             <span>{t.date_of_birth || "Date of Birth"}:</span>
                             <span className="fw-medium text-dark">{client.date_of_birth || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                            <span>{t.id_number}:</span>
                            <span className="fw-medium text-dark">{client.id_number || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                            <span>{t.passport_number}:</span>
                            <span className="fw-medium text-dark">{client.passport_id || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                             <span>{t.license_number}:</span>
                             <span className="fw-medium text-dark">{client.driving_license || '-'}</span>
                        </div>
                    </div>
                    
                    <div className="d-flex gap-2 mb-3">
                        <div className="flex-grow-1 p-2 bg-light rounded text-center">
                            <div className="small text-muted mb-1">{t.passport_image}</div>
                             {client.passport_image ? (
                                <div className="d-flex justify-content-center gap-1">
                                  {client.passport_image.split(',').map((url, i) => (
                                    url ? (
                                      <button key={`${client._id}-p-${i}`} onClick={() => setPreviewImage(url)} className="btn btn-sm btn-white border shadow-sm text-primary p-1" title={i === 0 ? "Front" : "Back"}>
                                        <i className="bi bi-file-earmark-person-fill"></i>
                                      </button>
                                    ) : null
                                  ))}
                                </div>
                              ) : <span className="text-muted small">-</span>}
                        </div>
                         <div className="flex-grow-1 p-2 bg-light rounded text-center">
                            <div className="small text-muted mb-1">{t.license_image}</div>
                              {client.license_image ? (
                                 <div className="d-flex justify-content-center gap-1">
                                  {client.license_image.split(',').map((url, i) => (
                                    url ? (
                                      <button key={`${client._id}-l-${i}`} onClick={() => setPreviewImage(url)} className="btn btn-sm btn-white border shadow-sm text-primary p-1" title={i === 0 ? "Front" : "Back"}>
                                        <i className="bi bi-card-heading"></i>
                                      </button>
                                    ) : null
                                  ))}
                                 </div>
                              ) : <span className="text-muted small">-</span>}
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button onClick={() => openEditModal(client)} className="btn btn-sm btn-light text-primary flex-grow-1" title={t.edit}>
                          <i className="bi bi-pencil-fill me-1"></i> {t.edit}
                        </button>
                        <button onClick={() => handleDelete(client._id)} className="btn btn-sm btn-light text-danger flex-grow-1" title={t.delete}>
                          <i className="bi bi-trash-fill me-1"></i> {t.delete}
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
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.full_name}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-lg-table-cell">{t.address}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-xl-table-cell">{t.id_number}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-lg-table-cell">{t.date_of_birth || 'Birth Date'}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-xl-table-cell">{t.passport_number}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent d-none d-xl-table-cell">{t.license_number}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.passport_image}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.license_image}</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent text-end pe-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr key={client._id} className="border-bottom border-light">
                        <td className="ps-4 fw-medium text-muted">{index + 1 + (page - 1) * limit}</td>
                        <td>
                          <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-info bg-opacity-10 text-info p-2 me-3 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-person-fill"></i>
                              </div>
                              <div className="fw-bold text-dark">{client.full_name}</div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell text-muted small">{client.address || '-'}</td>
                        <td className="d-none d-xl-table-cell text-muted small font-monospace">{client.id_number || '-'}</td>
                        <td className="d-none d-lg-table-cell text-muted small">{client.date_of_birth || '-'}</td>
                        <td className="d-none d-xl-table-cell text-muted small font-monospace">{client.passport_id || '-'}</td>
                        <td className="d-none d-xl-table-cell text-muted small font-monospace">{client.driving_license || '-'}</td>
                        <td>
                          {client.passport_image ? (
                            <div className="d-flex gap-1">
                              {client.passport_image.split(',').map((url, i) => (
                                url ? (
                                  <button key={`${client._id}-p-${i}`} onClick={() => setPreviewImage(url)} className="btn btn-sm btn-light text-primary border-0 d-inline-flex align-items-center" title={i === 0 ? "Front" : "Back"}>
                                    <i className="bi bi-file-earmark-person-fill me-1 fs-6"></i>
                                </button>
                                ) : null
                              ))}
                            </div>
                          ) : (
                            <span className="badge bg-light text-muted fw-normal border px-3 py-2">{t.no_image}</span>
                          )}
                        </td>
                        <td>
                          {client.license_image ? (
                             <div className="d-flex gap-1">
                              {client.license_image.split(',').map((url, i) => (
                                url ? (
                                  <button key={`${client._id}-l-${i}`} onClick={() => setPreviewImage(url)} className="btn btn-sm btn-light text-primary border-0 d-inline-flex align-items-center" title={i === 0 ? "Front" : "Back"}>
                                    <i className="bi bi-card-heading me-1 fs-6"></i>
                                </button>
                                ) : null
                              ))}
                             </div>
                          ) : (
                             <span className="badge bg-light text-muted fw-normal border px-3 py-2">{t.no_image}</span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group">
                            <button onClick={() => openEditModal(client)} className="btn btn-sm btn-light text-primary me-1" title={t.edit}>
                              <i className="bi bi-pencil-fill fs-6"></i>
                            </button>
                            <button onClick={() => handleDelete(client._id)} className="btn btn-sm btn-light text-danger" title={t.delete}>
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
                      <i className="bi bi-people" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <h5 className="text-muted fw-medium">{t.no_data}</h5>
                    <p className="text-muted small">Try adding a new client to get started.</p>
                </div>
            )}
          </div>
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }} onClick={() => setPreviewImage(null)}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content bg-transparent border-0 shadow-none">
                <div className="modal-body p-0 text-center position-relative">
                   <button 
                      type="button" 
                      className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                      onClick={() => setPreviewImage(null)}
                      style={{zIndex: 10, background: 'rgba(0,0,0,0.5) url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\' fill=\'%23fff\'%3e%3cpath d=\'M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z\'/%3e%3c/svg%3e") center/1em auto no-repeat', padding: '1rem', borderRadius: '50%'}}
                   />
                   <img src={previewImage} alt="Document Preview" className="img-fluid rounded shadow-lg" style={{maxHeight: '90vh'}} onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{editingClient ? `${t.edit} - ${editingClient.full_name}` : t.add_client}</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                  </div>
                  <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">{t.full_name}</label>
                        <input type="text" className="form-control" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">{t.address || "Address"}</label>
                        <input type="text" className="form-control" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Complete Address" />
                      </div>

                      <div className="mb-3">
                         <label className="form-label">{t.date_of_birth || "Date of Birth"}</label>
                         <input type="date" className="form-control" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                      </div>

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">{t.id_number || "ID Number"}</label>
                          <input type="text" className="form-control" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} placeholder="National / Personal ID" />
                        </div>
                        <div className="col-md-4 mb-3">
                           <label className="form-label">{t.passport_number || "Passport Number"}</label>
                           <input type="text" className="form-control" value={formData.passport_id} onChange={(e) => setFormData({ ...formData, passport_id: e.target.value })} placeholder="Passport ID" />
                        </div>
                        <div className="col-md-4 mb-3">
                           <label className="form-label">{t.license_number || "Driver's License (DL N)"}</label>
                           <input type="text" className="form-control" value={formData.driving_license} onChange={(e) => setFormData({ ...formData, driving_license: e.target.value })} placeholder="License Number" />
                        </div>
                        <div className="col-md-4 mb-3">
                           <label className="form-label">{t.license_expiry || "License Expiry Date"}</label>
                           <input type="date" className="form-control" value={formData.license_expiry_date} onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })} />
                        </div>
                        <div className="col-md-4 mb-3">
                           <label className="form-label">{t.passport_expiry || "Passport Expiry Date"}</label>
                           <input type="date" className="form-control" value={formData.passport_expiry_date} onChange={(e) => setFormData({ ...formData, passport_expiry_date: e.target.value })} />
                        </div>
                      </div>
                    
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.passport_image}</label>
                          <div className="mb-2">
                             <small className="text-muted d-block mb-1">{t.front || "Front Side"}</small>
                             <input type="file" className="form-control" accept="image/*" onChange={(e) => setPassportFrontFile(e.target.files?.[0] || null)} />
                             {editingClient?.passport_image && editingClient.passport_image.split(',')[0] && !passportFrontFile && (
                                <small className="text-muted d-block mt-1">Current: <a href={editingClient.passport_image.split(',')[0]} target="_blank" rel="noreferrer">View</a></small>
                             )}
                          </div>
                          <div>
                             <small className="text-muted d-block mb-1">{t.back || "Back Side"}</small>
                             <input type="file" className="form-control" accept="image/*" onChange={(e) => setPassportBackFile(e.target.files?.[0] || null)} />
                             {editingClient?.passport_image && editingClient.passport_image.split(',')[1] && !passportBackFile && (
                                <small className="text-muted d-block mt-1">Current: <a href={editingClient.passport_image.split(',')[1]} target="_blank" rel="noreferrer">View</a></small>
                             )}
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.license_image}</label>
                          <div className="mb-2">
                             <small className="text-muted d-block mb-1">{t.front || "Front Side"}</small>
                             <input type="file" className="form-control" accept="image/*" onChange={(e) => setLicenseFrontFile(e.target.files?.[0] || null)} />
                             {editingClient?.license_image && editingClient.license_image.split(',')[0] && !licenseFrontFile && (
                                <small className="text-muted d-block mt-1">Current: <a href={editingClient.license_image.split(',')[0]} target="_blank" rel="noreferrer">View</a></small>
                             )}
                          </div>
                          <div>
                             <small className="text-muted d-block mb-1">{t.back || "Back Side"}</small>
                             <input type="file" className="form-control" accept="image/*" onChange={(e) => setLicenseBackFile(e.target.files?.[0] || null)} />
                             {editingClient?.license_image && editingClient.license_image.split(',')[1] && !licenseBackFile && (
                                <small className="text-muted d-block mt-1">Current: <a href={editingClient.license_image.split(',')[1]} target="_blank" rel="noreferrer">View</a></small>
                             )}
                          </div>
                        </div>
                      </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t.cancel}</button>
                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                      {uploading ? (
                         <>
                           <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                           Uploading...
                         </>
                      ) : t.save}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button for Adding Client */}
        <button 
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-fixed animate-fade-in-up" 
          style={{ width: '60px', height: '60px', bottom: '90px', right: '20px', zIndex: 1050 }}
           onClick={() => { setEditingClient(null); setFormData({ full_name: '', address: '', passport_id: '', driving_license: '', id_number: '', date_of_birth: '', license_expiry_date: '', passport_expiry_date: '' }); setShowModal(true); setPassportFrontFile(null); setPassportBackFile(null); setLicenseFrontFile(null); setLicenseBackFile(null); }}
        >
           <i className="bi bi-plus-lg fs-2"></i>
        </button>
      </div>
    </AppLayout>
  );
}
