import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, RotateCcw, TrendingUp, Users, Calculator, AlertCircle, Download, Upload, FileSpreadsheet, Play, CheckCircle, HelpCircle, X, AlertTriangle, MessageCircle, Heart, Settings, Sliders, Youtube, ExternalLink, Table } from 'lucide-react';

const GradeAdjuster = () => {
  // --- STATE DATA ---
  const [students, setStudents] = useState([
    { id: 1, name: "Andi (Sangat Rendah)", originalScore: 19 },
    { id: 2, name: "Budi (Rendah)", originalScore: 30 },
    { id: 3, name: "Citra (Menengah)", originalScore: 50 },
    { id: 4, name: "Dewi (Hampir Lulus)", originalScore: 68 },
    { id: 5, name: "Eko (Lulus Murni)", originalScore: 78 },
    { id: 6, name: "Fajar (Pintar)", originalScore: 92 },
  ]);

  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState("");
  const fileInputRef = useRef(null);
  
  // State UI
  const [isProcessed, setIsProcessed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false); 
  const [notification, setNotification] = useState(null); 

  // --- CONFIG STATE ---
  const [kkm, setKkm] = useState(70);
  // Mode: 'staged', 'linear', atau 'table'
  const [logicMode, setLogicMode] = useState('staged'); 
  
  // Config Linear/Staged
  const [targetMax, setTargetMax] = useState(80); 
  const [flatThreshold, setFlatThreshold] = useState(30); 
  const [remedialCap, setRemedialCap] = useState(78); 
  const [boostPassed, setBoostPassed] = useState(false); // Hanya untuk mode Linear

  // --- EFFECT: Auto Hide Notification ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showToast = (type, message) => {
    setNotification({ type, message });
  };

  // --- ALGORITMA KATROL ---
  const calculateFinalScore = (original) => {
    const score = parseFloat(original);
    
    // --- MODE 3: TABEL KUSTOM (MANUAL) ---
    if (logicMode === 'table') {
      if (score >= 20 && score <= 40) return 75;
      if (score >= 41 && score <= 60) return 76;
      if (score >= 61 && score <= 70) return 77;
      if (score >= 71 && score <= 75) return 78;
      
      const mapping = {
        76: 79, 77: 80, 78: 81, 79: 82, 80: 83,
        81: 84, 82: 85, 83: 86, 84: 87, 85: 88,
        86: 89, 87: 90, 88: 91, 89: 92, 90: 93,
        91: 93, 92: 94, 93: 94, 94: 95, 95: 95
      };

      if (mapping[score] !== undefined) return mapping[score];
      if (score < 20) return 75; 
      if (score > 95) return score; 
      return score;
    }

    // --- MODE 1: BERTINGKAT (STAGED - UPDATE ADIL) ---
    if (logicMode === 'staged') {
      // Tahap 1: Nilai Sangat Rendah (0 - Batas Bawah) -> Jadi KKM
      if (score <= flatThreshold) {
        return kkm;
      } 
      // Tahap 2: Nilai Remedial (Batas Bawah - KKM) -> Naik ke [KKM - RemedialCap]
      else if (score <= kkm) {
        const rangeInput = kkm - flatThreshold; 
        const rangeOutput = remedialCap - kkm;  
        if (rangeInput <= 0) return kkm;
        
        const progress = (score - flatThreshold) / rangeInput;
        return Math.round(kkm + (progress * rangeOutput));
      } 
      // Tahap 3: Nilai Lulus (KKM - 100) -> Naik ke [RemedialCap - 100]
      // INI UPDATE BARU: Agar siswa pintar tetap dapat bonus dan tidak tersalip
      else {
        const rangeInput = 100 - kkm; // Sisa rentang nilai asli
        const rangeOutput = 100 - remedialCap; // Sisa rentang nilai tujuan
        
        if (rangeInput <= 0) return 100;

        const progress = (score - kkm) / rangeInput;
        // Start dari RemedialCap agar nyambung grafiknya
        let final = remedialCap + (progress * rangeOutput); 
        return Math.round(final);
      }
    }

    // --- MODE 2: LINEAR BIASA (LAMA) ---
    // Di mode ini, user bisa pilih mau boost yang lulus atau tidak lewat checkbox
    if (score >= kkm && !boostPassed) return score;

    let x1 = 0; // Default
    // Cari min score dari data yg ada untuk anchor bawah
    // (Dalam konteks React state, kita perlu akses state students, tapi di sini simplified)
    // Kita pakai minOriginalScore dari useMemo di parent component biasanya, 
    // tapi karena fungsi ini butuh self-contained, kita pakai default logic atau parameter.
    // Agar aman kita pakai minOriginalScore global (perlu dipassing atau diakses dari scope)
    // *Di sini kita akses students state langsung karena ada di dalam component*
    const minVal = students.length > 0 ? Math.min(...students.map(s => s.originalScore)) : 0;
    
    let y1 = kkm;
    let x2 = kkm; 
    let y2 = targetMax;

    if (x2 === minVal) return Math.max(score, kkm); // Safety

    const m = (y2 - y1) / (x2 - minVal);
    let finalScore = y1 + m * (score - minVal);

    finalScore = Math.round(finalScore);
    if (finalScore > 100) finalScore = 100;
    if (finalScore < score) finalScore = score;
    if (score < kkm && finalScore < kkm) finalScore = kkm;

    return finalScore;
  };

  // --- HANDLERS ---
  const handleProcess = () => {
    setIsProcessed(true);
    let modeName = 'Linear';
    if (logicMode === 'staged') modeName = 'Bertingkat (Adil)';
    if (logicMode === 'table') modeName = 'Tabel Manual';
    showToast('success', `Nilai berhasil dihitung dengan Mode ${modeName}`);
  };

  const addStudent = (e) => {
    e.preventDefault();
    if (!newName || newScore === "") {
        showToast('error', 'Nama dan Nilai harus diisi!');
        return;
    }
    const newStudent = {
      id: Date.now(),
      name: newName,
      originalScore: parseFloat(newScore)
    };
    setStudents([...students, newStudent]);
    setNewName("");
    setNewScore("");
    setIsProcessed(false); 
    showToast('success', `Siswa "${newName}" berhasil ditambahkan.`);
  };

  const removeStudent = (id) => {
    setStudents(students.filter(s => s.id !== id));
    setIsProcessed(false); 
    showToast('success', 'Data siswa dihapus.');
  };

  const handleReset = () => {
    if (confirm("Yakin ingin menghapus semua data siswa?")) {
      setStudents([]);
      setIsProcessed(false);
      showToast('success', 'Semua data berhasil direset.');
    }
  };
  
  const handleExport = () => {
    if (!isProcessed) {
      showToast('error', "Klik tombol 'Proses & Hitung Nilai' dulu sebelum download.");
      return;
    }

    let csvContent = "\uFEFF"; 
    csvContent += "Nama Siswa,Nilai Asli,Nilai Katrol,Status\n";
    students.forEach(s => {
      const final = calculateFinalScore(s.originalScore);
      const status = final >= kkm ? "Tuntas" : "Belum Tuntas";
      csvContent += `"${s.name}",${s.originalScore},${final},${status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nilai_katrol_${logicMode}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'File CSV berhasil diunduh!');
  };

  const downloadTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Siswa,Nilai Original\n";
    csvContent += "Siswa A,25\n";
    csvContent += "Siswa B,55\n";
    csvContent += "Siswa C,80\n";
    csvContent += "Siswa D,92\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_nilai.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n');
        const newStudents = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (row) {
            const cols = row.includes(';') ? row.split(';') : row.split(',');
            if (cols.length >= 2) {
              const name = cols[0].trim().replace(/^"|"$/g, '');
              const score = parseFloat(cols[1].trim());
              if (name && !isNaN(score)) {
                newStudents.push({
                  id: Date.now() + i,
                  name: name,
                  originalScore: score
                });
              }
            }
          }
        }

        if (newStudents.length > 0) {
          setStudents(prev => [...prev, ...newStudents]);
          setIsProcessed(false); 
          showToast('success', `Berhasil mengimpor ${newStudents.length} siswa!`);
        } else {
          showToast('error', "File CSV kosong/format salah.");
        }
      } catch (err) {
        showToast('error', "Terjadi kesalahan membaca file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800 relative">
      
      {/* NOTIFICATION */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] animate-slide-in px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] border border-white/20 backdrop-blur-sm ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <div className="flex-1">
             <h4 className="font-bold text-sm uppercase opacity-90">{notification.type === 'success' ? 'Sukses' : 'Gagal'}</h4>
             <p className="font-medium text-sm">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 p-1"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* --- VIDEO MODAL --- */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[340px] max-h-[85vh] flex flex-col relative border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900/95 backdrop-blur-sm flex justify-between items-center border-b border-slate-700 sticky top-0 z-20 shrink-0">
              <span className="text-white text-xs font-bold bg-red-600 px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Youtube className="w-3 h-3 fill-white" /> Tutorial
              </span>
              <button onClick={() => setShowVideoModal(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 bg-black custom-scrollbar">
              <div className="w-full aspect-[9/16] bg-black">
                <iframe className="w-full h-full" src="https://www.youtube.com/embed/uqPzvpMqx8I" title="Tutorial Smart Grade Adjuster" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
              </div>
              <div className="p-4 bg-slate-800 text-center border-t border-slate-700">
                <p className="text-slate-400 text-xs mb-2">Video tidak muncul?</p>
                <a href="https://youtube.com/shorts/uqPzvpMqx8I" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors w-full justify-center">
                  <ExternalLink className="w-4 h-4" /> Buka di YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEXT TUTORIAL MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2"><Sliders className="w-6 h-6" /> Perbedaan Mode Logika</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <h3 className="font-bold text-indigo-800 mb-1">1. Mode Bertingkat (Disarankan)</h3>
                <p>Paling Adil. Nilai rendah ditarik ke KKM. Nilai tinggi ikut naik sedikit agar tidak tersalip.</p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-xs">
                  <li>0 - Batas Bawah &rarr; Jadi KKM</li>
                  <li>KKM - 100 &rarr; Ikut naik proporsional</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-800 mb-1 flex items-center gap-2">3. Mode Tabel</h3>
                <p>Menggunakan tabel konversi baku (20-40=75, dst).</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-1">2. Mode Linear</h3>
                <p>Semua nilai ditarik garis lurus biasa.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <Calculator className="w-8 h-8" />
              Smart Grade Adjuster
            </h1>
            <p className="text-slate-500 mt-1">Sistem Katrol Nilai (Support Kurikulum Merdeka)</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2 flex-wrap items-center">
            <button onClick={() => setShowVideoModal(true)} className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold border border-red-200 transition-all hover:shadow-sm">
              <Youtube className="w-5 h-5 fill-current" /> Video Tutorial
            </button>
            <button onClick={() => setShowTutorial(true)} className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium border border-indigo-200">
              <HelpCircle className="w-4 h-4" /> Info Mode
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: SETTINGS */}
          <div className="space-y-6">
            
            {/* CONFIGURATION CARD */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-indigo-800">
                <Settings className="w-5 h-5" />
                Pengaturan Logika
              </h2>
              
              {/* TOGGLE MODE (3 OPTIONS) */}
              <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button onClick={() => { setLogicMode('staged'); setIsProcessed(false); }} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${logicMode === 'staged' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Bertingkat
                </button>
                <button onClick={() => { setLogicMode('linear'); setIsProcessed(false); }} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${logicMode === 'linear' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Linear
                </button>
                <button onClick={() => { setLogicMode('table'); setIsProcessed(false); }} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-md transition-all ${logicMode === 'table' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Tabel (Baru)
                </button>
              </div>

              {/* SETTINGS DISPLAY BASED ON MODE */}
              {logicMode === 'table' ? (
                 <div className="space-y-4 animate-fade-in bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Table className="w-5 h-5 text-green-700" />
                      <h3 className="font-bold text-green-800 text-sm">Mode Tabel Manual</h3>
                    </div>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Nilai dihitung berdasarkan tabel konversi yang Anda berikan (20-40=75, dst).
                    </p>
                    <div className="bg-white p-2 rounded border border-green-200 h-32 overflow-y-auto text-xs text-slate-600">
                      <table className="w-full text-left">
                        <tbody>
                          <tr className="border-b"><td className="py-1 font-semibold">20 - 40</td><td className="text-right font-bold text-green-600">75</td></tr>
                          <tr className="border-b"><td className="py-1 font-semibold">41 - 60</td><td className="text-right font-bold text-green-600">76</td></tr>
                          <tr className="border-b"><td className="py-1 font-semibold">61 - 70</td><td className="text-right font-bold text-green-600">77</td></tr>
                          <tr className="border-b"><td className="py-1 font-semibold">71 - 75</td><td className="text-right font-bold text-green-600">78</td></tr>
                          <tr className="border-b"><td className="py-1">76</td><td className="text-right">79</td></tr>
                          <tr className="border-b"><td className="py-1">...</td><td className="text-right">...</td></tr>
                          <tr><td className="py-1">95</td><td className="text-right">95</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">*Setting KKM tidak berpengaruh di mode ini.</p>
                 </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">KKM Sekolah</label>
                    <input type="number" value={kkm} onChange={(e) => setKkm(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-indigo-700" />
                  </div>

                  {logicMode === 'staged' ? (
                    <div className="space-y-4 animate-fade-in bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <div>
                        <label className="block text-xs font-bold text-indigo-800 mb-1">Batas Bawah Flat (Floor)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={flatThreshold} onChange={(e) => setFlatThreshold(Number(e.target.value))} className="w-20 border border-indigo-200 rounded p-1 text-sm" />
                          <span className="text-xs text-slate-500">Nilai &le; {flatThreshold} otomatis jadi {kkm}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-indigo-800 mb-1">Max Nilai Remedial (Cap)</label>
                        <div className="flex items-center gap-2">
                          <input type="number" value={remedialCap} onChange={(e) => setRemedialCap(Number(e.target.value))} className="w-20 border border-indigo-200 rounded p-1 text-sm" />
                          <span className="text-xs text-slate-500">Nilai remedial tidak akan &gt; {remedialCap}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-indigo-600 italic mt-2">
                        *Siswa yang nilainya &gt; {kkm} (Lulus Murni) akan otomatis naik sedikit dari {remedialCap} s.d. 100 agar adil.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Target Nilai Maksimal</label>
                        <input type="number" value={targetMax} onChange={(e) => setTargetMax(Number(e.target.value))} className="w-full border border-slate-300 rounded p-2 text-sm" />
                        <p className="text-[10px] text-slate-500 mt-1">Nilai mendekati KKM ditarik ke angka ini.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* INPUT DATA */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
               <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-700">
                 <FileSpreadsheet className="w-5 h-5" /> Input Siswa
               </h2>
               <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 py-2 rounded-lg text-xs flex justify-center items-center gap-1"><Download className="w-3 h-3" /> Template</button>
                    <div className="flex-1 relative">
                      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="csvUpload" />
                      <label htmlFor="csvUpload" className="w-full h-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex justify-center items-center gap-1 cursor-pointer text-xs"><Upload className="w-3 h-3" /> Upload CSV</label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <input type="text" placeholder="Nama" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none" />
                    <input type="number" placeholder="Nilai" value={newScore} onChange={(e) => setNewScore(e.target.value)} className="w-16 border border-slate-300 rounded-lg p-2 text-sm outline-none" />
                    <button onClick={addStudent} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg"><Plus className="w-5 h-5" /></button>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT PANEL: RESULT TABLE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ACTION AREA */}
            {!isProcessed ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-amber-100 rounded-full text-amber-600"><AlertCircle className="w-6 h-6" /></div>
                   <div>
                     <h3 className="font-bold text-amber-800">Menunggu Proses</h3>
                     <p className="text-amber-700 text-xs">Klik tombol untuk menghitung dengan metode <b>{logicMode === 'table' ? 'Tabel Manual' : logicMode === 'staged' ? 'Bertingkat' : 'Linear'}</b>.</p>
                   </div>
                </div>
                <button onClick={handleProcess} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all flex items-center gap-2"><Play className="w-5 h-5 fill-current" /> Hitung Nilai</button>
              </div>
            ) : (
               <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                 <div className="flex items-center gap-2 text-emerald-800 font-medium"><CheckCircle className="w-5 h-5" /> <span>Perhitungan Selesai!</span></div>
                 <div className="flex gap-3">
                    <button onClick={() => setIsProcessed(false)} className="text-slate-500 hover:text-slate-700 text-sm underline">Edit Config</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow flex items-center gap-2"><Save className="w-4 h-4" /> Download Hasil</button>
                 </div>
               </div>
            )}
            
            {/* TABLE */}
            <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-opacity ${!isProcessed && students.length > 0 ? 'opacity-50 pointer-events-none select-none grayscale' : 'opacity-100'}`}>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Daftar Nilai ({students.length} Siswa)</h3>
                {isProcessed && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">Terverifikasi</span>}
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="text-xs font-bold text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                      <th className="p-4">Nama Siswa</th>
                      <th className="p-4 text-center">Nilai Asli</th>
                      <th className="p-4 text-center text-indigo-700">Nilai Akhir</th>
                      <th className="p-4 text-center">Ket.</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => {
                        const finalScore = calculateFinalScore(student.originalScore);
                        const delta = finalScore - student.originalScore;
                        const isOriginalPassed = student.originalScore >= kkm;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-700">{student.name}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-semibold ${isOriginalPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{student.originalScore}</span>
                            </td>
                            <td className="p-4 text-center">
                               {isProcessed ? <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">{finalScore}</span> : <span className="text-slate-300 font-bold">-</span>}
                            </td>
                            <td className="p-4 text-center text-xs text-slate-500">
                              {isProcessed ? (delta > 0 ? <span className="text-green-600">+{delta} (Remed)</span> : "Tetap") : '-'}
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => removeStudent(student.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-12 mb-6 text-center space-y-4">
          <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} Smart Grade Adjuster. created by: Wahid Amiruddin M.</p>
          <a href="https://wa.me/6282228398585?text=Halo%20saya%20butuh%20bantuan" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 text-sm"><MessageCircle className="w-4 h-4" /> Support Pembuatnya</a>
        </div>
      </div>
    </div>
  );
};

export default GradeAdjuster;