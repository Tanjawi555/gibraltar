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
  const [formData, setFormData] = useState({ full_name: '' });
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
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

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const url = `https://api.cloudinary.com/v1_1/dzrpuv8ea/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'narennos');

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
      let passport_image = editingClient?.passport_image; // Keep existing image by default
      let license_image = editingClient?.license_image;

      if (passportFile) {
        const url = await uploadToCloudinary(passportFile);
        if (url) passport_image = url;
        else { setUploading(false); return; } // Stop if upload fails
      }
      if (licenseFile) {
        const url = await uploadToCloudinary(licenseFile);
        if (url) license_image = url;
        else { setUploading(false); return; }
      }

      if (editingClient) {
        await fetch('/api/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingClient._id, 
            ...formData,
            passport_image, // Pass the URLs (new or existing)
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
      setFormData({ full_name: '' });
      setPassportFile(null);
      setLicenseFile(null);
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
    setFormData({ full_name: client.full_name });
    setShowModal(true);
    setPassportFile(null);
    setLicenseFile(null);
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
          <button className="btn btn-primary d-flex align-items-center shadow-sm" onClick={() => { setEditingClient(null); setFormData({ full_name: '' }); setShowModal(true); }}>
            <i className="bi bi-plus-lg me-2"></i> {t.add_client}
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
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 py-3 ps-4 text-secondary text-uppercase small bg-transparent">#</th>
                      <th className="border-0 py-3 text-secondary text-uppercase small bg-transparent">{t.full_name}</th>
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
                        <td>
                          {client.passport_image ? (
                            <button onClick={() => setPreviewImage(client.passport_image!)} className="btn btn-sm btn-light text-primary border-0 d-inline-flex align-items-center">
                              <i className="bi bi-file-earmark-person-fill me-2 fs-6"></i>
                              <span className="d-none d-lg-inline">{t.view_document || 'View Passport'}</span>
                            </button>
                          ) : (
                            <span className="badge bg-light text-muted fw-normal border px-3 py-2">{t.no_image}</span>
                          )}
                        </td>
                        <td>
                          {client.license_image ? (
                            <button onClick={() => setPreviewImage(client.license_image!)} className="btn btn-sm btn-light text-primary border-0 d-inline-flex align-items-center">
                              <i className="bi bi-card-heading me-2 fs-6"></i>
                              <span className="d-none d-lg-inline">{t.view_document || 'View License'}</span>
                            </button>
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
                    
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.passport_image}</label>
                          <input type="file" className="form-control" accept="image/*" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
                          {editingClient?.passport_image && !passportFile && (
                            <small className="text-muted d-block mt-1">Current: <a href={editingClient.passport_image} target="_blank" rel="noreferrer">View</a></small>
                          )}
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">{t.license_image}</label>
                          <input type="file" className="form-control" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} />
                           {editingClient?.license_image && !licenseFile && (
                            <small className="text-muted d-block mt-1">Current: <a href={editingClient.license_image} target="_blank" rel="noreferrer">View</a></small>
                          )}
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
      </div>
    </AppLayout>
  );
}
