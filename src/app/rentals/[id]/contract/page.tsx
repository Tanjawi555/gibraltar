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
  const mainBorder = "border-[2px] border-black overflow-hidden"; // Darker border
  const colDivider = "border-r-[2px] border-black"; // Vertical divider
  
  // Larger fonts, more consistent widths
  const labelStyle = "text-[10px] font-bold text-black flex-shrink-0 w-32 truncate"; 
  const inputStyle = "flex-grow min-w-0 bg-transparent border-b border-black border-dotted focus:border-blue-600 outline-none h-5 px-1 text-[11px]  text-black text-center mx-2";
  
  const gridHeaderStyle = "border-r-2 border-black h-full flex items-center justify-center font-bold text-[9px] bg-white text-black";
  const gridCellStyle = "border-r-2 border-black h-full relative";
  const gridInput = "w-full h-full text-center bg-transparent border-none outline-none text-[11px] font-bold absolute top-0 left-0 text-black";

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white text-black font-sans">
      
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 0mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: white;
            width: 210mm;
            height: 297mm;
            overflow: hidden; /* Strict overflow hiding for single page */
          }
          @media print {
            body { 
               -webkit-print-color-adjust: exact !important;
               print-color-adjust: exact !important;
            }
            .print-container {
               width: 210mm !important;
               min-height: 297mm !important; 
               position: absolute;
               top: 0;
               left: 0;
               margin: 0 !important;
               padding: 5mm !important;
               box-sizing: border-box;
               background-color: white;
               display: flex;
               flex-direction: column;
               justify-content: space-between;
               overflow: visible; /* text overflow is better than clipped content */
            }
            /* Global Scale Down to ensure fit on mobile/iPhone */
            .print-scale-wrapper {
                transform: scale(0.95);
                transform-origin: top center;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
          }
        `}
      </style>

      {/* Action Bar */}
      <div className="container mx-auto max-w-[210mm] mt-10 flex justify-between print:hidden px-4">
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 text-white rounded shadow hover:bg-gray-800 text-sm flex items-center font-medium transition-colors">
            <i className="bi bi-arrow-left mr-2"></i> Return
        </button>
        <div className="flex gap-2">
            <button onClick={() => router.push(`/rentals/${id}/declaration`)} className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 text-sm flex items-center font-medium transition-colors">
                <i className="bi bi-file-text mr-2"></i> Declaration
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm flex items-center font-medium transition-colors">
                <i className="bi bi-printer mr-2"></i> Print Contract
            </button>
        </div>
      </div>

      {/* Contract A4 Container */}
      <div className="print-container mx-auto bg-white shadow-2xl print:shadow-none !p-2 md:!px-[8mm] md:!py-[5mm] box-border relative flex flex-col w-full md:w-[210mm] min-h-screen md:min-h-[297mm] print:min-h-0">
        <div className="print-scale-wrapper">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row print:flex-row justify-between items-center pb-4 mb-2 print:pb-0 print:mb-0 border-black gap-4 md:gap-0">
               {/* Left: French Info */}
               <div className="text-center md:text-left w-full md:w-[40%] tracking-wide">
                   <h1 className="text-2xl md:text-3xl print:text-xl font-black uppercase tracking-tight mb-1 print:mb-0 leading-none text-black m-0">Gibraltar CAR</h1>
                   <div className="text-[11px] font-bold text-black space-y-0.5">
                        <p className="leading-tight m-0">Hay Lakesibate Rue 1 N° 13 - Tanger</p>
                        <p className="leading-tight m-0">GSM : 06 63 20 33 66 - 06 88 63 00 06</p>
                   </div>
               </div>

                {/* Center: Logo */}
                <div className="w-full md:w-[20%] flex justify-center items-center px-4">
                    <div className="relative w-24 h-24 md:w-28 md:h-28 print:w-32 print:h-32">
                         <img 
                            src="/gibraltar-logo.jpg" 
                            alt="Gibraltar Logo" 
                            className="w-full h-full object-contain"
                            style={{ filter: 'grayscale(100%) invert(100%) contrast(150%)' }} 
                         />
                    </div>
                </div>

               {/* Right: Arabic Info */}
               <div className="text-center md:text-right w-full md:w-[40%]" dir="rtl">
                   <h1 className="text-2xl md:text-3xl print:text-xl font-black uppercase tracking-tight leading-none text-black m-0" style={{fontFamily: 'serif'}}>كراء السيارات نرينوس</h1>
                   <div className="text-[12px] font-bold text-black space-y-0.5 mt-1">
                        <p className="leading-none m-0">حي القصيبات زنقة 1 رقم 13 - طنجة</p>
                        <p className="leading-none m-0" dir="ltr">0688630006 - 0663203366 : الهاتف</p>
                   </div>
               </div>
          </div>
          
            

          {/* MAIN BODY: 2 COLUMN LAYOUT */}
          <div className={`${mainBorder} flex flex-col md:flex-row print:flex-row flex-grow`}>
              
              {/* === LEFT COLUMN (60%) === */}
              <div className={`w-full md:w-[60%] print:w-[60%] border-b-2 md:border-b-0 print:border-b-0 md:border-r-2 print:border-r-2 border-black p-3 print:p-0.5 flex flex-col gap-4 print:gap-0.5`}>
                  
                  {/* CAR DETAILS - BOXED */}
                  <div className="border-2 border-black overflow-hidden flex flex-col">
                       {[
                         {l:"Marque", a:"النوع", k:"car_brand"},
                         {l:"N° Immatriculation", a:"رقم التسجيل", k:"plate_number"},
                         {l:"Lieu de Livraison", a:"مكان التسليم", k:"delivery_place"},
                         {l:"Lieu de Reprise", a:"مكان الاسترجاع", k:"return_place"}
                       ].map((r, i, arr) => (
                         <div key={i} className="flex flex-col w-full">
                             <div className="flex items-stretch w-full">
                                 <div className="w-[35%] flex flex-col justify-center items-center px-2 py-1 bg-white border-r-2 border-black !border-black">
                                     <span className="text-[9px] font-bold text-black leading-none text-center mb-0.5">{r.l}</span>
                                     <span className="text-[10px] font-bold text-black font-serif leading-none text-center">{r.a}</span>
                                 </div>
                                 <div className="flex-grow bg-white">
                                    <input className="w-full h-full text-center text-[11px] font-bold text-black bg-transparent outline-none px-2 py-1" 
                                           value={(contractData as any)[r.k]} 
                                           onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                                 </div>
                             </div>
                             {/* Separator Line - Skip for last item if relying on container border, or keep to enforce. 
                                 Using physical div ensures it prints. */}
                             {i < arr.length - 1 && <div className="w-full h-[2px] bg-black print:bg-black shrink-0"></div>}
                         </div>
                       ))}
                  </div>

                  {/* LOCATAIRE */}
                  <div className="flex flex-col gap-1 ">
                      <div className="flex justify-between items-end px-1 border-b-2 border-black pb-1 mb-1">
                          <span className="font-black text-xs uppercase tracking-widest text-black">LOCATAIRE</span>
                          <span className="font-bold text-sm text-black leading-none" style={{fontFamily:'serif'}}>المكتري</span>
                      </div>
                      <div className="border-2 border-black overflow-hidden flex flex-col">
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
                          ].map((r, i, arr) => (
                            <div key={i} className="flex flex-col w-full">
                                <div className="flex items-stretch w-full">
                                    <div className="w-[30%] flex flex-col justify-center items-center px-1 py-1 bg-white border-r-2 border-black !border-black">
                                        <span className="text-[9px] font-bold text-black leading-none text-center mb-0.5">{r.l}</span>
                                        <span className="text-[10px] font-bold text-black font-serif leading-none text-center">{r.a}</span>
                                    </div>
                                    <div className="flex-grow bg-white min-h-[24px]">
                                        {r.multiline ? (
                                            <textarea 
                                                className="w-full h-full text-center text-[11px] font-bold text-black bg-transparent outline-none px-2 py-1 resize-none overflow-hidden" 
                                                rows={2}
                                                value={(contractData as any)[r.k]} 
                                                onChange={e => setContractData({...contractData, [r.k]: e.target.value})} 
                                            />
                                        ) : (
                                            <input 
                                                className="w-full h-full text-center text-[11px] font-bold text-black bg-transparent outline-none px-2 py-1" 
                                                value={(contractData as any)[r.k]} 
                                                onChange={e => setContractData({...contractData, [r.k]: e.target.value})} 
                                            />
                                        )}
                                    </div>
                                </div>
                                {i < arr.length - 1 && <div className="w-full h-[2px] bg-black print:bg-black shrink-0"></div>}
                            </div>
                          ))}
                      </div>
                  </div>

                  {/* CONDUCTEUR SUPPLEMENTAIRE */}
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-end px-1 border-b-2 border-black pb-1 mb-1">
                          <span className="font-black text-xs uppercase tracking-widest text-black">CONDUCTEUR SUPPLEMENTAIRE</span>
                          <span className="font-bold text-sm text-black leading-none" style={{fontFamily:'serif'}}>السائق المرخص</span>
                      </div>
                      <div className="border-2 border-black overflow-hidden flex flex-col">
                          {[
                            {l:"Nom & Prénom", a:"الإسم العائلي والشخصي", k:"second_driver_name"},
                            {l:"Permis de conduire N°", a:"رخصة السياقة رقم", k:"second_driver_license"},
                            {l:"Date d'expiration", a:"تاريخ الانتهاء", k:"second_driver_expiry"},
                            {l:"Passeport N°", a:"رقم جواز السفر", k:"second_driver_passport"},
                            {l:"C.I.N", a:"رقم البطاقة الوطنية", k:"second_driver_cin"},
                          ].map((r, i, arr) => (
                            <div key={i} className="flex flex-col w-full">
                                <div className="flex items-stretch w-full">
                                    <div className="w-[35%] flex flex-col justify-center items-center px-2 py-1 bg-white border-r-2 border-black !border-black">
                                        <span className="text-[9px] font-bold text-black leading-none text-center mb-0.5">{r.l}</span>
                                        <span className="text-[10px] font-bold text-black font-serif leading-none text-center">{r.a}</span>
                                    </div>
                                    <div className="flex-grow bg-white">
                                        <input className="w-full h-full text-center text-[11px] font-bold text-black bg-transparent outline-none px-2 py-1" 
                                               value={(contractData as any)[r.k]} 
                                               onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                                    </div>
                                </div>
                                {i < arr.length - 1 && <div className="w-full h-[2px] bg-black print:bg-black shrink-0"></div>}
                            </div>
                          ))}
                         
                      </div>
                  </div>

              </div>

              {/* === RIGHT COLUMN (40%) === */}
              <div className="w-full md:w-[40%] print:w-[40%] p-3 print:p-0.5 flex flex-col justify-start gap-2 print:gap-0.5">
                  
                  <div>
                    {/* Warning Text Removed */}

                    {/* Date Grid - Refactored to Gap-Method for perfect print lines */}
                    <div className="border-2 border-black mb-4 shadow-sm bg-black flex flex-col gap-[2px]">
                        {/* Header */}
                        <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-8 bg-black gap-[2px]">
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[9px] text-black"></div>
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[9px] text-black">J</div>
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[9px] text-black">M</div>
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[9px] text-black">A</div>
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[9px] text-black">H</div>
                            <div className="bg-white h-full flex items-center justify-center font-bold text-[10px] text-black">mn</div>
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
                              <div key={i} className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-9 bg-black gap-[2px]">
                                  <div className="bg-white h-full flex flex-col items-center justify-center font-bold text-[9px] text-black leading-none gap-0.5 border-none">
                                      <span>{r.l}</span><span style={{fontFamily:'serif'}}>{r.a}</span>
                                  </div>
                                  <div className="bg-white h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'day')} onChange={e=>updateDate(r.f, 'day', e.target.value)} /></div>
                                  <div className="bg-white h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'month')} onChange={e=>updateDate(r.f, 'month', e.target.value)} /></div>
                                  <div className="bg-white h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'year_short')} onChange={e=>updateDate(r.f, 'year', e.target.value)} /></div>
                                  <div className="bg-white h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'hour')} onChange={e=>updateDate(r.f, 'hour', e.target.value)} /></div>
                                  <div className="bg-white h-full relative"><input className={gridInput} value={formatDatePart(contractData[r.f], 'minute')} onChange={e=>updateDate(r.f, 'minute', e.target.value)} /></div>
                              </div>
                            ));
                        })()}
                        
                        {/* Retour Definitif (Manual/Empty) */}
                        <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-9 bg-black gap-[2px]">
                              <div className="bg-white h-full flex flex-col items-center justify-center font-bold text-[9px] text-black leading-none gap-0.5">
                                  <span>Retour D&eacute;finitif</span><span style={{fontFamily:'serif'}}>الرجوع النهائي</span>
                              </div>
                              <div className="bg-white h-full relative"></div>
                              <div className="bg-white h-full relative"></div>
                              <div className="bg-white h-full relative"></div>
                              <div className="bg-white h-full relative"></div>
                              <div className="bg-white h-full relative"></div>
                        </div>

                        <div className="grid grid-cols-[25%_1fr] h-8 bg-black gap-[2px]">
                            <div className="bg-white h-full flex flex-col items-center justify-center font-bold text-[9px] text-black leading-none gap-0.5">
                                <span>Durée</span><span style={{fontFamily:'serif'}}>المدة</span>
                            </div>
                            <div className="bg-white h-full relative"><input className={`${gridInput} font-black text-sm`} value={contractData.days} onChange={e=>setContractData({...contractData, days: e.target.value})} /></div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="pl-1">
                        <div className="font-bold text-[11px] mb-2 px-1 border-b border-black inline-block uppercase tracking-wide text-black">État au Départ</div>
                        <div className="flex gap-6 px-2 mb-2">
                            {/* Dommage */}
                            <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setContractData({...contractData, damage_type: 'damage'})}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 border-2 border-black flex items-center justify-center transition-all ${contractData.damage_type === 'damage' ? 'bg-black' : 'bg-white'}`}>
                                        {contractData.damage_type === 'damage' && <i className="bi bi-check text-white text-xs"></i>}
                                    </div>
                                    <span className="font-bold text-[11px] text-black group-hover:underline">Dommage</span>
                                </div>
                                <div className="text-[10px] leading-tight text-black pl-1 italic">
                                      Damage / Daño
                                </div>
                            </div>
                            
                            {/* Non Dommage */}
                            <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setContractData({...contractData, damage_type: 'none'})}>
                                <div className="flex items-center gap-2">
                                     <div className={`w-5 h-5 border-2 border-black flex items-center justify-center transition-all ${contractData.damage_type === 'none' ? 'bg-black' : 'bg-white'}`}>
                                         {contractData.damage_type === 'none' && <i className="bi bi-check text-white text-xs"></i>}
                                     </div>
                                     <span className="font-bold text-[11px] text-black group-hover:underline">Non Dommage</span>
                                </div>
                                <div className="text-[10px] leading-tight text-black pl-1 italic">
                                      No Damage / Sin Daño
                                </div>
                            </div>
                        </div>
                    </div>  
                  </div>

                  {/* Diagram & Comments */}
                  <div className="flex justify-center h-[80mm] print:h-[55mm] mb-1 print:mb-0 border-black transition-all">
                       
                       {/* Left: Car Diagram - Exploded View */}
                       <div className="w-full relative flex justify-center pt-2">
                           <span className="absolute top-1 left-2 font-black text-xl z-10 leading-none text-black">AR</span>
                           <span className="absolute bottom-1 left-2 font-black text-xl z-10 leading-none text-black">AV</span>
                           
                           {/* Exploded View Diagram */}
                           <svg viewBox="0 0 100 180" className="h-[95%] print:h-full w-full overflow-visible p-2" preserveAspectRatio="xMidYMid meet">
                                {/* Center - Roof/Cabin */}
                                <path d="M25,60 L75,60 L75,120 L25,120 Z" fill="none" stroke="black" strokeWidth="1.5" />
                                {/* Windshield Line */}
                                <path d="M25,120 Q50,125 75,120" fill="none" stroke="black" strokeWidth="1" />
                                {/* Rear Window Line */}
                                <path d="M25,60 Q50,55 75,60" fill="none" stroke="black" strokeWidth="1" />

                                {/* Top - Rear (Trunk/Bumper) */}
                                <path d="M30,55 L20,40 Q25,20 50,20 Q75,20 80,40 L70,55" fill="none" stroke="black" strokeWidth="1.5" />
                                <circle cx="30" cy="30" r="3" fill="none" stroke="black" strokeWidth="1" /> 
                                <circle cx="70" cy="30" r="3" fill="none" stroke="black" strokeWidth="1" />
                                <path d="M30,55 Q50,50 70,55" fill="none" stroke="black" strokeWidth="1" />
                                
                                {/* Bottom - Front (Hood/Bumper) */}
                                <path d="M30,125 L20,140 Q25,160 50,160 Q75,160 80,140 L70,125" fill="none" stroke="black" strokeWidth="1.5" />
                                <path d="M40,155 L60,155 L55,160 L45,160 Z" fill="none" stroke="black" strokeWidth="1" /> 
                                <path d="M30,125 Q50,130 70,125" fill="none" stroke="black" strokeWidth="1" />

                                {/* Left Side - Doors */}
                                <path d="M25,65 L10,65 Q5,90 10,115 L25,115" fill="none" stroke="black" strokeWidth="1.5" />
                                <line x1="10" y1="90" x2="25" y2="90" stroke="black" strokeWidth="1" />

                                {/* Right Side - Doors */}
                                <path d="M75,65 L90,65 Q95,90 90,115 L75,115" fill="none" stroke="black" strokeWidth="1.5" />
                                <line x1="90" y1="90" x2="75" y2="90" stroke="black" strokeWidth="1" />
                           </svg>
                       </div>

                       {/* Right: Comments List */}
                       {/* Comments List Removed */}
                  </div>

              </div>
          </div>
          
           {/* FOOTER SECTION: SIGNATURES */}
           <div className="mt-2 text-black px-1">
 
                {/* Signatures Row */}
                <div>
                    
                  
 
                    {/* Signatures Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-2 items-end px-2">
                        {/* Client 1 */}
                        <div className="flex flex-col items-center">
                            <div className="font-black text-sm text-black mb-3 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[1px] after:bg-black">Signature Client</div>
                            <div 
                                 className="w-full h-28 print:h-16 border-2 border-black rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-none transition-colors"
                                 onClick={() => setActiveSignField('client')}
                            >
                                 {signatures.client ? (
                                     <img src={signatures.client} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                 ) : (
                                     <div className="text-center text-gray-400 print:hidden">
                                         <i className="bi bi-pen text-2xl mb-1 block"></i>
                                         <span className="text-[10px]">Click to Sign</span>
                                     </div>
                                 )} 
                            </div>
                        </div>
                        
                        {/* Client 2 */}
                        <div className="flex flex-col items-center">
                            <div className="font-black text-sm text-black mb-3 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-4px] after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-[1px] after:bg-black">Signature Client</div>
                            <div 
                                 className="w-full h-28 print:h-16 border-2 border-black rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-none transition-colors"
                                 onClick={() => setActiveSignField('client2')}
                            >
                                 {signatures.client2 ? (
                                     <img src={signatures.client2} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                 ) : (
                                     <div className="text-center text-gray-400 print:hidden">
                                         <i className="bi bi-pen text-2xl mb-1 block"></i>
                                         <span className="text-[10px]">Click to Sign</span>
                                     </div>
                                 )}
                            </div>
                        </div>
 
                        {/* Agency */}
                        <div className="flex flex-col items-end">
                            <div className="font-bold text-[12px] italic mb-2 text-right w-full text-black">
                                Fait à Tanger le : <span className="inline-block min-w-[80px] border-b border-black px-1 text-center font-bold not-italic">
                                    {formatDatePart(contractData.start_date, 'day')}/{formatDatePart(contractData.start_date, 'month')}/{formatDatePart(contractData.start_date, 'year')}
                                </span>
                            </div>
                            
                            <div className="font-black text-xl tracking-[0.2em] text-black mb-1 text-center w-full uppercase">
                                Gibraltar
                            </div>
                            <div 
                                 className="w-full h-24 print:h-16 border-2 border-black rounded-lg cursor-pointer relative flex items-center justify-center hover:bg-gray-50 bg-white shadow-none transition-colors"
                                 onClick={() => setActiveSignField('agency')}
                            >
                                {signatures.agency ? (
                                    <img src={signatures.agency} alt="Signed" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <div className="text-center text-gray-400 print:hidden">
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