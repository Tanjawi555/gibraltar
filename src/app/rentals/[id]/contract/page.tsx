'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';

export default function ContractPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lang, setLang] = useState<Language>('ar');
  const [t, setT] = useState<Translations>(getTranslations('ar'));
  const [loading, setLoading] = useState(true);
  const [rental, setRental] = useState<any>(null);

  // Editable fields state matching the specific contract
  const [contractData, setContractData] = useState({
    // Car Details
    car_brand: '', 
    plate_number: '',
    delivery_place: 'Tanger',
    return_place: 'Tanger',

    // Dates (Split for the grid)
    start_date: new Date(),
    return_date: new Date(),
    days: '',

    // Client (Locataire)
    client_name: '',
    birth_date: '',
    address_morocco: '',
    address_abroad: '',
    license_number: '',
    license_expiry: '',
    cin: '',
    passport: '',
    passport_expiry: '',
    phone: '',

    // Payment
    deposit: '',
    total: '',
    advance: '',
    remaining: '',
    payment_method: 'cash', // cash, check, card

    // Additional Driver
    second_driver_name: '',
    second_driver_license: '',
    second_driver_expiry: '',
    second_driver_passport: '',
    second_driver_cin: '',
  });

  useEffect(() => {
    // Force LTR for the contract layout structure, as it's bilingual but structured primarily LTR visually in the image
    document.documentElement.dir = 'ltr'; 
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated' && id) {
      fetchRentalData();
    }
  }, [status, id, router]);

  const fetchRentalData = async () => {
    try {
      const res = await fetch(`/api/rentals?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setRental(data);
        
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.return_date);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        setContractData(prev => ({
            ...prev,
            car_brand: data.car_model || '',
            plate_number: data.plate_number || '',
            client_name: data.client_name || '',
            cin: data.passport_id || '', // Assuming passport_id field stores ID/Passport
            phone: data.client_phone || '',
            start_date: startDate,
            return_date: endDate,
            days: days.toString(),
            total: data.rental_price.toFixed(2),
            remaining: data.rental_price.toFixed(2),
            advance: '0.00',
        }));
      }
    } catch (error) {
      console.error('Failed to fetch rental:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDatePart = (date: Date, part: 'day' | 'month' | 'year' | 'hour' | 'minute') => {
    if (!date) return '';
    if (part === 'day') return date.getDate().toString().padStart(2, '0');
    if (part === 'month') return (date.getMonth() + 1).toString().padStart(2, '0');
    if (part === 'year') return date.getFullYear().toString().slice(-2);
    if (part === 'hour') return date.getHours().toString().padStart(2, '0');
    if (part === 'minute') return date.getMinutes().toString().padStart(2, '0');
    return '';
  };

  if (status === 'loading' || loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return (
    <div className="bg-secondary min-vh-100 py-4">
      {/* Navigation */}
      <div className="d-print-none container mb-3 d-flex justify-content-between">
        <button onClick={() => router.back()} className="btn btn-light"><i className="bi bi-arrow-left"></i> Back</button>
        <button onClick={handlePrint} className="btn btn-primary"><i className="bi bi-printer"></i> Print Contract</button>
      </div>

      {/* Contract Paper A4 */}
      <div className="contract-page mx-auto bg-white shadow-lg p-4" style={{ width: '210mm', minHeight: '297mm', position: 'relative', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
            <div style={{ width: '30%' }}>
                <h5 className="fw-bold mb-0 text-uppercase" style={{color: '#333'}}>NARENOS CAR</h5>
                <div style={{fontSize: '9px'}}>Hay Lakesibate Rue 1 N° 13 - Tanger</div>
                <div style={{fontSize: '9px'}}>GSM: 06 63 20 33 66 - 06 88 63 00 06</div>
            </div>
            <div className="text-center" style={{ width: '40%' }}>
                 {/* Car Logo Placeholder */}
                 <div style={{border: '2px solid #333', borderRadius: '50%', width: '80px', height: '40px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span className="fw-bold fst-italic">Narenos</span>
                 </div>
            </div>
            <div className="text-end" style={{ width: '30%' }}>
                <h5 className="fw-bold mb-0 text-uppercase" style={{color: '#333'}}>كراء السيارات ترينوس</h5>
                <div style={{fontSize: '9px'}}>حي القصيبات زنقة 1 رقم 13 - طنجة</div>
                <div style={{fontSize: '9px'}}>الهاتف : 0663203366 - 0688630006</div>
            </div>
        </div>

        <div className="text-center fw-bold text-uppercase fs-6 mb-3 bg-light border py-1">
            CONTRAT DE LOCATION عقد كراء السيارات
        </div>

        {/* TOP SECTION: CAR & DATE GRID */}
        <div className="row g-0 mb-2">
            {/* Left: Car Info */}
            <div className="col-6 pe-2">
                <div className="border p-2 h-100">
                    <div className="d-flex mb-1 align-items-center">
                        <span className="fw-bold me-2" style={{width: '100px'}}>Marque:</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="النوع" value={contractData.car_brand} onChange={e => setContractData({...contractData, car_brand: e.target.value})} />
                    </div>
                    <div className="d-flex mb-1 align-items-center">
                        <span className="fw-bold me-2" style={{width: '100px'}}>N° Immatriculation:</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="رقم التسجيل" value={contractData.plate_number} onChange={e => setContractData({...contractData, plate_number: e.target.value})} />
                    </div>
                    <div className="d-flex mb-1 align-items-center">
                        <span className="fw-bold me-2" style={{width: '100px'}}>Lieu de Livraison:</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="مكان التسليم" value={contractData.delivery_place} onChange={e => setContractData({...contractData, delivery_place: e.target.value})} />
                    </div>
                    <div className="d-flex mb-1 align-items-center">
                        <span className="fw-bold me-2" style={{width: '100px'}}>Lieu de Reprise:</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="مكان الاسترجاع" value={contractData.return_place} onChange={e => setContractData({...contractData, return_place: e.target.value})} />
                    </div>
                </div>
            </div>
            
            {/* Right: Date Grid & Warnings */}
            <div className="col-6 ps-2">
                 <div className="border p-1 mb-2">
                     <div className="d-flex justify-content-end mb-1" style={{fontSize: '9px', direction: 'rtl'}}>
                         - بعد انتهاء صلاحية هذا العقد تعد السياقة غير قانونية ويعرض السائق للعقوبات الجاري بها العمل.
                     </div>
                     <div className="d-flex justify-content-end" style={{fontSize: '9px', direction: 'rtl'}}>
                         - لا يسمح لغير السائق المسجل في العقد سياقة هذه المركبة بدون حصول على إذن من الوكالة.
                     </div>
                 </div>
                 
                 {/* Grid Table */}
                 <table className="table table-bordered text-center mb-0" style={{fontSize: '10px', borderColor: '#000'}}>
                     <thead>
                         <tr>
                             <th style={{width: '30%'}}></th>
                             <th>J</th>
                             <th>M</th>
                             <th>A</th>
                             <th>H</th>
                             <th>mn</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr>
                             <td className="text-start py-0 px-1"><span className="fw-bold">Départ</span> <span className="float-end">الانطلاق</span></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.start_date, 'day')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.start_date, 'month')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.start_date, 'year')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.start_date, 'hour')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.start_date, 'minute')} readOnly /></td>
                         </tr>
                         <tr>
                             <td className="text-start py-0 px-1"><span className="fw-bold">Retour</span> <span className="float-end">الرجوع</span></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.return_date, 'day')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.return_date, 'month')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.return_date, 'year')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.return_date, 'hour')} readOnly /></td>
                             <td className="py-0 px-0"><input className="w-100 border-0 text-center bg-transparent" value={formatDatePart(contractData.return_date, 'minute')} readOnly /></td>
                         </tr>
                         <tr>
                            <td className="text-start py-0 px-1"><span className="fw-bold" style={{fontSize: '9px'}}>Retour définitif</span> <span className="float-end">الرجوع النهائي</span></td>
                            <td></td><td></td><td></td><td></td><td></td>
                         </tr>
                         <tr>
                            <td className="text-start py-0 px-1"><span className="fw-bold">Durée</span> <span className="float-end">المدة</span></td>
                            <td colSpan={5} className="py-0"><input className="w-100 border-0 text-center bg-transparent fw-bold" value={contractData.days + ' Jours'} readOnly /></td>
                         </tr>
                     </tbody>
                 </table>
            </div>
        </div>

        {/* CLIENT INFO */}
        <div className="section-box border mb-2">
            <div className="section-title bg-light border-bottom text-center fw-bold py-1">
                LOCATAIRE المكتري
            </div>
            <div className="p-2">
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Nom & Prénom :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="الإسم العائلي والشخصي" value={contractData.client_name} onChange={e => setContractData({...contractData, client_name: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Date de naissance :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="تاريخ الازدياد" value={contractData.birth_date} onChange={e => setContractData({...contractData, birth_date: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Adresse au Maroc :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="العنوان بالمغرب" value={contractData.address_morocco} onChange={e => setContractData({...contractData, address_morocco: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Adresse à l'Etranger :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="العنوان بالخارج" value={contractData.address_abroad} onChange={e => setContractData({...contractData, address_abroad: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Permis de conduire N° :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="رخصة السياقة رقم" value={contractData.license_number} onChange={e => setContractData({...contractData, license_number: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Date d'expiration :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="تاريخ الانتهاء" value={contractData.license_expiry} onChange={e => setContractData({...contractData, license_expiry: e.target.value})} />
                </div>
                <div className="row g-2 mb-1">
                    <div className="col-6 d-flex">
                        <span className="fw-bold me-2">C.I.N :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="رقم البطاقة الوطنية" value={contractData.cin} onChange={e => setContractData({...contractData, cin: e.target.value})} />
                    </div>
                    <div className="col-6 d-flex">
                        <span className="fw-bold me-2">Passeport N° :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="جواز السفر" value={contractData.passport} onChange={e => setContractData({...contractData, passport: e.target.value})} />
                    </div>
                </div>
                 <div className="row g-2 mb-1">
                    <div className="col-6 d-flex">
                        <span className="fw-bold me-2">Date d'expiration :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="تاريخ الانتهاء" value={contractData.passport_expiry} onChange={e => setContractData({...contractData, passport_expiry: e.target.value})} />
                    </div>
                    <div className="col-6 d-flex">
                        <span className="fw-bold me-2">Tél. :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="الهاتف" value={contractData.phone} onChange={e => setContractData({...contractData, phone: e.target.value})} />
                    </div>
                </div>
            </div>
        </div>
        
        {/* SECOND DRIVER */}
        <div className="section-box border mb-2">
            <div className="section-title bg-light border-bottom text-center fw-bold py-1">
                Le Conducteur Supplémentaire السائق المرخص
            </div>
            <div className="p-2">
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Nom & Prénom :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="الإسم العائلي والشخصي" value={contractData.second_driver_name} onChange={e => setContractData({...contractData, second_driver_name: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Permis de conduire N° :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="رخصة السياقة رقم" value={contractData.second_driver_license} onChange={e => setContractData({...contractData, second_driver_license: e.target.value})} />
                </div>
                <div className="d-flex mb-1">
                    <span className="fw-bold" style={{width: '120px'}}>Date d'expiration :</span>
                    <input type="text" className="data-input flex-grow-1 text-end" placeholder="تاريخ الانتهاء" value={contractData.second_driver_expiry} onChange={e => setContractData({...contractData, second_driver_expiry: e.target.value})} />
                </div>
                <div className="row g-2 mb-1">
                    <div className="col-6 d-flex">
                        <span className="fw-bold me-2">Passeport N° :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="رقم جواز السفر" value={contractData.second_driver_passport} onChange={e => setContractData({...contractData, second_driver_passport: e.target.value})} />
                    </div>
                    <div className="col-6 d-flex">
                         <span className="fw-bold me-2">C.I.N :</span>
                        <input type="text" className="data-input flex-grow-1 text-end" placeholder="رقم البطاقة الوطنية" value={contractData.second_driver_cin} onChange={e => setContractData({...contractData, second_driver_cin: e.target.value})} />
                    </div>
                </div>
                <div className="d-flex mb-1 border-bottom pb-1">
                    <span className="fw-bold me-2">Caution :</span>
                     <input type="text" className="data-input flex-grow-1 text-end" placeholder="ضمانة" value={contractData.deposit} onChange={e => setContractData({...contractData, deposit: e.target.value})} />
                </div>
            </div>
        </div>

        {/* MIDDLE SECTION: CAR DIAGRAM & INFO */}
        <div className="row g-0 mb-3 align-items-center border p-2">
            <div className="col-12 mb-2 text-center" style={{fontSize: '10px'}}>
                Départ Avant de prendre la voiture
            </div>
            
            <div className="col-12 d-flex justify-content-center align-items-center mb-3">
                 <div className="mx-3 text-center">
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label fw-bold">Dommage</label>
                    </div>
                    <br/>
                    <div className="form-check form-check-inline">
                         <input className="form-check-input" type="checkbox" />
                         <label className="form-check-label fw-bold">Damage</label>
                    </div>
                    <br/>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" />
                        <label className="form-check-label fw-bold">Daño</label>
                    </div>
                 </div>

                 {/* CAR DIAGRAM SVG */}
                 <div className="position-relative mx-3" style={{width: '200px'}}>
                     <div className="text-center fw-bold">AR</div>
                     <svg viewBox="0 0 200 350" style={{width: '100%', height: 'auto', display: 'block'}}>
                        {/* Simple Car Outline */}
                        <path d="M40,50 Q40,20 100,20 Q160,20 160,50 L160,300 Q160,330 100,330 Q40,330 40,300 Z" fill="none" stroke="black" strokeWidth="2" />
                        {/* Windows */}
                        <path d="M50,80 L150,80 L140,110 L60,110 Z" fill="none" stroke="black" strokeWidth="1" />
                        <path d="M50,270 L150,270 L140,240 L60,240 Z" fill="none" stroke="black" strokeWidth="1" />
                        {/* Roof */}
                        <rect x="50" y="120" width="100" height="110" fill="none" stroke="black" strokeWidth="1" />
                        {/* Hood Lines */}
                        <path d="M50,80 Q100,60 150,80" fill="none" stroke="black" strokeWidth="1" />
                        <path d="M50,270 Q100,290 150,270" fill="none" stroke="black" strokeWidth="1" />
                        {/* Mirrors */}
                        <rect x="20" y="90" width="20" height="30" rx="5" fill="none" stroke="black" strokeWidth="1" />
                        <rect x="160" y="90" width="20" height="30" rx="5" fill="none" stroke="black" strokeWidth="1" />
                     </svg>
                     <div className="text-center fw-bold">AV</div>
                 </div>

                 <div className="mx-3 text-center">
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                        <label className="form-check-label fw-bold">Non Dommage</label>
                    </div>
                    <br/>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                        <label className="form-check-label fw-bold">No Damage</label>
                    </div>
                    <br/>
                    <div className="form-check form-check-inline">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                        <label className="form-check-label fw-bold">Sin Daño</label>
                    </div>
                 </div>

                 {/* COMMENTS */}
                 <div className="ms-3 border p-2" style={{width: '200px'}}>
                     <div className="fw-bold mb-2">Commentaires</div>
                     <div style={{fontSize: '9px'}} className="mb-2 text-muted">Positionner les Numeros à l'endroit précis du Dommage sur la matrice à droite.</div>
                     {[1, 2, 3, 4, 5].map(i => (
                         <div key={i} className="d-flex align-items-center mb-1">
                             <span className="fw-bold me-2">{i}</span>
                             <div className="border-bottom flex-grow-1"></div>
                         </div>
                     ))}
                 </div>
            </div>
        </div>

        {/* BOTTOM: PAYMENT & SIGNATURE */}
        <div className="row g-0">
            {/* Payment Table */}
             <div className="col-12 mb-2">
                 <table className="table table-bordered text-center mb-0 border-dark">
                     <tr>
                         <td className="bg-light fw-bold" style={{width: '20%'}}>Pré-paiement<br/>Prépayement</td>
                         <td style={{width: '20%'}}>
                             <div className="d-flex justify-content-between px-1"><span>Total</span><span>Total</span></div>
                             <input className="w-100 border-0 text-center fw-bold" value={contractData.total} onChange={e => setContractData({...contractData, total: e.target.value})} />
                         </td>
                         <td style={{width: '20%'}}>
                             <div className="d-flex justify-content-between px-1"><span>Avance</span><span>Avanced</span></div>
                             <input className="w-100 border-0 text-center fw-bold" value={contractData.advance} onChange={e => setContractData({...contractData, advance: e.target.value})} />
                         </td>
                         <td style={{width: '20%'}}>
                             <div className="d-flex justify-content-between px-1"><span>Reste</span><span>Rest</span></div>
                             <input className="w-100 border-0 text-center fw-bold" value={contractData.remaining} onChange={e => setContractData({...contractData, remaining: e.target.value})} />
                         </td>
                     </tr>
                 </table>
             </div>

             {/* Payment Method */}
             <div className="col-12 d-flex align-items-center border p-2 mb-2">
                 <div className="fw-bold me-3">Mode de paiement<br/>Payment method</div>
                 <div className="d-flex align-items-center me-4">
                     <span className="me-2 text-end" style={{lineHeight: '1.2'}}>En espèces<br/>Cash</span>
                     <div className="border border-dark p-1" style={{width: '20px', height: '20px'}}></div>
                 </div>
                 <div className="d-flex align-items-center me-4">
                     <span className="me-2 text-end" style={{lineHeight: '1.2'}}>Chèque<br/>Check</span>
                     <div className="border border-dark p-1" style={{width: '20px', height: '20px'}}></div>
                 </div>
                 <div className="d-flex align-items-center">
                     <span className="me-2 text-end" style={{lineHeight: '1.2'}}>Carte<br/>TPE</span>
                     <div className="border border-dark p-1" style={{width: '20px', height: '20px'}}></div>
                 </div>
             </div>

             {/* Text */}
             <div className="col-12 mb-3" style={{fontSize: '9px'}}>
                 Je reconnais avoir pris connaissance des présentes conditions générales (rectoet verso) que je m'engage à les respecter. <br/>
                 Observation : En cas d'accident ou de vol, je m'engage à régler la valeur de la franchise. avec présentation du P.V
             </div>

             {/* Signatures */}
             <div className="col-12 d-flex justify-content-between">
                 <div className="text-center" style={{width: '30%'}}>
                     <div className="fw-bold mb-4">Signature Client</div>
                     <div className="border-bottom w-100 pt-5"></div>
                 </div>
                 <div className="text-center" style={{width: '30%'}}>
                     <div className="fst-italic mb-4">Fait à Tanger le : {new Date().toLocaleDateString()}</div>
                     <div className="text-end fw-bold">NARENOS</div>
                 </div>
             </div>
        </div>

      </div>

      <style jsx global>{`
        .data-input {
            border: none;
            border-bottom: 0px dotted #999;
            background: rgba(240, 240, 240, 0.5);
            font-weight: bold;
            font-size: 11px;
            padding: 0 5px;
        }
        .data-input::placeholder {
            color: #ccc;
            opacity: 0.5;
            font-weight: normal;
        }
        .table-bordered td, .table-bordered th {
            border: 1px solid #777;
            vertical-align: middle;
        }
        @media print {
            body { 
                background: white !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
            }
            .contract-page {
                box-shadow: none !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .btn, .d-print-none {
                display: none !important;
            }
            .data-input {
                background: transparent !important;
                border-bottom: none !important;
            }
        }
      `}</style>
    </div>
  );
}
