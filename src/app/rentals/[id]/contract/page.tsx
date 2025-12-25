'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { getTranslations, isRTL, Language, Translations } from '@/lib/translations';
import { toBusinessInputString } from '@/lib/timezone';
import SignatureCanvas from 'react-signature-canvas';

export default function ContractPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);

  // Signature State
  const [signatures, setSignatures] = useState<{client: string | null, client2: string | null, agency: string | null}>({
      client: null, client2: null, agency: null
  });
  const [activeSignField, setActiveSignField] = useState<'client' | 'client2' | 'agency' | null>(null);
  const sigCanvas = useRef<any>(null);

  const handleSaveSignature = () => {
      if (sigCanvas.current && activeSignField) {
          const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
          setSignatures(prev => ({...prev, [activeSignField]: dataURL}));
          setActiveSignField(null);
      }
  };

  const clearSignature = () => {
      if (sigCanvas.current) {
          sigCanvas.current.clear();
      }
  };
  
  // Editable fields state
  const [contractData, setContractData] = useState({
    contract_number: '00001',
    // Car Details
    car_brand: '', 
    plate_number: '',
    fuel_type: 'Diesel',
    delivery_place: 'Tanger',
    return_place: 'Tanger',

    // Dates (Stored as Business Time Strings: YYYY-MM-DDTHH:mm)
    start_date: toBusinessInputString(new Date()),
    return_date: toBusinessInputString(new Date()),
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
    advance: '0.00',
    remaining: '',
    payment_method: 'cash', 

    // Second Driver
    second_driver_name: '',
    second_driver_license: '',
    second_driver_expiry: '',
    second_driver_passport: '',
    second_driver_cin: '',
    
    // Condition
    damage_type: 'none', // 'damage' or 'none'
    comments: ['', '', '', '', ''],
  });

  useEffect(() => {
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
        
        // Convert UTC to Business Time Strings
        const startStr = toBusinessInputString(data.start_date);
        const returnStr = toBusinessInputString(data.return_date);
        
        // Helper to formatting dates to DD/MM/YYYY (timezone safe string split)
        const toNormalDate = (val: string | undefined) => {
            if (!val) return '';
            // Check if YYYY-MM-DD format
            if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
                const [y, m, d] = val.split('T')[0].split('-');
                return `${d}/${m}/${y}`;
            }
            return val;
        };

        // Calculate days using the strings (interpreted as local to preserve duration)
        const d1 = new Date(startStr);
        const d2 = new Date(returnStr);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        setContractData(prev => ({
            ...prev,
            contract_number: data.rental_number || prev.contract_number,
            car_brand: data.car_model || '',
            plate_number: data.plate_number || '',
            client_name: data.client_name || '',
            birth_date: toNormalDate(data.client_date_of_birth),
            address_morocco: data.client_address || '',
            cin: data.client_id_number || '', 
            passport: data.passport_id || '',
            license_number: data.driving_license || '',
            license_expiry: toNormalDate(data.client_license_expiry),
            passport_expiry: toNormalDate(data.client_passport_expiry),
            phone: data.client_phone || '',
            start_date: startStr,
            return_date: returnStr,
            days: days.toString(),
            total: data.rental_price ? data.rental_price.toFixed(2) : '',
            remaining: data.rental_price ? data.rental_price.toFixed(2) : '',
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

  // Helper for date parts (Using String Parsing for consistency)
  const formatDatePart = (dateStr: string | Date, part: 'day' | 'month' | 'year' | 'year_short' | 'hour' | 'minute') => {
    if (!dateStr) return '';
    const str = typeof dateStr === 'string' ? dateStr : toBusinessInputString(dateStr);
    // Format: YYYY-MM-DDTHH:mm
    
    switch (part) {
      case 'day': return str.slice(8, 10);
      case 'month': return str.slice(5, 7);
      case 'year': return str.slice(0, 4); 
      case 'year_short': return str.slice(2, 4);
      case 'hour': return str.slice(11, 13);
      case 'minute': return str.slice(14, 16);
      default: return '';
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center p-5 font-bold">Loading Contract...</div>;
  }

  // Styles Updated for better spacing and readability
  const mainBorder = "border-[2px] border-[#333] overflow-hidden"; // Darker border
  const colDivider = "border-r-[2px] border-[#333]"; // Vertical divider
  
  // Larger fonts, more consistent widths
  const labelStyle = "text-[10px] font-bold text-[#333] flex-shrink-0 w-32 truncate"; 
  const inputStyle = "flex-grow min-w-0 bg-transparent border-b border-[#555] border-dotted focus:border-blue-600 outline-none h-5 px-1 text-[11px]  text-[#000] text-center mx-2";
  
  const gridHeaderStyle = "border-r border-[#333] h-full flex items-center justify-center font-bold text-[9px] bg-gray-50 text-[#333]";
  const gridCellStyle = "border-r border-[#333] h-full relative";
  const gridInput = "w-full h-full text-center bg-transparent border-none outline-none text-[11px] font-bold absolute top-0 left-0 text-[#000]";

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white text-[#333] font-sans">
      
      {/* Action Bar */}
      <div className="container mx-auto max-w-[210mm] mt-10 flex justify-between print:hidden px-4">
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 text-white rounded shadow hover:bg-gray-800 text-sm flex items-center font-medium transition-colors">
            <i className="bi bi-arrow-left mr-2"></i> Return
        </button>
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm flex items-center font-medium transition-colors">
            <i className="bi bi-printer mr-2"></i> Print Contract
        </button>
      </div>

      {/* Contract A4 Container */}
      <div className="mx-auto bg-white shadow-2xl print:shadow-none p-6 print:p-0 box-border relative flex flex-col" 
           style={{ width: '210mm', minHeight: '297mm', padding: '10mm 8mm' }}>
          
          {/* HEADER SECTION */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-[#333]">
               {/* Left: French Info */}
               <div className="tracking-wide">
                   <h1 className="text-3xl font-black uppercase tracking-tight mb-1 leading-none text-[#333] m-0">NARENOS CAR</h1>
                   <div className="text-[11px] font-semibold text-[#555] space-y-0.5">
                        <p className="leading-tight m-0">Hay Lakesibate Rue 1 N° 13 - Tanger</p>
                        <p className="leading-tight m-0">GSM : 06 63 20 33 66 - 06 88 63 00 06</p>
                   </div>
               </div>

                {/* Center: Logo */}
                <div className="flex-grow flex justify-center items-center px-4">
                    <div className="relative w-28 h-28">
                         <img 
                            src="/narenos-logo.jpg" 
                            alt="Narenos Logo" 
                            className="w-full h-full object-contain"
                            style={{ filter: 'grayscale(100%) invert(100%) contrast(150%)' }} 
                         />
                    </div>
                </div>

               {/* Right: Arabic Info */}
               <div className="text-right" dir="rtl">
                   <h1 className="text-3xl font-black uppercase tracking-tight leading-none text-[#333] m-0" style={{fontFamily: 'serif'}}>كراء السيارات نرينوس</h1>
                   <div className="text-[12px] font-bold text-[#555] space-y-0.5 mt-1">
                        <p className="leading-none m-0">حي القصيبات زنقة 1 رقم 13 - طنجة</p>
                        <p className="leading-none m-0" dir="ltr">0688630006 - 0663203366 : الهاتف</p>
                   </div>
               </div>
          </div>
          
          {/* TITLE STRIP */}
          <div className="flex justify-center items-center gap-6 mb-4 bg-gray-100 py-1 rounded border border-gray-200">
               <span className="font-black text-xl uppercase tracking-wider text-[#333]">CONTRAT DE LOCATION</span>
               <span className="font-black text-2xl text-[#333]" style={{fontFamily: 'serif'}}>عقد كراء السيارات</span>
          </div>

          {/* MAIN BODY: 2 COLUMN LAYOUT */}
          <div className={`${mainBorder} flex flex-grow`}>
              
              {/* === LEFT COLUMN (52%) === */}
              <div className={`w-[60%] ${colDivider} p-3 flex flex-col gap-4`}>
                  
                  {/* CAR DETAILS - BOXED */}
                  <div className="border border-[#4a4a4a] rounded overflow-hidden mb-4">
                       {[
                         {l:"Marque", a:"النوع", k:"car_brand"},
                         {l:"N° Immatriculation", a:"رقم التسجيل", k:"plate_number"},
                         {l:"Lieu de Livraison", a:"مكان التسليم", k:"delivery_place"},
                         {l:"Lieu de Reprise", a:"مكان الاسترجاع", k:"return_place"}
                       ].map((r, i) => (
                         <div key={i} className="flex items-stretch w-full border-b border-[#4a4a4a] last:border-b-0">
                             <div className="w-[35%] flex flex-col justify-center items-center px-2 py-1 bg-gray-50 border-r border-[#4a4a4a]">
                                 <span className="text-[9px] font-bold text-[#333] leading-none text-center mb-0.5">{r.l}</span>
                                 <span className="text-[10px] font-bold text-[#333] font-serif leading-none text-center">{r.a}</span>
                             </div>
                             <div className="flex-grow bg-white">
                                <input className="w-full h-full text-center text-[11px] font-bold text-[#222] bg-transparent outline-none px-2 py-1" 
                                       value={(contractData as any)[r.k]} 
                                       onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                             </div>
                         </div>
                       ))}
                  </div>

                  {/* LOCATAIRE */}
                  <div className="flex flex-col gap-1 mb-4">
                      <div className="flex justify-center items-center gap-4 font-black text-sm uppercase mb-1 bg-[#4a4a4a] text-white py-1 rounded-sm">
                          <span>LOCATAIRE</span> <span style={{fontFamily:'serif'}}>المكتري</span>
                      </div>
                      <div className="border border-[#4a4a4a] rounded overflow-hidden">
                          {[
                            {l:"Nom & Prénom", a:"الإسم العائلي والشخصي", k:"client_name", multiline: false},
                            {l:"Date de naissance", a:"تاريخ الازدياد", k:"birth_date"},
                            {l:"Adresse au Maroc", a:"العنوان بالمغرب", k:"address_morocco", multiline: true},
                            {l:"Adresse à l'Etranger", a:"العنوان بالخارج", k:"address_abroad", multiline: true},
                            {l:"Permis de conduire N°", a:"رخصة السياقة رقم", k:"license_number"},
                            {l:"Date d'expiration", a:"تاريخ الانتهاء", k:"license_expiry"},
                            {l:"C.I.N", a:"رقم البطاقة الوطنية", k:"cin"},
                            {l:"Passeport N°", a:"جواز السفر", k:"passport"},
                            {l:"Date d'expiration", a:"تاريخ الانتهاء", k:"passport_expiry"},
                            // Phone removed as requested
                          ].map((r, i) => (
                            <div key={i} className="flex items-stretch w-full border-b border-[#4a4a4a] last:border-b-0">
                                <div className="w-[30%] flex flex-col justify-center items-center px-1 py-1 bg-gray-50 border-r border-[#4a4a4a]">
                                    <span className="text-[9px] font-bold text-[#333] leading-none text-center mb-0.5">{r.l}</span>
                                    <span className="text-[10px] font-bold text-[#333] font-serif leading-none text-center">{r.a}</span>
                                </div>
                                <div className="flex-grow bg-white min-h-[24px]">
                                    {r.multiline ? (
                                        <textarea 
                                            className="w-full h-full text-center text-[11px] font-bold text-[#222] bg-transparent outline-none px-2 py-1 resize-none overflow-hidden" 
                                            rows={2}
                                            value={(contractData as any)[r.k]} 
                                            onChange={e => setContractData({...contractData, [r.k]: e.target.value})} 
                                        />
                                    ) : (
                                        <input 
                                            className="w-full h-full text-center text-[11px] font-bold text-[#222] bg-transparent outline-none px-2 py-1" 
                                            value={(contractData as any)[r.k]} 
                                            onChange={e => setContractData({...contractData, [r.k]: e.target.value})} 
                                        />
                                    )}
                                </div>
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* CONDUCTEUR SUPPLEMENTAIRE */}
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-center items-center gap-4 font-black text-sm uppercase mb-1 bg-[#4a4a4a] text-white py-1 rounded-sm">
                          <span>CONDUCTEUR SUPPLEMENTAIRE</span> <span style={{fontFamily:'serif'}}>السائق المرخص</span>
                      </div>
                      <div className="border border-[#4a4a4a] rounded overflow-hidden">
                          {[
                            {l:"Nom & Prénom", a:"الإسم العائلي والشخصي", k:"second_driver_name"},
                            {l:"Permis de conduire N°", a:"رخصة السياقة رقم", k:"second_driver_license"},
                            {l:"Date d'expiration", a:"تاريخ الانتهاء", k:"second_driver_expiry"},
                            {l:"Passeport N°", a:"رقم جواز السفر", k:"second_driver_passport"},
                            {l:"C.I.N", a:"رقم البطاقة الوطنية", k:"second_driver_cin"},
                          ].map((r, i) => (
                            <div key={i} className="flex items-stretch w-full border-b border-[#4a4a4a] last:border-b-0">
                                <div className="w-[35%] flex flex-col justify-center items-center px-2 py-1 bg-gray-50 border-r border-[#4a4a4a]">
                                    <span className="text-[9px] font-bold text-[#333] leading-none text-center mb-0.5">{r.l}</span>
                                    <span className="text-[10px] font-bold text-[#333] font-serif leading-none text-center">{r.a}</span>
                                </div>
                                <div className="flex-grow bg-white">
                                    <input className="w-full h-full text-center text-[11px] font-bold text-[#222] bg-transparent outline-none px-2 py-1" 
                                           value={(contractData as any)[r.k]} 
                                           onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                                </div>
                            </div>
                          ))}
                          {/* Caution/Deposit Special Row */}
                          <div className="flex items-stretch w-full border-t border-[#4a4a4a]">
                                <div className="w-[35%] flex flex-col justify-center items-center px-2 py-1 bg-gray-50 border-r border-[#4a4a4a]">
                                    <span className="text-[9px] font-bold text-[#333] leading-none text-center mb-0.5">Caution</span>
                                    <span className="text-[10px] font-bold text-[#333] font-serif leading-none text-center">ضمانة</span>
                                </div>
                                <div className="flex-grow bg-white">
                                    <input className="w-full h-full text-center text-[11px] font-bold text-[#222] bg-transparent outline-none px-2 py-1" 
                                           value={contractData.deposit} 
                                           onChange={e => setContractData({...contractData, deposit: e.target.value})} />
                                </div>
                          </div>
                      </div>
                  </div>

              </div>

              {/* === RIGHT COLUMN (48%) === */}
              <div className="w-[40%] p-3 flex flex-col justify-between">
                  
                  <div>
                    {/* Warning Text */}
                    <div className="text-[10px] text-right font-bold leading-snug mb-3 p-2 border border-red-200 bg-red-50/50 rounded" dir="rtl" style={{fontFamily:'serif'}}>
                        <p className="mb-1">- بعد انتهاء صلاحية هذا العقد تعد السياقة غير قانونية ويعرض السائق للعقوبات الجاري بها العمل.</p>
                        <p className="m-0">- لا يسمح لغير السائق المسجل في العقد سياقة هذه المركبة بدون حصول على إذن من الوكالة</p>
                    </div>

                    {/* Date Grid */}
                    <div className={`border-2 border-[#333] mb-4 shadow-sm`}>
                        <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-8 border-b-2 border-[#333] bg-gray-100">
                            <div className={gridHeaderStyle}></div>
                            <div className={gridHeaderStyle}>J</div>
                            <div className={gridHeaderStyle}>M</div>
                            <div className={gridHeaderStyle}>A</div>
                            <div className={gridHeaderStyle}>H</div>
                            <div className="h-full flex items-center justify-center font-bold text-[10px] text-[#333]">mn</div>
                        </div>
                        
                        {/* Helper to update date parts */}
                        {(() => {
                            const updateDate = (field: 'start_date' | 'return_date', part: 'day'|'month'|'year'|'hour'|'minute', val: string) => {
                                let v = parseInt(val);
                                if (isNaN(v)) v = 0;
                                let s = contractData[field] as string;
                                if (typeof s !== 'string') s = toBusinessInputString(s as any);
                                let year = parseInt(s.slice(0, 4));
                                let month = parseInt(s.slice(5, 7));
                                let day = parseInt(s.slice(8, 10));
                                let hour = parseInt(s.slice(11, 13));
                                let minute = parseInt(s.slice(14, 16));
                                if (part === 'day') day = v;
                                if (part === 'month') month = v;
                                if (part === 'year') year = 2000 + v; 
                                if (part === 'hour') hour = v;
                                if (part === 'minute') minute = v;
                                const d = new Date(year, month - 1, day, hour, minute);
                                const ny = d.getFullYear();
                                const nm = (d.getMonth() + 1).toString().padStart(2, '0');
                                const nd = d.getDate().toString().padStart(2, '0');
                                const nh = d.getHours().toString().padStart(2, '0');
                                const nmin = d.getMinutes().toString().padStart(2, '0');
                                const newStr = `${ny}-${nm}-${nd}T${nh}:${nmin}`;
                                setContractData({...contractData, [field]: newStr});
                            };

                            return [
                              {l:"Départ", a:"الانطلاق", f: 'start_date' as const},
                              {l:"Retour", a:"الرجوع", f: 'return_date' as const},
                            ].map((r, i) => (
                              <div key={i} className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-9 border-b border-[#333] items-stretch">
                                  <div className={`${gridHeaderStyle} flex-col !justify-center leading-none gap-0.5`}>
                                      <span>{r.l}</span><span style={{fontFamily:'serif'}}>{r.a}</span>
                                  </div>
                                  <div className={gridCellStyle}><input className={gridInput} value={formatDatePart(contractData[r.f], 'day')} onChange={e=>updateDate(r.f, 'day', e.target.value)} /></div>
                                  <div className={gridCellStyle}><input className={gridInput} value={formatDatePart(contractData[r.f], 'month')} onChange={e=>updateDate(r.f, 'month', e.target.value)} /></div>
                                  <div className={gridCellStyle}><input className={gridInput} value={formatDatePart(contractData[r.f], 'year_short')} onChange={e=>updateDate(r.f, 'year', e.target.value)} /></div>
                                  <div className={gridCellStyle}><input className={gridInput} value={formatDatePart(contractData[r.f], 'hour')} onChange={e=>updateDate(r.f, 'hour', e.target.value)} /></div>
                                  <div className="h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'minute')} onChange={e=>updateDate(r.f, 'minute', e.target.value)} /></div>
                              </div>
                            ));
                        })()}
                        
                        {/* Retour Definitif (Manual/Empty) */}
                        <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-9 border-b border-[#333] items-stretch">
                              <div className={`${gridHeaderStyle} flex-col !justify-center leading-none gap-0.5`}>
                                  <span>Retour D&eacute;finitif</span><span style={{fontFamily:'serif'}}>الرجوع النهائي</span>
                              </div>
                              <div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className="h-full relative"></div>
                        </div>

                        <div className="grid grid-cols-[25%_1fr] h-8 items-stretch bg-gray-50">
                            <div className={`${gridHeaderStyle} flex-col !justify-center leading-none gap-0.5`}>
                                <span>Durée</span><span style={{fontFamily:'serif'}}>المدة</span>
                            </div>
                            <div className="relative h-full"><input className={`${gridInput} font-black text-sm`} value={contractData.days} onChange={e=>setContractData({...contractData, days: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className=" pl-1">
                        <div className="font-bold text-[11px] mb-2 px-1 border-b border-gray-300 inline-block uppercase tracking-wide">État au Départ</div>
                        <div className="flex gap-6 px-2 mb-2">
                            {/* Dommage */}
                            <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setContractData({...contractData, damage_type: 'damage'})}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 border-2 border-[#333] flex items-center justify-center transition-all ${contractData.damage_type === 'damage' ? 'bg-[#333]' : 'bg-white'}`}>
                                        {contractData.damage_type === 'damage' && <i className="bi bi-check text-white text-xs"></i>}
                                    </div>
                                    <span className="font-bold text-[11px] group-hover:underline">Dommage</span>
                                </div>
                                <div className="text-[10px] leading-tight text-gray-600 pl-1 italic">
                                      Damage / Daño
                                </div>
                            </div>
                            
                            {/* Non Dommage */}
                            <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setContractData({...contractData, damage_type: 'none'})}>
                                <div className="flex items-center gap-2">
                                     <div className={`w-5 h-5 border-2 border-[#333] flex items-center justify-center transition-all ${contractData.damage_type === 'none' ? 'bg-[#333]' : 'bg-white'}`}>
                                         {contractData.damage_type === 'none' && <i className="bi bi-check text-white text-xs"></i>}
                                     </div>
                                     <span className="font-bold text-[11px] group-hover:underline">Non Dommage</span>
                                </div>
                                <div className="text-[10px] leading-tight text-gray-600 pl-1 italic">
                                      No Damage / Sin Daño
                                </div>
                            </div>
                        </div>
                    </div>  
                  </div>

                  {/* Diagram & Comments */}
                  <div className="flex gap-2 h-[80mm] mb-1">
                       
                       {/* Left: Car Diagram - Exploded View */}
                       <div className="w-[45%] relative flex justify-center pt-2">
                           <span className="absolute top-1 left-2 font-black text-xl z-10 leading-none text-[#333]">AR</span>
                           <span className="absolute bottom-1 left-2 font-black text-xl z-10 leading-none text-[#333]">AV</span>
                           
                           {/* Exploded View Diagram */}
                           <svg viewBox="0 0 100 180" className="h-[95%] w-full overflow-visible p-2">
                                {/* Center - Roof/Cabin */}
                                <path d="M25,60 L75,60 L75,120 L25,120 Z" fill="none" stroke="#333" strokeWidth="1.5" />
                                {/* Windshield Line */}
                                <path d="M25,120 Q50,125 75,120" fill="none" stroke="#333" strokeWidth="1" />
                                {/* Rear Window Line */}
                                <path d="M25,60 Q50,55 75,60" fill="none" stroke="#333" strokeWidth="1" />

                                {/* Top - Rear (Trunk/Bumper) */}
                                <path d="M30,55 L20,40 Q25,20 50,20 Q75,20 80,40 L70,55" fill="none" stroke="#333" strokeWidth="1.5" />
                                <circle cx="30" cy="30" r="3" fill="none" stroke="#333" strokeWidth="1" /> 
                                <circle cx="70" cy="30" r="3" fill="none" stroke="#333" strokeWidth="1" />
                                <path d="M30,55 Q50,50 70,55" fill="none" stroke="#333" strokeWidth="1" />
                                
                                {/* Bottom - Front (Hood/Bumper) */}
                                <path d="M30,125 L20,140 Q25,160 50,160 Q75,160 80,140 L70,125" fill="none" stroke="#333" strokeWidth="1.5" />
                                <path d="M40,155 L60,155 L55,160 L45,160 Z" fill="none" stroke="#333" strokeWidth="1" /> 
                                <path d="M30,125 Q50,130 70,125" fill="none" stroke="#333" strokeWidth="1" />

                                {/* Left Side - Doors */}
                                <path d="M25,65 L10,65 Q5,90 10,115 L25,115" fill="none" stroke="#333" strokeWidth="1.5" />
                                <line x1="10" y1="90" x2="25" y2="90" stroke="#333" strokeWidth="1" />

                                {/* Right Side - Doors */}
                                <path d="M75,65 L90,65 Q95,90 90,115 L75,115" fill="none" stroke="#333" strokeWidth="1.5" />
                                <line x1="90" y1="90" x2="75" y2="90" stroke="#333" strokeWidth="1" />
                           </svg>
                       </div>

                       {/* Right: Comments List */}
                       <div className="w-[55%] pt-1 pl-1 flex flex-col">
                           <h3 className="font-bold text-xs mb-1 text-right border-b border-[#333] inline-block self-end">Commentaires</h3>
                           <p className="text-[9px] leading-tight mb-2 text-justify text-gray-600">
                               Positionner les Numeros à l'endroit précis du Dommage sur la matrice à droite.
                           </p>
                           <div className="flex flex-col gap-3 flex-grow">
                               {[0,1,2,3,4].map((i) => (
                                   <div key={i} className="flex gap-2 items-end w-full">
                                       <div className="font-bold text-[11px] w-4 h-4 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">{i+1}</div>
                                       <input className="flex-grow min-w-0 border-b border-[#333] border-dotted bg-transparent outline-none text-[11px] px-1" 
                                              value={contractData.comments[i]}
                                              onChange={(e) => {
                                                  const newComments = [...contractData.comments];
                                                  newComments[i] = e.target.value;
                                                  setContractData({...contractData, comments: newComments});
                                              }} />
                                   </div>
                               ))}
                           </div>
                       </div>
                  </div>

              </div>
          </div>
          
          {/* FOOTER SECTION: PAYMENTS & SIGNATURES */}
          <div className="mt-4 text-[#333] px-1">

               {/* Row 1: Pre-payment & Prices */}
               <div className="flex justify-between items-center mb-4">
                   {/* Label Box - Pill Shape */}
                   <div className="w-[42%] border-2 border-[#333] rounded-[18px] h-14 flex flex-col justify-center px-5 shadow bg-gray-50">
                       <span className="font-black text-lg leading-none text-[#333] uppercase">Pré-paiement</span>
                       <span className="font-bold text-sm leading-none text-[#777] mt-1">Prépayement</span>
                   </div>
                   
                   {/* Price Inputs */}
                   <div className="w-[56%] flex gap-4">
                       {[
                           {l:'Total', sub:'Total', k:'total'},
                           {l:'Avance', sub:'Avance', k:'advance'},
                           {l:'Reste', sub:'Rest', k:'remaining'},
                       ].map((item, i) => (
                           <div key={i} className="flex-1 border-2 border-[#333] h-14 relative bg-white">
                               <div className="absolute top-1.5 left-2 text-[10px] font-black uppercase tracking-wider">{item.l}</div>
                               <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-gray-500 uppercase">{item.sub}</div>
                               <input className="w-full h-full text-right font-black bg-transparent outline-none text-lg px-3 pt-3" 
                                      value={(contractData as any)[item.k]}
                                      onChange={e => setContractData({...contractData, [item.k]: e.target.value})} />
                           </div>
                       ))}
                   </div>
               </div>

               {/* Row 2: Payment Method */}
               <div className="flex justify-between items-center mb-3">
                   {/* Label Box - Pill Shape */}
                   <div className="w-[38%] border border-[#333] rounded-[18px] h-12 flex flex-col justify-center px-5 bg-gray-50/50">
                       <span className="font-bold text-base leading-none text-[#333]">Mode de paiement</span>
                       <span className="font-semibold text-sm leading-none text-[#777] mt-0.5">Payment method</span>
                   </div>

                   {/* Checkboxes */}
                   <div className="w-[60%] flex gap-6 pl-2">
                       {[
                           {l:'En espèces', sub:'Cash', val:'cash'},
                           {l:'Chèque', sub:'Check', val:'check'},
                           {l:'Carte', sub:'TPE', val:'card'},
                       ].map((m, i) => (
                           <div key={i} className="flex items-center justify-end gap-3 flex-1 cursor-pointer group" onClick={() => setContractData({...contractData, payment_method: m.val})}>
                               <div className="text-right leading-[1.0]">
                                   <div className="font-bold text-[11px] text-[#333] uppercase group-hover:underline">{m.l}</div>
                                   <div className="text-[10px] text-gray-500 italic">{m.sub}</div>
                               </div>
                               <div className={`w-6 h-6 border-2 border-[#333] flex-shrink-0 flex items-center justify-center transition-colors ${contractData.payment_method === m.val ? 'bg-[#333]' : 'bg-white'}`}>
                                    {contractData.payment_method === m.val && <i className="bi bi-check-lg text-white font-bold"></i>}
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Signatures Row */}
               <div>
                   
                 

                   {/* Signatures Grid */}
                   <div className="grid grid-cols-3 gap-6 items-end px-2">
                       {/* Client 1 */}
                       <div className="flex flex-col items-center">
                           <div className="font-black text-sm text-[#333] mb-3 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[1px] after:bg-[#333]">Signature Client</div>
                           <div 
                                className="w-full h-28 border-2 border-[#ccc] rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-inner transition-colors"
                                onClick={() => setActiveSignField('client')}
                           >
                                {signatures.client ? (
                                    <img src={signatures.client} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <div className="text-center text-gray-300 print:hidden">
                                        <i className="bi bi-pen text-2xl mb-1 block"></i>
                                        <span className="text-[10px]">Click to Sign</span>
                                    </div>
                                )} 
                           </div>
                       </div>
                       
                       {/* Client 2 */}
                       <div className="flex flex-col items-center">
                           <div className="font-black text-sm text-[#333] mb-3 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[1px] after:bg-[#333]">Signature Client</div>
                           <div 
                                className="w-full h-28 border-2 border-[#ccc] rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-inner transition-colors"
                                onClick={() => setActiveSignField('client2')}
                           >
                                {signatures.client2 ? (
                                    <img src={signatures.client2} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <div className="text-center text-gray-300 print:hidden">
                                        <i className="bi bi-pen text-2xl mb-1 block"></i>
                                        <span className="text-[10px]">Click to Sign</span>
                                    </div>
                                )}
                           </div>
                       </div>

                       {/* Agency */}
                       <div className="flex flex-col items-end">
                           <div className="font-bold text-[12px] italic mb-2 text-right w-full">
                               Fait à Tanger le : <span className="inline-block min-w-[80px] border-b border-black px-1 text-center font-bold not-italic">
                                   {formatDatePart(contractData.start_date, 'day')}/{formatDatePart(contractData.start_date, 'month')}/{formatDatePart(contractData.start_date, 'year')}
                               </span>
                           </div>
                           
                           <div className="font-black text-xl tracking-[0.2em] text-[#333] mb-1 text-center w-full uppercase">
                               NARENOS
                           </div>
                           <div 
                                className="w-full h-24 border-2 border-[#ccc] rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-inner transition-colors"
                                onClick={() => setActiveSignField('agency')}
                           >
                                {signatures.agency ? (
                                    <img src={signatures.agency} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <div className="text-center text-gray-300 print:hidden">
                                        <i className="bi bi-pen text-2xl mb-1 block"></i>
                                        <span className="text-[10px]">Click to Sign</span>
                                    </div>
                                )}
                           </div>
                       </div>
                   </div>
               </div>

          </div>
      </div>
      {/* Signature Modal */}
      {activeSignField && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm select-none print:hidden">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md animate-fade-in-up">
                <h3 className="text-xl font-bold mb-4 text-center">
                    Sign Here <span className="text-blue-600">({activeSignField === 'client' ? 'Client' : activeSignField === 'client2' ? 'Client 2' : 'Agency'})</span>
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-xl mb-6 h-56 bg-gray-50 overflow-hidden relative group hover:border-blue-400 transition-colors">
                    <SignatureCanvas 
                        ref={sigCanvas} 
                        penColor="black"
                        backgroundColor="rgba(0,0,0,0)"
                        canvasProps={{className: 'w-full h-full cursor-crosshair'}} 
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 group-hover:opacity-0 transition-opacity">
                         <span className="text-4xl font-handwriting text-gray-400">Sign Here</span>
                    </div>
                </div>
                <div className="flex justify-between gap-3">
                    <button onClick={() => setActiveSignField(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors flex-1">Cancel</button>
                    <button onClick={clearSignature} className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg font-medium transition-colors flex-1">Clear</button>
                    <button onClick={handleSaveSignature} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex-1 shadow-md">Save Signature</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
