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

  const [loading, setLoading] = useState(true);
  
  // Editable fields state
  const [contractData, setContractData] = useState({
    contract_number: '00001',
    // Car Details
    car_brand: '', 
    plate_number: '',
    fuel_type: 'Diesel',
    delivery_place: 'Tanger',
    return_place: 'Tanger',

    // Dates
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
        
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.return_date);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        setContractData(prev => ({
            ...prev,
            contract_number: data.rental_number || prev.contract_number,
            car_brand: data.car_model || '',
            plate_number: data.plate_number || '',
            client_name: data.client_name || '',
            cin: data.passport_id || '', 
            phone: data.client_phone || '',
            start_date: startDate,
            return_date: endDate,
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

  // Helper for date parts
  const formatDatePart = (date: any, part: 'day' | 'month' | 'year' | 'year_short' | 'hour' | 'minute') => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    switch (part) {
      case 'day': return d.getDate().toString().padStart(2, '0');
      case 'month': return (d.getMonth() + 1).toString().padStart(2, '0');
      case 'year': return d.getFullYear().toString(); // Full year
      case 'year_short': return d.getFullYear().toString().slice(-2);
      case 'hour': return d.getHours().toString().padStart(2, '0');
      case 'minute': return d.getMinutes().toString().padStart(2, '0');
      default: return '';
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center p-5 font-bold">Loading Contract...</div>;
  }

  // Styles
  const mainBorder = "border-[2px] border-[#4a4a4a] overflow-hidden"; // Outer box
  const colDivider = "border-r-[2px] border-[#4a4a4a]"; // Vertical divider
  
  // Tighter styles to prevent overflow
  const labelStyle = "text-[9px] font-bold text-[#4a4a4a] flex-shrink-0 w-24 truncate"; 
  const arabicLabelStyle = "text-[9px] font-bold text-[#4a4a4a] flex-shrink-0 w-24 text-right font-serif truncate";
  const inputStyle = "flex-grow min-w-0 bg-transparent border-b border-[#4a4a4a] border-dotted focus:border-blue-600 outline-none h-4 px-1 text-[10px] font-bold text-[#2d2d2d] text-center mx-1";
  
  const gridHeaderStyle = "border-r border-[#4a4a4a] h-full flex items-center justify-center font-bold text-[8px]";
  const gridCellStyle = "border-r border-[#4a4a4a] h-full relative";
  const gridInput = "w-full h-full text-center bg-transparent border-none outline-none text-[9px] font-bold absolute top-0 left-0 text-[#2d2d2d]";

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white text-[#4a4a4a] font-sans">
      
      {/* Action Bar */}
      <div className="container mx-auto max-w-[210mm] mt-10 flex justify-between print:hidden px-4">
        <button onClick={() => router.back()} className="px-3 py-1 bg-gray-700 text-white rounded shadow hover:bg-gray-800 text-sm flex items-center">
            <i className="bi bi-arrow-left mr-2"></i> Return
        </button>
        <button onClick={handlePrint} className="px-3 py-1 bg-blue-700 text-white rounded shadow hover:bg-blue-800 text-sm flex items-center">
            <i className="bi bi-printer mr-2"></i> Print A4 (Image Replica)
        </button>
      </div>

      {/* Contract A4 Container */}
      <div className="mx-auto bg-white shadow-xl print:shadow-none p-4 print:p-0 box-border relative" 
           style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}>
          
          {/* HEADER SECTION */}
          <div className="flex justify-between items-center pb-2 mb-2 text-[#4a4a4a]">
               {/* Left: French Info */}
               <div className="text-center w-[40%]">
                   <h1 className="text-2xl font-black uppercase tracking-tight mb-1 leading-none text-[#555555] m-0">NARENOS CAR</h1>
                   <p className="text-[10px] font-bold leading-tight m-0">Hay Lakesibate Rue 1 N° 13 - Tanger</p>
                   <p className="text-[10px] font-bold leading-tight m-0">GSM : 06 63 20 33 66 - 06 88 63 00 06</p>
               </div>

               {/* Center: Logo */}
               <div className="w-[20%] flex justify-center items-center">
                   <div className="relative transform scale-125">
                       <svg width="100" height="50" viewBox="0 0 140 60" className="overflow-visible">
                           {/* Hexagon Shape */}
                           <path d="M35,2 L105,2 L125,30 L105,58 L35,58 L15,30 Z" 
                                 fill="none" stroke="#555555" strokeWidth="3" strokeLinejoin="round" />
                           {/* Car & Text */}
                           <path d="M45,22 C45,22 55,10 70,10 C85,10 95,22 95,22 L100,22 L100,28 L40,28 L40,22 Z" fill="#555555" />
                           <path d="M42,28 L98,28 L98,33 L42,33 Z" fill="#555555" />
                           <circle cx="50" cy="33" r="3" fill="white" stroke="#555555" strokeWidth="1"/>
                           <circle cx="90" cy="33" r="3" fill="white" stroke="#555555" strokeWidth="1"/>
                           <text x="70" y="50" textAnchor="middle" 
                                 fontFamily="'Segoe UI', 'Brush Script MT', cursive" 
                                 fontSize="22" fontWeight="900" fontStyle="italic" fill="#555555"
                                 style={{textShadow: '2px 2px 0px white'}}
                           >Narenos</text>
                       </svg>
                   </div>
               </div>

               {/* Right: Arabic Info */}
               <div className="text-center w-[40%]" dir="rtl">
                   <h1 className="text-2xl font-black uppercase tracking-tight  leading-none text-[#555555] m-0" style={{fontFamily: 'serif'}}>كراء السيارات ترينوس</h1>
                   <p className="text-[11px] font-bold leading-none m-0">حي القصيبات زنقة 1 رقم 13 - طنجة</p>
                   <p className="text-[11px] font-bold leading-none m-0" dir="ltr">0688630006 - 0663203366 : الهاتف</p>
               </div>
          </div>
          
          {/* TITLE STRIP */}
          <div className="flex justify-center items-center gap-4 mb-2 text-[#555555]">
               <span className="font-black text-xl uppercase tracking-wider">CONTRAT DE LOCATION</span>
               <span className="font-black text-2xl" style={{fontFamily: 'serif'}}>عقد كراء السيارات</span>
          </div>

          {/* MAIN BODY: 2 COLUMN LAYOUT */}
          <div className={`${mainBorder} flex h-auto`}>
              
              {/* === LEFT COLUMN (55%) === */}
              <div className={`w-[55%] ${colDivider} p-2 flex flex-col`}>
                  
                  {/* CAR DETAILS - BOXED */}
                  <div className="border border-[#4a4a4a] p-2 mb-4">
                       {[
                         {l:"Marque :", a:"النوع :", k:"car_brand"},
                         {l:"N° Immatriculation :", a:"رقم التسجيل :", k:"plate_number"},
                         {l:"Lieu de Livraison :", a:"مكان التسليم :", k:"delivery_place"},
                         {l:"Lieu de Reprise :", a:"مكان الاسترجاع :", k:"return_place"}
                       ].map((r, i) => (
                         <div key={i} className="flex justify-between items-end w-full mb-2">
                             <span className="text-[10px] font-bold text-[#4a4a4a] flex-shrink-0 w-28 truncate">{r.l}</span>
                             <input className={inputStyle} value={(contractData as any)[r.k]} onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                             <span className="text-[10px] font-bold text-[#4a4a4a] flex-shrink-0 w-24 text-right font-serif truncate">{r.a}</span>
                         </div>
                       ))}
                  </div>

                  {/* LOCATAIRE */}
                  <div className="flex flex-col gap-1 pb-2 border-b-2 border-[#4a4a4a] mb-2">
                      <div className="flex justify-center items-center gap-4 font-black text-sm uppercase mb-2">
                          <span>LOCATAIRE</span> <span style={{fontFamily:'serif'}}>المكتري</span>
                      </div>
                      {[
                        {l:"Nom & Prénom :", a:"الإسم العائلي والشخصي :", k:"client_name"},
                        {l:"Date de naissance :", a:"تاريخ الازدياد :", k:"birth_date"},
                        {l:"Adresse au Maroc :", a:"العنوان بالمغرب :", k:"address_morocco"},
                        {l:"Adresse à l'Etranger :", a:"العنوان بالخارج :", k:"address_abroad"},
                        {l:"Permis de conduire N° :", a:"رخصة السياقة رقم :", k:"license_number"},
                        {l:"Date d'expiration :", a:"تاريخ الانتهاء :", k:"license_expiry"},
                        {l:"C.I.N :", a:"رقم البطاقة الوطنية :", k:"cin"},
                        {l:"Passeport N° :", a:"جواز السفر :", k:"passport"},
                        {l:"Date d'expiration :", a:"تاريخ الانتهاء :", k:"passport_expiry"},
                        {l:"Tél :", a:"الهاتف :", k:"phone"},
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between items-end w-full mb-2">
                             <span className={labelStyle}>{r.l}</span>
                             <input className={inputStyle} value={(contractData as any)[r.k]} onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                             <span className="text-[9px] font-bold text-[#4a4a4a] flex-shrink-0 w-32 text-right font-serif truncate">{r.a}</span>
                         </div>
                      ))}
                  </div>

                  {/* CONDUCTEUR SUPPLEMENTAIRE */}
                  <div className="flex flex-col gap-1 pt-1">
                      <div className="flex justify-between items-center px-4 font-black text-xs uppercase mb-2">
                          <span>Le Conducteur Supplémentaire</span> <span style={{fontFamily:'serif'}}>السائق المرخص</span>
                      </div>
                      {[
                        {l:"Nom & Prénom :", a:"الإسم العائلي والشخصي :", k:"second_driver_name"},
                        {l:"Permis de conduire N° :", a:"رخصة السياقة رقم :", k:"second_driver_license"},
                        {l:"Date d'expiration :", a:"تاريخ الانتهاء :", k:"second_driver_expiry"},
                        {l:"Passeport N° :", a:"رقم جواز السفر :", k:"second_driver_passport"},
                        {l:"C.I.N :", a:"رقم البطاقة الوطنية :", k:"second_driver_cin"},
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between items-end w-full">
                             <span className={labelStyle}>{r.l}</span>
                             <input className={inputStyle} value={(contractData as any)[r.k]} onChange={e => setContractData({...contractData, [r.k]: e.target.value})} />
                             <span className="text-[9px] font-bold text-[#4a4a4a] flex-shrink-0 w-32 text-right font-serif truncate">{r.a}</span>
                         </div>
                      ))}
                      <div className="flex justify-between items-end mt-2">
                             <span className={labelStyle}>Caution :</span>
                             <input className={inputStyle} value={contractData.deposit} onChange={e => setContractData({...contractData, deposit: e.target.value})} />
                             <span className="text-[9px] font-bold text-[#4a4a4a] flex-shrink-0 w-32 text-right font-serif truncate">ضمانة :</span>
                      </div>
                  </div>

              </div>

              {/* === RIGHT COLUMN (45%) === */}
              <div className="w-[45%] p-2 flex flex-col overflow-hidden">
                  
                  {/* Warning Text */}
                  <div className="text-[9px] text-right font-bold leading-tight m-0" dir="rtl" style={{fontFamily:'serif'}}>
                      <p>- بعد انتهاء صلاحية هذا العقد تعد السياقة غير قانونية ويعرض السائق للعقوبات الجاري بها العمل.</p>
                      <p>- لا يسمح لغير السائق المسجل في العقد سياقة هذه المركبة بدون حصول على إذن من الوكالة</p>
                  </div>

                  {/* Date Grid */}
                  <div className={`border-2 border-[#4a4a4a] mb-2`}>
                      <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-6 border-b-2 border-[#4a4a4a]">
                          <div className={gridHeaderStyle}></div>
                          <div className={gridHeaderStyle}>J</div>
                          <div className={gridHeaderStyle}>M</div>
                          <div className={gridHeaderStyle}>A</div>
                          <div className={gridHeaderStyle}>H</div>
                          <div className="h-full flex items-center justify-center font-bold text-[10px]">mn</div>
                      </div>
                      
                      {/* Helper to update date parts */}
                      {(() => {
                           const updateDate = (field: 'start_date' | 'return_date', part: 'day'|'month'|'year'|'hour'|'minute', val: string) => {
                               const date = new Date(contractData[field]);
                               const v = parseInt(val) || 0;
                               if (part === 'day') date.setDate(v);
                               if (part === 'month') date.setMonth(v - 1);
                               if (part === 'year') date.setFullYear(2000 + v); // Assuming short year input
                               if (part === 'hour') date.setHours(v);
                               if (part === 'minute') date.setMinutes(v);
                               setContractData({...contractData, [field]: date});
                           };

                           return [
                            {l:"Départ", a:"الانطلاق", f: 'start_date' as const},
                            {l:"Retour", a:"الرجوع", f: 'return_date' as const},
                           ].map((r, i) => (
                             <div key={i} className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-7 border-b border-[#4a4a4a] items-stretch">
                                <div className={`${gridHeaderStyle} flex-col !justify-center leading-[0.8]`}>
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
                      <div className="grid grid-cols-[25%_1fr_1fr_1fr_1fr_1fr] h-7 border-b border-[#4a4a4a] items-stretch">
                            <div className={`${gridHeaderStyle} flex-col !justify-center leading-[0.8]`}>
                                <span>Retour D&eacute;finitif</span><span style={{fontFamily:'serif'}}>الرجوع النهائي</span>
                            </div>
                            <div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className={gridCellStyle}></div><div className="h-full relative"></div>
                      </div>

                      <div className="grid grid-cols-[25%_1fr] h-6 items-stretch">
                          <div className={`${gridHeaderStyle} flex-col !justify-center leading-[0.8]`}>
                              <span>Durée</span><span style={{fontFamily:'serif'}}>المدة</span>
                          </div>
                          <div className="relative h-full"><input className={gridInput} value={contractData.days} onChange={e=>setContractData({...contractData, days: e.target.value})} /></div>
                      </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="mb-2 pl-2">
                      <div className="font-bold text-[10px] mb-2 px-2">Départ Avant de prendre la voiture</div>
                      <div className="flex gap-8 px-4 mb-2">
                           {/* Dommage */}
                           <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setContractData({...contractData, damage_type: 'damage'})}>
                               <div className="flex items-center gap-2">
                                   <span className="font-bold text-[10px]">Dommage</span>
                                   <div className={`w-5 h-5 border border-[#4a4a4a] ${contractData.damage_type === 'damage' ? 'bg-[#4a4a4a]' : 'bg-white'}`}></div>
                               </div>
                               <div className="text-[9px] leading-tight text-gray-600 pl-1">
                                    Damage<br/>Daño
                               </div>
                           </div>
                           
                           {/* Non Dommage */}
                           <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setContractData({...contractData, damage_type: 'none'})}>
                               <div className="flex items-center gap-2">
                                    <span className="font-bold text-[10px]">Non Dommage</span>
                                    <div className={`w-5 h-5 border border-[#4a4a4a] ${contractData.damage_type === 'none' ? 'bg-[#4a4a4a]' : 'bg-white'}`}></div>
                               </div>
                               <div className="text-[9px] leading-tight text-gray-600 pl-1">
                                    No Damage<br/>Sin Daño
                               </div>
                           </div>
                      </div>
                  </div>

                  {/* Diagram & Comments */}
                  <div className="flex gap-1 h-[90mm] overflow-hidden">
                       
                       {/* Left: Car Diagram - Exploded View */}
                       <div className="w-[45%] relative flex justify-center pt-2">
                           <span className="absolute top-0 left-0 font-black text-xl z-10 leading-none">AR</span>
                           <span className="absolute bottom-0 left-0 font-black text-xl z-10 leading-none">AV</span>
                           
                           {/* Exploded View Diagram */}
                           <svg viewBox="0 0 100 180" className="h-[95%] w-full overflow-visible">
                                {/* Center - Roof/Cabin */}
                                <path d="M25,60 L75,60 L75,120 L25,120 Z" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                                {/* Windshield Line */}
                                <path d="M25,120 Q50,125 75,120" fill="none" stroke="#4a4a4a" strokeWidth="1" />
                                {/* Rear Window Line */}
                                <path d="M25,60 Q50,55 75,60" fill="none" stroke="#4a4a4a" strokeWidth="1" />

                                {/* Top - Rear (Trunk/Bumper) */}
                                <path d="M30,55 L20,40 Q25,20 50,20 Q75,20 80,40 L70,55" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                                <circle cx="30" cy="30" r="3" fill="none" stroke="#4a4a4a" strokeWidth="1" /> 
                                <circle cx="70" cy="30" r="3" fill="none" stroke="#4a4a4a" strokeWidth="1" />
                                <path d="M30,55 Q50,50 70,55" fill="none" stroke="#4a4a4a" strokeWidth="1" />
                                
                                {/* Bottom - Front (Hood/Bumper) */}
                                <path d="M30,125 L20,140 Q25,160 50,160 Q75,160 80,140 L70,125" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                                <path d="M40,155 L60,155 L55,160 L45,160 Z" fill="none" stroke="#4a4a4a" strokeWidth="1" /> 
                                <path d="M30,125 Q50,130 70,125" fill="none" stroke="#4a4a4a" strokeWidth="1" />

                                {/* Left Side - Doors */}
                                <path d="M25,65 L10,65 Q5,90 10,115 L25,115" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                                <line x1="10" y1="90" x2="25" y2="90" stroke="#4a4a4a" strokeWidth="1" />

                                {/* Right Side - Doors */}
                                <path d="M75,65 L90,65 Q95,90 90,115 L75,115" fill="none" stroke="#4a4a4a" strokeWidth="1.5" />
                                <line x1="90" y1="90" x2="75" y2="90" stroke="#4a4a4a" strokeWidth="1" />
                           </svg>
                       </div>

                       {/* Right: Comments List */}
                       <div className="w-[55%] pt-2 pl-2">
                           <h3 className="font-bold text-sm mb-1 text-right">Commentaires</h3>
                           <p className="text-[8px] leading-tight mb-2 text-justify">
                               Positionner les Numeros à l'endroit précis du Dommage sur la matrice à droite.
                           </p>
                           <div className="flex flex-col gap-3">
                               {[0,1,2,3,4].map((i) => (
                                   <div key={i} className="flex gap-1 items-end w-full">
                                       <span className="font-bold text-[10px] w-3">{i+1}</span>
                                       <input className="flex-grow min-w-0 border-b border-[#4a4a4a] border-dotted bg-transparent outline-none text-[10px]" 
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
          <div className="mt-2 text-[#4a4a4a] px-1">

               {/* Row 1: Pre-payment & Prices */}
               <div className="flex justify-between items-center mb-3">
                   {/* Label Box - Pill Shape */}
                   <div className="w-[42%] border border-[#4a4a4a] rounded-[15px] h-12 flex flex-col justify-center px-4 shadow-sm">
                       <span className="font-bold text-base leading-none text-[#555555]">Pré-paiement</span>
                       <span className="font-bold text-base leading-none text-[#999999]">Prépayement</span>
                   </div>
                   
                   {/* Price Inputs */}
                   <div className="w-[56%] flex gap-3">
                       {[
                           {l:'Total', sub:'Total', k:'total'},
                           {l:'Avance', sub:'Avance', k:'advance'},
                           {l:'Reste', sub:'Rest', k:'remaining'},
                       ].map((item, i) => (
                           <div key={i} className="flex-1 border border-[#4a4a4a] h-12 relative">
                               <div className="absolute top-1 left-1 text-[9px] font-bold leading-none">{item.l}</div>
                               <div className="absolute bottom-1 left-1 text-[9px] font-bold leading-none text-gray-500">{item.sub}</div>
                               <input className="w-full h-full text-right font-bold bg-transparent outline-none text-sm px-2 pt-2" 
                                      value={(contractData as any)[item.k]}
                                      onChange={e => setContractData({...contractData, [item.k]: e.target.value})} />
                           </div>
                       ))}
                   </div>
               </div>

               {/* Row 2: Payment Method */}
               <div className="flex justify-between items-center mb-4">
                   {/* Label Box - Pill Shape */}
                   <div className="w-[38%] border border-[#4a4a4a] rounded-[15px] h-12 flex flex-col justify-center px-4 shadow-sm">
                       <span className="font-bold text-base leading-none text-[#555555]">Mode de paiement</span>
                       <span className="font-bold text-base leading-none text-[#999999]">Payment method</span>
                   </div>

                   {/* Checkboxes */}
                   <div className="w-[60%] flex gap-4 pl-1">
                       {[
                           {l:'En espèces', sub:'Cash', val:'cash'},
                           {l:'Chèque', sub:'Check', val:'check'},
                           {l:'Carte', sub:'TPE', val:'card'},
                       ].map((m, i) => (
                           <div key={i} className="flex items-center justify-end gap-2 flex-1 cursor-pointer" onClick={() => setContractData({...contractData, payment_method: m.val})}>
                               <div className="text-right leading-[0.9]">
                                   <div className="font-bold text-[10px] text-[#4a4a4a]">{m.l}</div>
                                   <div className="text-[10px] text-gray-500">{m.sub}</div>
                               </div>
                               <div className={`w-5 h-5 border border-[#4a4a4a] flex-shrink-0 ${contractData.payment_method === m.val ? 'bg-[#4a4a4a]' : 'bg-white'}`}></div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Row 3: Legal & Signatures */}
               <div className="mt-1 relative">
                   
                   {/* Top Text Row */}
                   <div className="flex items-start mb-8">
                       <div className="text-[9px] leading-[1.1] text-justify w-[35%] tracking-tighter">
                           Je reconnais avoir pris connaissance des présentes<br/>
                           conditions générales (recto et verso)<br/>
                           que je m'engage à les respecter.
                       </div>

                       <div className="text-center w-[65%] pl-4">
                            <p className="font-bold text-[11px] leading-tight m-0">Observation : En cas d'accident ou de vol, je m'engage à régler la valeur de la franchise.</p>
                            <p className="font-bold text-[11px] leading-tight m-0">avec présentation du P.V</p>
                       </div>
                   </div>

                   {/* Signatures Row */}
                   <div className="flex items-end justify-between px-2">
                       <div className="font-black text-sm text-[#4a4a4a]">Signature Client</div>
                       
                       <div className="font-black text-sm text-[#4a4a4a]">Signature Client</div>

                       <div className="font-bold text-[11px] italic pb-1">
                           Fait à Tanger le : _________________
                       </div>
                       
                       <div className="font-black text-xl tracking-widest text-[#4a4a4a]">
                           NARENOS
                       </div>
                   </div>
               </div>

          </div>
      </div>
    </div>
  );
}
