
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationCircleIcon, 
  MapPinIcon, 
  UserCircleIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  CameraIcon,
  IdentificationIcon,
  CheckBadgeIcon,
  BookmarkSquareIcon,
  MicrophoneIcon,
  SignalIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { Language, TRANSLATIONS, EmergencyContact, MedicalID, CrashSeverity } from './types';
import { generateEmergencySpeech } from './gemini';

// Custom Motorcycle Icon
const MotorcycleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="5" cy="18" r="3" />
    <circle cx="19" cy="18" r="3" />
    <path d="M10 18H7" />
    <path d="M14 18h3" />
    <path d="M8 8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    <path d="M16 18l-1.3-3.2" />
    <path d="M8 18l1.3-3.2" />
    <path d="M13 10l-2-7h-3" />
    <path d="M14.7 14.8l-1.7-4.8H11" />
    <path d="M9.3 14.8l1.7-4.8" />
  </svg>
);

export default function App() {
  const [language, setLanguage] = useState<Language>('EN');
  const [isRiding, setIsRiding] = useState(false);
  const [isCrashDetected, setIsCrashDetected] = useState(false);
  const [crashSeverity, setCrashSeverity] = useState<CrashSeverity>('Medium');
  const [isRecording, setIsRecording] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'dashcam' | 'medical'>('dashboard');
  const [coords, setCoords] = useState<{lat: number, lng: number, speed: number} | null>(null);
  const [highwayInfo, setHighwayInfo] = useState<string>("KM 254.3 PLUS North-South Expressway (Near Seremban)");
  
  const [isRinoListening, setIsRinoListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: '1', name: 'Emergency Services (999)', phone: '999', priority: 1 },
    { id: '2', name: 'Wife', phone: '+60123456789', priority: 2 },
    { id: '3', name: 'Insurance Hotline', phone: '+6018882221', priority: 3 },
    { id: '4', name: 'Brother', phone: '+60199998888', priority: 4 }
  ]);
  
  const [medicalId, setMedicalId] = useState<MedicalID>({
    fullName: 'John Rider',
    icNumber: '950101-14-5555',
    isIcVerified: true,
    bloodType: 'O+',
    allergies: 'Penicillin',
    medications: 'None',
    conditions: 'None',
    vehicleBrand: 'Honda CBR500R',
    vehicleColor: 'Matte Black',
    licensePlate: 'ABC 1234',
    personalPhoto: undefined
  });

  const t = TRANSLATIONS[language];
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const speedKmh = (position.coords.speed || 0) * 3.6;
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: speedKmh
        });
        if (speedKmh > 15 && !isRiding) setIsRiding(true);
      }, (err) => console.error(err), { enableHighAccuracy: true });
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isRiding]);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = language === 'EN' ? 'en-US' : language === 'CN' ? 'zh-CN' : 'ms-MY';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (transcript.includes("call") || transcript.includes("打给") || transcript.includes("panggil")) {
          const contact = contacts.find(c => transcript.includes(c.name.toLowerCase()));
          if (contact) {
            setVoiceFeedback(`Calling ${contact.name}...`);
            window.open(`tel:${contact.phone}`);
          }
        } else if (transcript.includes("cancel") || transcript.includes("取消") || transcript.includes("batal")) {
          cancelCrash();
        }
      };
      recognitionRef.current.onstart = () => setIsRinoListening(true);
      recognitionRef.current.onend = () => setIsRinoListening(false);
    }
  }, [contacts, language]);

  const toggleRino = () => {
    if (isRinoListening) recognitionRef.current?.stop();
    else {
      recognitionRef.current?.start();
      setVoiceFeedback("Hi Rino is listening...");
    }
  };

  const startVideoRecording = async () => {
    try {
      if (!streamRef.current) streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) videoChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a'); a.href = url; a.download = `crash_evidence_${Date.now()}.mp4`; a.click();
        setIsRecording(false);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { console.error(err); }
  };

  const triggerCrash = useCallback((severity: CrashSeverity = 'Medium') => {
    setCrashSeverity(severity);
    setIsCrashDetected(true);
    setCountdown(30);
    if (autoSaveEnabled) {
      startVideoRecording();
      setTimeout(() => { if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop(); }, 15000);
    }
    if (window.navigator.vibrate) window.navigator.vibrate([1000, 500, 1000, 500, 1000]);
  }, [autoSaveEnabled]);

  useEffect(() => {
    if (isCrashDetected && countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(prev => prev - 1), 1000);
    } else if (countdown === 0 && isCrashDetected) {
      handleEmergencySequence();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCrashDetected, countdown]);

  const handleEmergencySequence = async () => {
    const msg = `EMERGENCY ALERT. Automated call from RiderShield. 
      Rider: ${medicalId.fullName}. IC Number: ${medicalId.icNumber}. 
      Vehicle: ${medicalId.vehicleColor} ${medicalId.vehicleBrand}, License Plate: ${medicalId.licensePlate}. 
      Location: Latitude ${coords?.lat}, Longitude ${coords?.lng}. Nearby Highway: ${highwayInfo}. 
      IMPACT SEVERITY: ${crashSeverity} level collision detected. 
      STATUS: Rider is UNRESPONSIVE. Immediate medical rescue required.`;
    
    await generateEmergencySpeech(msg);
    
    const primaryContacts = contacts.filter(c => c.priority <= 4).sort((a, b) => a.priority - b.priority);
    for (const contact of primaryContacts) {
      console.log(`SEQUENTIAL DIALING: ${contact.priority}. ${contact.name} (${contact.phone})`);
    }
    setIsCrashDetected(false);
  };

  const cancelCrash = () => {
    setIsCrashDetected(false);
    setCountdown(30);
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMedicalId(prev => ({ ...prev, personalPhoto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-[#FDFBF7] shadow-xl relative flex flex-col text-slate-800">
      <header className="p-4 flex items-center justify-between border-b border-sand bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center shadow-sm">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sage rounded-full border-2 border-white flex items-center justify-center">
              <MotorcycleIcon className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 ml-1">RiderShield</h1>
            {isRiding && <div className="flex items-center gap-1 text-[8px] uppercase font-bold text-sage ml-1 animate-pulse"><SignalIcon className="w-2 h-2"/> {t.monitoring}</div>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleRino} className={`p-2 rounded-full transition-all ${isRinoListening ? 'bg-terracotta text-white' : 'bg-sand text-slate-500'}`}>
            <MicrophoneIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setLanguage(language === 'EN' ? 'CN' : language === 'CN' ? 'BM' : 'EN')} className="px-3 py-1 bg-sand rounded-full text-xs font-semibold uppercase">{language}</button>
        </div>
      </header>

      {isRinoListening && (
        <div className="absolute top-16 left-0 right-0 z-50 p-2 bg-terracotta text-white text-[10px] font-bold uppercase text-center animate-bounce">
          {voiceFeedback || t.rinoActive}
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'dashboard' && <Dashboard t={t} isRiding={isRiding} setIsRiding={setIsRiding} triggerCrash={triggerCrash} coords={coords} highwayInfo={highwayInfo} />}
        {activeTab === 'contacts' && <Contacts t={t} contacts={contacts} setContacts={setContacts} />}
        {activeTab === 'dashcam' && <DashcamView t={t} isRecording={isRecording} onRecordToggle={() => isRecording ? cancelCrash() : startVideoRecording()} autoSave={autoSaveEnabled} onAutoSaveToggle={() => setAutoSaveEnabled(!autoSaveEnabled)} speed={coords?.speed || 0} />}
        {activeTab === 'medical' && <MedicalSection t={t} medicalId={medicalId} setMedicalId={setMedicalId} onPhotoUpload={handlePhotoUpload} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-sand flex justify-around p-3 pb-6 shadow-2xl z-20">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<ShieldCheckIcon className="w-6 h-6" />} label="Safety" />
        <NavButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<PhoneIcon className="w-6 h-6" />} label="Contacts" />
        <NavButton active={activeTab === 'dashcam'} onClick={() => setActiveTab('dashcam')} icon={<VideoCameraIcon className="w-6 h-6" />} label="Dashcam" />
        <NavButton active={activeTab === 'medical'} onClick={() => setActiveTab('medical')} icon={<UserCircleIcon className="w-6 h-6" />} label="Profile" />
      </nav>

      {isCrashDetected && (
        <div className="fixed inset-0 z-50 bg-terracotta flex flex-col items-center justify-center p-8 text-white text-center">
          <div className="flex items-center gap-2 mb-4 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">
            <span className="text-xs font-black uppercase tracking-widest">{t.severity}: {crashSeverity}</span>
          </div>
          <ExclamationTriangleIcon className="w-24 h-24 mb-6 animate-bounce" />
          <h2 className="text-4xl font-black mb-2 uppercase">{t.crashDetected}</h2>
          <p className="text-xl opacity-90 mb-2">{t.cancelPrompt} {countdown}s</p>
          <p className="text-sm font-bold opacity-70 mb-8 uppercase tracking-widest">{t.unresponsive}</p>
          <button onClick={cancelCrash} className="w-full py-6 bg-white text-terracotta text-2xl font-bold rounded-2xl uppercase shadow-2xl active:scale-95 transition-all">{t.iamOk}</button>
        </div>
      )}
    </div>
  );
}

const Dashboard = ({ t, isRiding, setIsRiding, triggerCrash, coords, highwayInfo }: any) => (
  <div className="space-y-6">
    <div className="flex flex-col items-center justify-center py-10">
      <div className={`relative w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isRiding ? 'border-sage bg-sage/5' : 'border-slate-200 bg-slate-50'}`}>
        {isRiding && <div className="absolute inset-0 rounded-full border-4 border-sage pulse-monitoring" />}
        <div className="text-center">
          <MotorcycleIcon className={`w-16 h-16 mx-auto ${isRiding ? 'text-sage animate-pulse' : 'text-slate-300'}`} />
          <p className={`font-bold mt-2 uppercase tracking-widest ${isRiding ? 'text-sage' : 'text-slate-400'}`}>{isRiding ? t.monitoring : t.driveSafe}</p>
        </div>
        <div className="absolute -bottom-2 bg-white px-4 py-1 rounded-full border border-sand shadow-sm text-[10px] font-black text-slate-600">
          {Math.round(coords?.speed || 0)} KM/H
        </div>
      </div>
    </div>
    <div className="bg-white p-4 rounded-3xl border border-sand shadow-sm flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-500">
        <MapPinIcon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{t.highwayInfo}</span>
      </div>
      <p className="text-sm font-bold text-slate-800">{highwayInfo}</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <button onClick={() => setIsRiding(!isRiding)} className={`py-5 rounded-3xl font-bold text-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-3 ${isRiding ? 'bg-terracotta text-white' : 'bg-sage text-white'}`}>
        <MotorcycleIcon className="w-5 h-5" />
        {isRiding ? t.stopRide : t.startRide}
      </button>
      <button onClick={() => triggerCrash('High')} className="py-5 rounded-3xl font-bold text-lg bg-white border border-sand text-slate-600 shadow-md active:scale-95 flex items-center justify-center gap-3">
        <ExclamationCircleIcon className="w-5 h-5 text-terracotta" />
        {t.testCrash}
      </button>
    </div>
    <button className="w-full p-8 rounded-[40px] bg-terracotta text-white flex flex-col items-center gap-2 shadow-lg active:scale-95 transition-all" onDoubleClick={() => triggerCrash('High')}>
      <span className="text-3xl font-black tracking-widest">{t.sos}</span>
      <span className="text-[10px] uppercase font-bold opacity-75">Double Tap for help</span>
    </button>
  </div>
);

const DashcamView = ({ t, isRecording, onRecordToggle, autoSave, onAutoSaveToggle, speed }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    async function setup() {
      if (videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        videoRef.current.srcObject = stream;
      }
    }
    setup();
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="space-y-4">
      <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4 text-white text-xs font-black drop-shadow-md">{Math.round(speed)} KM/H</div>
        <div className="absolute bottom-4 right-4 text-white text-[10px] font-mono drop-shadow-md text-right">{now.toLocaleTimeString()}<br/>{now.toLocaleDateString()}</div>
        {isRecording && <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-600 px-2 py-1 rounded text-[8px] font-black text-white animate-pulse">REC</div>}
        <button onClick={onRecordToggle} className={`absolute bottom-12 left-1/2 -translate-x-1/2 p-6 rounded-full border-2 border-white/50 backdrop-blur-sm transition-all active:scale-90 ${isRecording ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}><VideoCameraIcon className="w-8 h-8" /></button>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-sand flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3"><BookmarkSquareIcon className="w-6 h-6 text-sage" /><span className="text-sm font-bold text-slate-700">{t.autoSave}</span></div>
        <button onClick={onAutoSaveToggle} className={`w-12 h-6 rounded-full relative transition-colors ${autoSave ? 'bg-sage' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoSave ? 'right-1' : 'left-1'}`} /></button>
      </div>
    </div>
  );
};

const Contacts = ({ t, contacts, setContacts }: any) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const add = () => { if(name && phone) { setContacts([...contacts, { id: Date.now().toString(), name, phone, priority: contacts.length + 1 }]); setName(''); setPhone(''); } };
  const setPriority = (id: string, newP: number) => {
    const updated = contacts.map((c: any) => c.id === id ? { ...c, priority: newP } : c);
    setContacts(updated.sort((a:any, b:any) => a.priority - b.priority));
  };
  const primaryContacts = contacts.filter((c: any) => c.priority <= 4).sort((a: any, b: any) => a.priority - b.priority);
  const otherContacts = contacts.filter((c: any) => c.priority > 4).sort((a: any, b: any) => a.priority - b.priority);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{t.emergencyContacts}</h2><div className="bg-sand px-3 py-1 rounded-full flex items-center gap-1"><ArrowsUpDownIcon className="w-3 h-3 text-terracotta" /><span className="text-[10px] font-black uppercase text-terracotta">{t.dialOrder} (1-4)</span></div></div>
      <div className="space-y-3">
        {primaryContacts.map((c: any) => (
          <div key={c.id} className="bg-white p-4 rounded-2xl border-2 border-sage/20 flex justify-between items-center shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sage"></div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-sage text-white rounded-full flex items-center justify-center font-black text-sm">{c.priority}</div><div><p className="font-bold text-slate-700">{c.name}</p><p className="text-xs text-slate-400">{c.phone}</p></div></div>
            <div className="flex gap-2">
              {c.phone !== '999' && <select className="bg-sand text-[10px] font-bold p-1 rounded outline-none" value={c.priority} onChange={(e) => setPriority(c.id, parseInt(e.target.value))}>{[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}</select>}
              {c.phone !== '999' && <button onClick={() => setContacts(contacts.filter((x:any) => x.id !== c.id))} className="text-slate-300"><TrashIcon className="w-5 h-5"/></button>}
            </div>
          </div>
        ))}
      </div>
      {otherContacts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 py-2"><div className="h-px flex-1 bg-sand"></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{t.otherContacts}</span><div className="h-px flex-1 bg-sand"></div></div>
          {otherContacts.map((c: any) => (
            <div key={c.id} className="bg-white/60 p-4 rounded-2xl border border-sand flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3"><div className="w-8 h-8 bg-sand rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">#</div><div><p className="font-bold text-slate-500">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div></div>
              <div className="flex gap-2"><button className="bg-sand text-[10px] font-bold px-2 py-1 rounded" onClick={() => setPriority(c.id, 4)}>Move Up</button><button onClick={() => setContacts(contacts.filter((x:any) => x.id !== c.id))} className="text-slate-200"><TrashIcon className="w-4 h-4"/></button></div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-sand/30 p-4 rounded-3xl border border-sand space-y-3">
        <p className="text-[10px] font-black uppercase text-slate-400">Add Emergency Contact</p>
        <div className="flex gap-2"><input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="flex-1 p-3 rounded-xl text-xs border-none shadow-sm outline-none" /><input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 p-3 rounded-xl text-xs border-none shadow-sm outline-none" /><button onClick={add} className="px-4 bg-slate-800 text-white rounded-xl active:scale-90 transition-all"><PlusIcon className="w-5 h-5"/></button></div>
      </div>
    </div>
  );
};

const MedicalSection = ({ t, medicalId, setMedicalId, onPhotoUpload }: any) => {
  const update = (f: keyof MedicalID, v: any) => setMedicalId({ ...medicalId, [f]: v });
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-28 h-28 rounded-3xl bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center group">
          {medicalId.personalPhoto ? <img src={medicalId.personalPhoto} className="w-full h-full object-cover" alt="Profile" /> : <CameraIcon className="w-10 h-10 text-slate-300" />}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><CameraIcon className="w-6 h-6 text-white" /></div>
          <input type="file" accept="image/*" onChange={onPhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <div className="text-center"><h2 className="text-xl font-bold text-slate-800">{medicalId.fullName}</h2><div className="flex items-center gap-1 justify-center mt-1"><CheckBadgeIcon className={`w-4 h-4 ${medicalId.isIcVerified ? 'text-sage' : 'text-slate-300'}`} /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{medicalId.isIcVerified ? t.verified : t.icVerify}</span></div></div>
      </div>
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-sand shadow-sm space-y-4">
          <MedicalField label="IC Number / MyKad" value={medicalId.icNumber} onChange={(v:any) => update('icNumber', v)} />
          <div className="grid grid-cols-2 gap-4"><MedicalField label="Blood Type" value={medicalId.bloodType} onChange={(v:any) => update('bloodType', v)} /><MedicalField label="Allergies" value={medicalId.allergies} onChange={(v:any) => update('allergies', v)} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-sand shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2"><MotorcycleIcon className="w-5 h-5 text-sage"/> <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.vehicleInfo}</span></div>
          <MedicalField label="License Plate" value={medicalId.licensePlate} onChange={(v:any) => update('licensePlate', v)} />
          <div className="grid grid-cols-2 gap-4"><MedicalField label="Brand / Model" value={medicalId.vehicleBrand} onChange={(v:any) => update('vehicleBrand', v)} /><MedicalField label="Vehicle Color" value={medicalId.vehicleColor} onChange={(v:any) => update('vehicleColor', v)} /></div>
        </div>
      </div>
    </div>
  );
};

const MedicalField = ({ label, value, onChange }: any) => (
  <div className="space-y-1"><label className="text-[8px] uppercase font-black text-slate-400 tracking-widest">{label}</label><input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full text-sm font-bold bg-transparent border-b border-sand focus:border-terracotta outline-none pb-1 transition-all" /></div>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all flex-1 ${active ? 'text-terracotta scale-110' : 'text-slate-400'}`}><div className="flex flex-col items-center">{icon}<span className="text-[8px] font-black uppercase tracking-widest">{label}</span></div></button>
);
