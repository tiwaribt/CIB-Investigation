import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  User, 
  Languages, 
  FileText, 
  Mic, 
  Upload, 
  Phone, 
  Mail, 
  Globe,
  Loader2,
  Volume2,
  ArrowRightLeft,
  Shield,
  Database,
  Activity,
  Eye,
  FileSearch,
  Users,
  Save,
  Trash2,
  AlertTriangle,
  Scan,
  Radio
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  searchWithImage, 
  osintSearch, 
  translateAndSpeak, 
  textToSpeech, 
  generateText,
  compareFaces,
  criminalRecordSearch,
  geointSearch,
  cyberTrace
} from './services/gemini';
import { extractTextFromPDF, fileToBase64 } from './utils/fileProcessing';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'face' | 'osint' | 'compare' | 'records' | 'database' | 'cases' | 'translate' | 'geoint' | 'cyber' | 'comms';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('face');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);
  const [suspects, setSuspects] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSuspects();
    fetchCases();
  }, []);

  const fetchSuspects = async () => {
    try {
      const res = await fetch('/api/suspects');
      const data = await res.json();
      setSuspects(data);
    } catch (error) {
      console.error("Failed to fetch database", error);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      setCases(data);
    } catch (error) {
      console.error("Failed to fetch cases", error);
    }
  };

  const createCase = async (title: string, description: string) => {
    try {
      await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });
      fetchCases();
    } catch (error) {
      console.error(error);
    }
  };

  const saveSuspect = async () => {
    if (!result || !result.text) return;
    try {
      await fetch('/api/suspects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Unknown Subject",
          photo_url: previewUrl,
          details: result.text,
          social_links: result.grounding || []
        })
      });
      fetchSuspects();
      // Using a custom notification would be better, but for now just updating the text
      console.log("Subject indexed to CIB Database.");
    } catch (error) {
      console.error(error);
    }
  };

  const playAudio = (base64: string) => {
    const url = `data:audio/wav;base64,${base64}`;
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const handleFaceSearch = async (file: File) => {
    setLoading(true);
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const base64 = await fileToBase64(file);
      const data = await searchWithImage(base64, file.type);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: "Forensic search failed. Connection unstable." });
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (file1: File, file2: File) => {
    setLoading(true);
    setResult(null);
    try {
      const b1 = await fileToBase64(file1);
      const b2 = await fileToBase64(file2);
      const data = await compareFaces(b1, b2);
      setResult({ text: data });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriminalSearch = async (name: string, details: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await criminalRecordSearch(name, details);
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOsintSearch = async (query: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await osintSearch(query);
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: "OSINT search failed. Network timeout or invalid query." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020C1B] text-[#CCD6F6] font-sans selection:bg-[#64FFDA]/30 crt intel-grid relative">
      <div className="watermark">CLASSIFIED</div>
      
      <div className="flex h-screen relative z-10">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-[#0A192F] border-r border-[#233554] flex flex-col shadow-2xl">
          <div className="p-8 border-b border-[#233554] bg-[#020C1B]/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#64FFDA]/10 rounded-sm border border-[#64FFDA]/20">
                <Shield className="text-[#64FFDA]" size={24} />
              </div>
              <div>
                <h1 className="font-black tracking-tighter text-xl text-white leading-none">CIB</h1>
                <span className="text-[8px] uppercase tracking-[0.4em] text-[#64FFDA]/60 font-bold">Intelligence</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="h-1 w-1 rounded-full bg-[#64FFDA] animate-pulse" />
              <span className="intel-label text-[8px]">System Status: Operational</span>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
            <div className="pb-2">
              <span className="intel-label px-2 opacity-50">Biometrics</span>
            </div>
            <NavButton icon={<Scan size={18} />} label="Facial Analysis" active={activeTab === 'face'} onClick={() => setActiveTab('face')} />
            <NavButton icon={<Users size={18} />} label="Face Comparison" active={activeTab === 'compare'} onClick={() => setActiveTab('compare')} />
            
            <div className="pt-6 pb-2">
              <span className="intel-label px-2 opacity-50">Intelligence</span>
            </div>
            <NavButton icon={<Search size={18} />} label="Digital Trace" active={activeTab === 'osint'} onClick={() => setActiveTab('osint')} />
            <NavButton icon={<Globe size={18} />} label="GEOINT Satellite" active={activeTab === 'geoint'} onClick={() => setActiveTab('geoint')} />
            <NavButton icon={<Activity size={18} />} label="Cyber Trace" active={activeTab === 'cyber'} onClick={() => setActiveTab('cyber')} />
            <NavButton icon={<Radio size={18} />} label="Satellite Comms" active={activeTab === 'comms'} onClick={() => setActiveTab('comms')} />
            <NavButton icon={<FileSearch size={18} />} label="Agency Records" active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
            
            <div className="pt-6 pb-2">
              <span className="intel-label px-2 opacity-50">Archives</span>
            </div>
            <NavButton icon={<Database size={18} />} label="Subject Registry" active={activeTab === 'database'} onClick={() => setActiveTab('database')} />
            <NavButton icon={<FileText size={18} />} label="Case Files" active={activeTab === 'cases'} onClick={() => setActiveTab('cases')} />
            
            <div className="pt-6 pb-2">
              <span className="intel-label px-2 opacity-50">Communications</span>
            </div>
            <NavButton icon={<Languages size={18} />} label="Linguistic Intel" active={activeTab === 'translate'} onClick={() => setActiveTab('translate')} />
          </nav>

          <div className="p-6 border-t border-[#233554] bg-[#020C1B]/30">
            <div className="intel-card p-4 bg-[#0A192F]/50">
              <div className="flex items-center justify-between mb-3">
                <span className="intel-label text-[9px]">Uplink Load</span>
                <span className="intel-value text-[10px]">92.4%</span>
              </div>
              <div className="w-full h-1 bg-[#020C1B] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92.4%' }}
                  className="h-full bg-[#64FFDA]" 
                />
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[7px] text-[#495670] font-mono">SECURE_TUNNEL_01</span>
                <span className="text-[7px] text-[#64FFDA] font-mono">ENCRYPTED</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#020C1B]">
          <header className="h-20 border-b border-[#233554] bg-[#0A192F]/40 backdrop-blur-xl flex items-center justify-between px-10 relative z-20">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Activity className="text-[#64FFDA]" size={20} />
                <div className="h-4 w-[1px] bg-[#233554]" />
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
                  {activeTab === 'face' && 'Biometric Identification Protocol'}
                  {activeTab === 'compare' && 'Forensic Comparison Matrix'}
                  {activeTab === 'osint' && 'Digital Footprint Analysis'}
                  {activeTab === 'geoint' && 'Geospatial Satellite Intelligence'}
                  {activeTab === 'cyber' && 'Cyber Network Trace'}
                  {activeTab === 'comms' && 'Satellite Uplink Communication'}
                  {activeTab === 'records' && 'Federal Record Index'}
                  {activeTab === 'database' && 'Subject Registry Access'}
                  {activeTab === 'cases' && 'Investigation Management'}
                  {activeTab === 'translate' && 'Cross-Border Intel Decryption'}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex flex-col items-end">
                <span className="intel-label text-[8px]">Current Node</span>
                <span className="text-[10px] font-mono text-[#64FFDA]">DC-METRO-HUB-09</span>
              </div>
              <div className="h-8 w-[1px] bg-[#233554]" />
              <div className="flex items-center gap-3">
                <span className="intel-label">Clearance:</span>
                <div className="px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-black rounded-sm border border-red-500/30 tracking-widest">
                  LEVEL 5 / TOP SECRET
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto"
              >
                {activeTab === 'face' && <FaceView onSearch={handleFaceSearch} loading={loading} />}
                {activeTab === 'compare' && <CompareView onCompare={handleCompare} loading={loading} preview1={previewUrl} preview2={previewUrl2} setP1={setPreviewUrl} setP2={setPreviewUrl2} />}
                {activeTab === 'osint' && <OsintView onSearch={handleOsintSearch} loading={loading} />}
                {activeTab === 'records' && <RecordsView onSearch={handleCriminalSearch} loading={loading} />}
                {activeTab === 'database' && <DatabaseView suspects={suspects} />}
                {activeTab === 'cases' && <CasesView cases={cases} onCreate={createCase} />}
                {activeTab === 'geoint' && <GeointView onSearch={async (q) => { setLoading(true); const d = await geointSearch(q); setResult(d); setLoading(false); }} loading={loading} />}
                {activeTab === 'cyber' && <CyberView onSearch={async (q) => { setLoading(true); const d = await cyberTrace(q); setResult(d); setLoading(false); }} loading={loading} />}
                {activeTab === 'comms' && <CommsView />}
                {activeTab === 'translate' && <TranslateView onTranslate={async (t, l) => { setLoading(true); const d = await translateAndSpeak(t, l); setResult(d); if (d.audio) playAudio(d.audio); setLoading(false); }} loading={loading} />}

                {/* Results Display */}
                {loading && (
                  <div className="mt-12 flex flex-col items-center justify-center py-24 intel-card bg-[#0A192F]/60 border-dashed border-[#64FFDA]/20">
                    <div className="relative">
                      <Loader2 className="animate-spin text-[#64FFDA] mb-6" size={64} />
                      <div className="absolute inset-0 animate-ping bg-[#64FFDA]/10 rounded-full" />
                    </div>
                    <p className="intel-label animate-pulse text-[#64FFDA] tracking-[0.5em]">Processing Intelligence Data...</p>
                    <div className="mt-4 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, delay: i * 0.2 }}
                          className="w-1 h-1 bg-[#64FFDA]"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 space-y-8"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {previewUrl && activeTab === 'face' && (
                        <div className="intel-card group">
                          <div className="intel-header">
                            <span className="intel-label">Subject Biometrics</span>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-[#64FFDA]" />
                              <div className="w-1 h-1 bg-[#64FFDA]" />
                            </div>
                          </div>
                          <div className="p-6 relative bg-[#020C1B]">
                            <div className="scan-line" />
                            <div className="hud-border hud-tl" />
                            <div className="hud-border hud-tr" />
                            <div className="hud-border hud-bl" />
                            <div className="hud-border hud-br" />
                            <img src={previewUrl} className="w-full aspect-square object-cover rounded-sm border border-[#233554] grayscale hover:grayscale-0 transition-all duration-700" />
                          </div>
                          <div className="p-4 bg-[#0A192F] border-t border-[#233554]">
                            <button onClick={saveSuspect} className="btn-intel w-full flex items-center justify-center gap-3 py-3">
                              <Save size={14} /> Commit to Registry
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={cn("intel-card", (previewUrl && activeTab === 'face') ? "lg:col-span-2" : "lg:col-span-3")}>
                        <div className="intel-header">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#64FFDA] rounded-full animate-pulse" />
                            <span className="intel-label">Intelligence Summary Report</span>
                          </div>
                          <div className="flex gap-4">
                            {result.audio && (
                              <button onClick={() => playAudio(result.audio)} className="text-[#64FFDA] hover:scale-110 transition-transform p-1 bg-[#64FFDA]/10 rounded-sm">
                                <Volume2 size={16} />
                              </button>
                            )}
                            <FileText size={16} className="text-[#495670]" />
                          </div>
                        </div>
                        <div className="p-8 font-mono text-xs leading-relaxed text-[#8892B0] whitespace-pre-wrap bg-[#020C1B]/50 min-h-[200px]">
                          <div className="mb-4 text-[#64FFDA]/40 text-[10px] border-b border-[#233554] pb-2">
                            DECRYPTION_COMPLETE // SOURCE: CIB_CORE // TIMESTAMP: {new Date().toISOString()}
                          </div>
                          {result.text || result.error}
                        </div>
                      </div>
                    </div>

                    {result.grounding && (
                      <div className="intel-card">
                        <div className="intel-header">
                          <span className="intel-label">Digital Footprint & Network Nodes</span>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#020C1B]/30">
                          {result.grounding.map((chunk: any, i: number) => (
                            chunk.web && (
                              <a 
                                key={i}
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-[#112240] border border-[#233554] rounded-sm hover:border-[#64FFDA]/40 hover:bg-[#1d2d50] transition-all group"
                              >
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-[#64FFDA] mb-1 uppercase tracking-tighter truncate max-w-[180px]">{chunk.web.title}</span>
                                  <span className="text-[8px] text-[#495670] font-mono truncate max-w-[180px]">{chunk.web.uri}</span>
                                </div>
                                <ArrowRightLeft size={14} className="text-[#233554] group-hover:text-[#64FFDA] transition-colors" />
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-3 rounded-sm transition-all text-[10px] font-black uppercase tracking-[0.2em] relative group",
        active 
          ? "bg-[#64FFDA]/10 text-[#64FFDA] border border-[#64FFDA]/20 shadow-[0_0_20px_rgba(100,255,218,0.05)]" 
          : "text-[#8892B0] hover:text-[#64FFDA] hover:bg-[#112240]"
      )}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#64FFDA] rounded-r-full" />}
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#64FFDA]" : "text-[#495670]")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function FaceView({ onSearch, loading }: { onSearch: (file: File) => void, loading: boolean }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) onSearch(acceptedFiles[0]);
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    disabled: loading
  } as any);

  return (
    <div className="space-y-8">
      <div 
        className="intel-card p-20 text-center border-dashed border-2 border-[#233554] hover:border-[#64FFDA]/40 transition-colors cursor-pointer group relative" 
        {...getRootProps()}
      >
        <div className="hud-border hud-tl" />
        <div className="hud-border hud-tr" />
        <div className="hud-border hud-bl" />
        <div className="hud-border hud-br" />
        
        <input {...getInputProps()} />
        <div className="relative inline-block mb-8">
          <Scan className="text-[#233554] group-hover:text-[#64FFDA] transition-colors" size={80} />
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[2px] bg-[#64FFDA] shadow-[0_0_15px_#64FFDA] opacity-50"
          />
        </div>
        <h3 className="text-2xl font-black mb-3 text-white tracking-widest uppercase">Biometric Input Required</h3>
        <p className="text-[#8892B0] text-sm mb-10 max-w-md mx-auto font-mono">Upload high-resolution subject imagery for multi-spectral facial recognition and neural network analysis.</p>
        <button className="btn-intel px-10 py-4">Initialize Source Scan</button>
      </div>
    </div>
  );
}

function CompareView({ onCompare, loading, preview1, preview2, setP1, setP2 }: any) {
  const [f1, setF1] = useState<File | null>(null);
  const [f2, setF2] = useState<File | null>(null);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div 
          className="intel-card p-10 text-center border-dashed border-2 border-[#233554] cursor-pointer hover:border-[#64FFDA]/30 transition-all relative group" 
          onClick={() => document.getElementById('f1')?.click()}
        >
          <div className="hud-border hud-tl" />
          <div className="hud-border hud-tr" />
          <input id="f1" type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if(f) { setF1(f); setP1(URL.createObjectURL(f)); } }} />
          {preview1 ? (
            <div className="relative">
              <img src={preview1} className="w-full aspect-square object-cover rounded-sm mb-6 grayscale group-hover:grayscale-0 transition-all" />
              <div className="scan-line" />
            </div>
          ) : (
            <div className="py-10">
              <User className="mx-auto text-[#233554] mb-6 group-hover:text-[#64FFDA] transition-colors" size={64} />
            </div>
          )}
          <span className="intel-label tracking-[0.4em]">Evidence Matrix A</span>
        </div>
        
        <div 
          className="intel-card p-10 text-center border-dashed border-2 border-[#233554] cursor-pointer hover:border-[#64FFDA]/30 transition-all relative group" 
          onClick={() => document.getElementById('f2')?.click()}
        >
          <div className="hud-border hud-tl" />
          <div className="hud-border hud-tr" />
          <input id="f2" type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if(f) { setF2(f); setP2(URL.createObjectURL(f)); } }} />
          {preview2 ? (
            <div className="relative">
              <img src={preview2} className="w-full aspect-square object-cover rounded-sm mb-6 grayscale group-hover:grayscale-0 transition-all" />
              <div className="scan-line" />
            </div>
          ) : (
            <div className="py-10">
              <User className="mx-auto text-[#233554] mb-6 group-hover:text-[#64FFDA] transition-colors" size={64} />
            </div>
          )}
          <span className="intel-label tracking-[0.4em]">Evidence Matrix B</span>
        </div>
      </div>
      
      <button 
        onClick={() => f1 && f2 && onCompare(f1, f2)}
        disabled={!f1 || !f2 || loading}
        className="btn-intel w-full py-6 text-xs tracking-[0.5em] shadow-[0_0_30px_rgba(100,255,218,0.05)]"
      >
        EXECUTE FORENSIC CROSS-MATCH
      </button>
    </div>
  );
}

function OsintView({ onSearch, loading }: { onSearch: (q: string) => void, loading: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="intel-card p-10 bg-[#0A192F]/40">
      <div className="flex gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#495670]" size={18} />
          <input 
            type="text" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Enter Target Email, Phone, or Alias..." 
            className="input-intel pl-12 py-4"
          />
        </div>
        <button onClick={() => onSearch(q)} disabled={loading} className="btn-intel px-10">
          Initiate Trace
        </button>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#64FFDA]/20" />
          <span className="intel-label block mb-2 opacity-50">Intelligence Scope</span>
          <span className="intel-value text-sm">GLOBAL_OSINT_V4</span>
        </div>
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#64FFDA]/20" />
          <span className="intel-label block mb-2 opacity-50">Neural Depth</span>
          <span className="intel-value text-sm">MAX_RECURSION</span>
        </div>
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#64FFDA]/20" />
          <span className="intel-label block mb-2 opacity-50">Uplink Security</span>
          <span className="intel-value text-sm text-[#64FFDA]">ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}

function RecordsView({ onSearch, loading }: { onSearch: (n: string, d: string) => void, loading: boolean }) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  return (
    <div className="intel-card p-10 space-y-6 bg-[#0A192F]/40">
      <div className="space-y-2">
        <label className="intel-label ml-1">Subject Identity</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Legal Name / Known Aliases" className="input-intel py-4" />
      </div>
      <div className="space-y-2">
        <label className="intel-label ml-1">Intelligence Context</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Provide additional context: Last known location, associated organizations, physical descriptors..." className="input-intel min-h-[150px] py-4" />
      </div>
      <button onClick={() => onSearch(name, details)} disabled={loading} className="btn-intel w-full py-5 text-xs tracking-[0.4em]">
        QUERY FEDERAL INTELLIGENCE ARCHIVES
      </button>
    </div>
  );
}

function DatabaseView({ suspects }: { suspects: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {suspects.map((s) => (
        <div key={s.id} className="intel-card group hover:border-[#64FFDA]/30 transition-all">
          <div className="intel-header">
            <span className="intel-label">FILE_ID: {s.id.toString().padStart(6, '0')}</span>
            <span className="intel-value text-[9px] opacity-60">{new Date(s.created_at).toLocaleDateString()}</span>
          </div>
          <div className="p-5 bg-[#020C1B]">
            <div className="relative mb-5 overflow-hidden rounded-sm border border-[#233554]">
              <img src={s.photo_url} className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020C1B] to-transparent opacity-40" />
            </div>
            <h4 className="font-black text-white text-sm mb-2 uppercase tracking-wider">{s.name}</h4>
            <p className="text-[10px] text-[#8892B0] line-clamp-3 font-mono leading-relaxed">{s.details}</p>
          </div>
          <div className="p-4 bg-[#0A192F] border-t border-[#233554] flex justify-between">
            <button className="text-[9px] font-black text-[#64FFDA] uppercase tracking-widest hover:underline">Access Dossier</button>
            <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Expunge</button>
          </div>
        </div>
      ))}
      {suspects.length === 0 && (
        <div className="col-span-full py-32 text-center intel-card bg-transparent border-dashed border-2 border-[#233554]">
          <Database className="mx-auto text-[#233554] mb-6 opacity-20" size={64} />
          <p className="intel-label tracking-[0.4em]">Registry Empty // No Active Subjects</p>
        </div>
      )}
    </div>
  );
}

function CasesView({ cases, onCreate }: { cases: any[], onCreate: (t: string, d: string) => void }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-[#233554] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#64FFDA] rounded-full" />
          <h3 className="intel-label tracking-[0.4em]">Active Field Investigations</h3>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-intel px-6">
          {showNew ? 'Abort Operation' : 'Initialize New Case'}
        </button>
      </div>

      {showNew && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="intel-card p-10 space-y-6 bg-[#0A192F]/60"
        >
          <div className="space-y-2">
            <label className="intel-label ml-1">Operation Reference</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="CASE_REF_ID / OPERATION_NAME" className="input-intel py-4" />
          </div>
          <div className="space-y-2">
            <label className="intel-label ml-1">Mission Briefing</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Enter initial intelligence briefing and objectives..." className="input-intel min-h-[150px] py-4" />
          </div>
          <button onClick={() => { onCreate(title, desc); setShowNew(false); setTitle(''); setDesc(''); }} className="btn-intel w-full py-5 text-xs tracking-[0.5em]">
            AUTHORIZE INVESTIGATION
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {cases.map((c) => (
          <div key={c.id} className="intel-card group">
            <div className="intel-header">
              <span className="intel-label tracking-widest">OP_FILE: #{c.id.toString().padStart(6, '0')}</span>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-sm text-[8px] font-black tracking-widest border", 
                  c.status === 'Open' ? "bg-[#64FFDA]/10 text-[#64FFDA] border-[#64FFDA]/30" : "bg-zinc-900 text-zinc-500 border-zinc-800"
                )}>
                  {c.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="p-6 flex justify-between items-start bg-[#020C1B]/40">
              <div className="space-y-3">
                <h4 className="font-black text-white text-base uppercase tracking-tight">{c.title}</h4>
                <p className="text-[11px] text-[#8892B0] font-mono leading-relaxed max-w-2xl">{c.description}</p>
              </div>
              <div className="text-right">
                <span className="intel-label block mb-1 opacity-40">Initiated</span>
                <span className="intel-value text-[10px]">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="p-4 bg-[#0A192F] border-t border-[#233554] flex gap-6">
              <button className="text-[9px] font-black text-[#64FFDA] uppercase tracking-widest hover:underline">Evidence Matrix</button>
              <button className="text-[9px] font-black text-[#8892B0] uppercase tracking-widest hover:underline">Intelligence Report</button>
              <button className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline ml-auto">Terminate Case</button>
            </div>
          </div>
        ))}
        {cases.length === 0 && (
          <div className="py-32 text-center intel-card bg-transparent border-dashed border-2 border-[#233554]">
            <AlertTriangle className="mx-auto text-[#233554] mb-6 opacity-20" size={64} />
            <p className="intel-label tracking-[0.4em]">No Active Investigations Found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GeointView({ onSearch, loading }: { onSearch: (q: string) => void, loading: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="intel-card p-10 bg-[#0A192F]/40">
      <div className="flex gap-6">
        <div className="flex-1 relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[#495670]" size={18} />
          <input 
            type="text" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Enter Location, Coordinates, or Landmark..." 
            className="input-intel pl-12 py-4"
          />
        </div>
        <button onClick={() => onSearch(q)} disabled={loading} className="btn-intel px-10">
          Sync Satellite
        </button>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6">
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm">
          <span className="intel-label block mb-2 opacity-50">Satellite Constellation</span>
          <span className="intel-value text-sm">CIB-GEO-EYE-09</span>
        </div>
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm">
          <span className="intel-label block mb-2 opacity-50">Ground Resolution</span>
          <span className="intel-value text-sm">0.15m / PIXEL</span>
        </div>
      </div>
    </div>
  );
}

function CyberView({ onSearch, loading }: { onSearch: (q: string) => void, loading: boolean }) {
  const [q, setQ] = useState('');
  return (
    <div className="intel-card p-10 bg-[#0A192F]/40">
      <div className="flex gap-6">
        <div className="flex-1 relative">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-[#495670]" size={18} />
          <input 
            type="text" 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Enter IP Address, Domain, or MAC..." 
            className="input-intel pl-12 py-4"
          />
        </div>
        <button onClick={() => onSearch(q)} disabled={loading} className="btn-intel px-10">
          Trace Packet
        </button>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm">
          <span className="intel-label block mb-2 opacity-50">Node Status</span>
          <span className="intel-value text-sm">MONITORING</span>
        </div>
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm">
          <span className="intel-label block mb-2 opacity-50">Packet Depth</span>
          <span className="intel-value text-sm">LAYER_7</span>
        </div>
        <div className="p-5 bg-[#020C1B] border border-[#233554] rounded-sm">
          <span className="intel-label block mb-2 opacity-50">Firewall Bypass</span>
          <span className="intel-value text-sm text-[#64FFDA]">ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

function CommsView() {
  const [mode, setMode] = useState<'sms' | 'call'>('sms');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'transmitting' | 'success'>('idle');

  const handleAction = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('transmitting');
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="intel-card p-10 bg-[#0A192F]/40">
      <div className="flex gap-4 mb-10 border-b border-[#233554] pb-6">
        <button 
          onClick={() => setMode('sms')} 
          className={cn("px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all", mode === 'sms' ? "text-[#64FFDA] border-b-2 border-[#64FFDA]" : "text-[#495670]")}
        >
          Satellite SMS
        </button>
        <button 
          onClick={() => setMode('call')} 
          className={cn("px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-all", mode === 'call' ? "text-[#64FFDA] border-b-2 border-[#64FFDA]" : "text-[#495670]")}
        >
          Satellite Call
        </button>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        <div className="space-y-2">
          <span className="intel-label opacity-50">Target Frequency / Number</span>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#495670]" size={18} />
            <input 
              type="text" 
              value={number} 
              onChange={(e) => setNumber(e.target.value)} 
              placeholder="+1 (XXX) XXX-XXXX" 
              className="input-intel pl-12 py-4"
            />
          </div>
        </div>

        {mode === 'sms' && (
          <div className="space-y-2">
            <span className="intel-label opacity-50">Encrypted Payload</span>
            <textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Enter secure message..." 
              className="input-intel min-h-[120px] p-4 resize-none"
            />
          </div>
        )}

        <button 
          onClick={handleAction} 
          disabled={status !== 'idle'} 
          className="btn-intel w-full py-6 flex items-center justify-center gap-4"
        >
          {status === 'idle' && (
            <>
              <Radio size={20} />
              <span>{mode === 'sms' ? 'INITIATE BURST TRANSMISSION' : 'ESTABLISH SATELLITE UPLINK'}</span>
            </>
          )}
          {status === 'connecting' && <span className="animate-pulse">ACQUIRING SATELLITE...</span>}
          {status === 'transmitting' && <span className="animate-pulse">TRANSMITTING VIA CIB-SAT-04...</span>}
          {status === 'success' && <span className="text-[#64FFDA]">TRANSMISSION SUCCESSFUL</span>}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#020C1B] border border-[#233554] rounded-sm">
            <span className="intel-label block mb-1 opacity-50">Encryption</span>
            <span className="intel-value text-[10px]">AES-256-GCM</span>
          </div>
          <div className="p-4 bg-[#020C1B] border border-[#233554] rounded-sm">
            <span className="intel-label block mb-1 opacity-50">Uplink Latency</span>
            <span className="intel-value text-[10px]">24ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranslateView({ onTranslate, loading }: { onTranslate: (t: string, l: 'English' | 'Nepali') => void, loading: boolean }) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState<'English' | 'Nepali'>('Nepali');

  return (
    <div className="intel-card p-10 space-y-8 bg-[#0A192F]/40">
      <div className="flex justify-between items-center border-b border-[#233554] pb-6">
        <div className="flex items-center gap-3">
          <Globe className="text-[#64FFDA]" size={20} />
          <span className="intel-label tracking-[0.4em]">Linguistic Decryption Engine</span>
        </div>
        <div className="flex bg-[#020C1B] p-1 rounded-sm border border-[#233554]">
          <button 
            onClick={() => setLang('Nepali')}
            className={cn("px-6 py-2 text-[9px] font-black rounded-sm transition-all tracking-widest", lang === 'Nepali' ? "bg-[#64FFDA] text-[#020C1B]" : "text-[#495670] hover:text-[#8892B0]")}
          >
            NEPALI_NODE
          </button>
          <button 
            onClick={() => setLang('English')}
            className={cn("px-6 py-2 text-[9px] font-black rounded-sm transition-all tracking-widest", lang === 'English' ? "bg-[#64FFDA] text-[#020C1B]" : "text-[#495670] hover:text-[#8892B0]")}
          >
            ENGLISH_NODE
          </button>
        </div>
      </div>
      <div className="relative">
        <div className="hud-border hud-tl" />
        <div className="hud-border hud-tr" />
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Input intercepted text for translation and synthesis..." 
          className="input-intel min-h-[200px] py-6 px-6 leading-relaxed"
        />
      </div>
      <button 
        onClick={() => onTranslate(text, lang)} 
        disabled={loading || !text} 
        className="btn-intel w-full py-6 flex items-center justify-center gap-4 text-xs tracking-[0.5em] shadow-[0_0_30px_rgba(100,255,218,0.05)]"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Languages size={20} />}
        DECRYPT & SYNTHESIZE AUDIO
      </button>
    </div>
  );
}

