    'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { toBusinessInputString } from '@/lib/timezone';
import SignatureCanvas from 'react-signature-canvas';

export default function DeclarationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);

  // Data State
  const [data, setData] = useState({
     // Client
     name: '',
     cnie: '',
     license: '',
     address: '',
     city: 'Tanger', // Default based on context
     zip: '',
     
     // Car
     plate: '',
     
     // Dates
     start_date: '',
     start_time: '',
     return_date: '',
     return_time: '',

     // Signatures
     agency_signature: null as string | null,
     client_signature: null as string | null
  });

  const [activeSignField, setActiveSignField] = useState<'agency' | 'client' | null>(null);
  const sigCanvas = useRef<any>(null);

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
              const rental = await res.json();
              
              // Parse dates
              const start = new Date(rental.start_date);
              const end = new Date(rental.return_date);

              const formatDate = (d: Date) => {
                  const day = d.getDate().toString().padStart(2, '0');
                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
              };
              
              const formatTime = (d: Date) => {
                  const hours = d.getHours().toString().padStart(2, '0');
                  const mins = d.getMinutes().toString().padStart(2, '0');
                  return `${hours}:${mins}`;
              };

              setData(prev => ({
                  ...prev,
                  name: rental.client_name || '',
                  cnie: rental.passport_id || rental.client_id_number || '', // Fallback
                  license: rental.driving_license || '',
                  address: rental.client_address || '',
                  plate: rental.plate_number || '',
                  start_date: formatDate(start),
                  start_time: formatTime(start),
                  return_date: formatDate(end),
                  return_time: formatTime(end),
              }));
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleSaveSignature = () => {
    if (sigCanvas.current && activeSignField) {
        const dataURL = sigCanvas.current.getCanvas().toDataURL('image/png');
        setData(prev => ({...prev, [activeSignField === 'agency' ? 'agency_signature' : 'client_signature']: dataURL}));
        setActiveSignField(null);
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
  };
  
  const handlePrint = () => {
      window.print();
  };

  if (loading) return <div className="text-center p-5">Loading Declaration...</div>;

  // but looking at image, they are just lines or boxes. We will use simple border-b or boxes).
  // The image shows boxes for CNIE: | | | | ...
  
  // Replicating the form structure using the Image Overlay method
  return (
    <div className="bg-gray-100 min-h-screen py-12 print:py-0 print:bg-white text-black font-sans flex flex-col items-center">
         <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { background-color: white; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden { display: none !important; }
          
          /* Print Content Setup */
          .print-content {
              position: fixed;
              top: 0;
              left: 0;
              width: 210mm !important;
              height: 297mm !important;
              z-index: 9999;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden;
          }
           
           /* Ensure inputs print their values */
           input {
               font-family: inherit;
               background: transparent !important;
               border: none !important;
           }
        `}
      </style>

      {/* Toolbar */}
      <div className="container mx-auto max-w-[210mm] mt-4 mb-4 flex justify-between print-hidden px-4">
        <button onClick={() => router.back()} className="px-4 py-2 bg-gray-700 text-white rounded shadow text-sm">Return</button>
        <button onClick={handlePrint} className="px-4 py-2 bg-blue-700 text-white rounded shadow text-sm">Print Declaration</button>
      </div>

       {/* Form Container (A4) */}
       <div className="print-content bg-white shadow-2xl relative w-[210mm] h-[297mm] text-black text-[14px] font-bold font-sans overflow-hidden mx-auto">
            
            {/* Background Image */}
            <img 
                src="/declaration-bg.jpg" 
                alt="Declaration Form" 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none" 
            />

            {/* Inputs Overlay Layer */}
            <div className="absolute inset-0 w-full h-full text-[13px] font-bold">

                {/* Je soussigné (Full Name) */}
                <input 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})}
                    className="absolute top-[22%] left-[20%] w-[40%] h-[2.2%] bg-transparent border-none outline-none text-center uppercase"
                />

                {/* Nom (Surname) */}
                <input 
                    value={data.name.split(' ').slice(1).join(' ')} 
                    onChange={e => setData({...data, name: e.target.value})}
                    className="absolute top-[23.9%] left-[20%] w-[40%] h-[2.2%] bg-transparent border-none outline-none text-center uppercase"
                />

                {/* Prénom (Name) */}
                <input 
                    value={data.name.split(' ')[0]} 
                    onChange={e => setData({...data, name: e.target.value})}
                    className="absolute top-[26%] left-[20%] w-[40%] h-[2.2%] bg-transparent border-none outline-none text-center uppercase"
                />

                {/* CNIE (ID) */}
                <input 
                    value={data.cnie} 
                    onChange={e => setData({...data, cnie: e.target.value})}
                    className="absolute top-[30%] left-[34.8%] w-[60%] h-[2.2%] bg-transparent border-none outline-none text-left tracking-[1.1rem] font-mono pl-[3.8rem]"
                />

                {/* License */}
                <input 
                    value={data.license} 
                    onChange={e => setData({...data, license: e.target.value})}
                    className="absolute top-[32.0%] left-[33%] w-[60%] h-[2.2%] bg-transparent border-none outline-none text-left tracking-[1.1rem] font-mono pl-[0.8rem]"
                />

                {/* Address */}
                <input 
                    value={data.address} 
                    onChange={e => setData({...data, address: e.target.value})}
                    className="absolute top-[34.7%] left-[25%] w-[60%] h-[2.2%] bg-transparent border-none outline-none text-center"
                />

                {/* Ville */}
                <input 
                    value={data.city} 
                    onChange={e => setData({...data, city: e.target.value})}
                    className="absolute top-[36.4%] left-[25%] w-[60%] h-[2.2%] bg-transparent border-none outline-none text-center"
                />

                {/* Zip */}
                <input 
                    value={data.zip} 
                    onChange={e => setData({...data, zip: e.target.value})}
                    className="absolute top-[40.1%] left-[45%] w-[20%] h-[2.2%] bg-transparent border-none outline-none text-center tracking-[1em]"
                />

                {/* GSM */}
                <input 
                    className="absolute top-[42.8%] left-[40%] w-[40%] h-[2.2%] bg-transparent border-none outline-none text-center"
                />

                 {/* Email */}
                 <input 
                    className="absolute top-[45.5%] left-[40%] w-[40%] h-[2.2%] bg-transparent border-none outline-none text-center"
                />

               
                
                {/* Left Part: 12345 */}
                <input 
                    value={data.plate.split('-')[0]} 
                    readOnly
                    className="absolute top-[47.1%] left-[32%] w-[18%] h-[3%] bg-transparent border-none outline-none text-right tracking-[0.9rem] font-bold font-mono"
                />

                {/* Middle Part: Letter */}
                <input 
                    value={data.plate.split('-')[1]?.replace('/', '')} 
                    readOnly
                    className="absolute top-[47.1%] left-[54.5%] w-[4%] h-[3%] bg-transparent border-none outline-none text-center font-bold font-mono"
                />

                {/* Right Part: Region (40) */}
                <input 
                    value={data.plate.split('-')[2]} 
                    readOnly
                    className="absolute top-[48.1%] left-[61%] w-[10%] h-[3%] bg-transparent border-none outline-none text-left tracking-[0.9rem] font-bold font-mono pl-3"
                />
                
                {/* Agency Name */}
                 <div className="absolute top-[49.2%] left-[40%] w-[30%] text-center text-xs">
                     Narenos S.A.R.L
                </div>


                {/* Dates Section */}
                {/* Start Date */}
                <input 
                    value={data.start_date}
                    onChange={e => setData({...data, start_date: e.target.value})}
                    className="absolute top-[58.2%] left-[45%] w-[35%] h-[2%] bg-transparent border-none outline-none text-center tracking-widest text-sm"
                />
                 {/* Start Time */}
                <input 
                    value={data.start_time}
                    onChange={e => setData({...data, start_time: e.target.value})}
                    className="absolute top-[63.6%] left-[45%] w-[35%] h-[2%] bg-transparent border-none outline-none text-center tracking-widest text-sm"
                />

                 {/* Return Date */}
                 <input 
                    value={data.return_date}
                    onChange={e => setData({...data, return_date: e.target.value})}
                    className="absolute top-[66.2%] left-[45%] w-[35%] h-[2%] bg-transparent border-none outline-none text-center tracking-widest text-sm"
                />
                 {/* Return Time */}
                <input 
                    value={data.return_time}
                    onChange={e => setData({...data, return_time: e.target.value})}
                    className="absolute top-[71.6%] left-[45%] w-[35%] h-[2%] bg-transparent border-none outline-none text-center tracking-widest text-sm"
                />

                 {/* Fait a / Le */}
                 <div className="absolute top-[75.9%] left-[30%] w-[20%] text-center text-sm uppercase">Tanger</div>
                 <div className="absolute top-[78.6%] left-[30%] w-[20%] text-center text-sm uppercase">{data.start_date}</div>


                {/* Signatures */}
                {/* Agency Signature Box (Left) */}
                <div 
                    className="absolute top-[85%] left-[5%] w-[45%] h-[12%] cursor-pointer hover:bg-blue-50/20 flex items-center justify-center p-2"
                    onClick={() => setActiveSignField('agency')}
                >
                    {data.agency_signature ? (
                        <img src={data.agency_signature} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    ) : (
                        <div className="w-full h-full border-2 border-dashed border-transparent hover:border-gray-400 rounded transition-colors" />
                    )}
                </div>

                {/* Client Signature Box (Right) */}
                 <div 
                    className="absolute top-[85%] left-[50%] w-[45%] h-[12%] cursor-pointer hover:bg-blue-50/20 flex items-center justify-center p-2"
                    onClick={() => setActiveSignField('client')}
                >
                    {data.client_signature ? (
                        <img src={data.client_signature} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    ) : (
                        <div className="w-full h-full border-2 border-dashed border-transparent hover:border-gray-400 rounded transition-colors" />
                    )}
                </div>

            </div>
       </div>

          {/* Signature Modal */}
            {activeSignField && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm select-none print:hidden">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md animate-fade-in-up">
                      <h3 className="text-xl font-bold mb-4 text-center">
                          Sign Here <span className="text-blue-600">({activeSignField === 'agency' ? 'Agency' : 'Client'})</span>
                      </h3>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl mb-6 h-56 bg-gray-50 overflow-hidden relative group hover:border-blue-400 transition-colors">
                          <SignatureCanvas 
                              ref={sigCanvas} 
                              penColor="black"
                              backgroundColor="rgba(0,0,0,0)"
                              canvasProps={{className: 'w-full h-full cursor-crosshair'}} 
                          />
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

