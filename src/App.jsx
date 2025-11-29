import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Save, RotateCcw, TrendingUp, Users, Calculator, AlertCircle, Download, Upload, FileSpreadsheet, Play, CheckCircle, HelpCircle, X, AlertTriangle, MessageCircle, Heart } from 'lucide-react';

const GradeAdjuster = () => {
  // --- STATE ---
  const [students, setStudents] = useState([
    { id: 1, name: "Andi (Contoh 1)", originalScore: 19 },
    { id: 2, name: "Budi (Contoh 2)", originalScore: 40 },
    { id: 3, name: "Citra (Contoh 3)", originalScore: 60 },
    { id: 4, name: "Dewi (Lulus)", originalScore: 85 },
  ]);

  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState("");
  const fileInputRef = useRef(null);
  
  // State: Status Pemrosesan & Tutorial
  const [isProcessed, setIsProcessed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // State: Notifikasi (Toast)
  const [notification, setNotification] = useState(null); 

  // Konfigurasi KKM dan Target Katrol
  const [kkm, setKkm] = useState(70);
  const [targetMax, setTargetMax] = useState(80); 
  const [boostPassed, setBoostPassed] = useState(false);

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

  // --- ALGORITMA KATROL (INTERPOLASI LINEAR) ---
  const minOriginalScore = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.min(...students.map(s => s.originalScore));
  }, [students]);

  const calculateFinalScore = (original) => {
    const score = parseFloat(original);
    
    if (score >= kkm && !boostPassed) {
      return score;
    }
    
    let x1 = minOriginalScore;
    let y1 = kkm;
    let x2 = kkm; 
    let y2 = targetMax;

    if (x2 === x1) return Math.max(score, kkm);

    const m = (y2 - y1) / (x2 - x1);
    let finalScore = y1 + m * (score - x1);

    finalScore = Math.round(finalScore);
    
    if (finalScore > 100) finalScore = 100;
    if (score < kkm && finalScore < kkm) finalScore = kkm;

    return finalScore;
  };

  // --- HANDLERS ---
  const handleProcess = () => {
    setIsProcessed(true);
    showToast('success', 'Nilai berhasil diproses dan dihitung!');
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

    // Tambahkan BOM agar Excel membaca UTF-8 dengan benar
    let csvContent = "\uFEFF"; 
    csvContent += "Nama Siswa,Nilai Asli,Nilai Katrol,Status\n";
    
    students.forEach(s => {
      const final = calculateFinalScore(s.originalScore);
      const status = final >= kkm ? "Tuntas" : "Belum Tuntas";
      // Bungkus nama dengan tanda kutip untuk keamanan jika ada koma di nama
      csvContent += `"${s.name}",${s.originalScore},${final},${status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nilai_katrol_siswa_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'File CSV berhasil diunduh!');
  };

  const downloadTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Siswa,Nilai Original\n";
    csvContent += "Siswa A,45\n";
    csvContent += "Siswa B,60\n";
    csvContent += "Siswa C,20\n";
    
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
              // Hapus tanda kutip jika ada
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
          showToast('error', "File CSV kosong atau format tidak terbaca.");
        }
      } catch (err) {
        showToast('error', "Terjadi kesalahan saat membaca file.");
      }
    };
    reader.onerror = () => {
         showToast('error', "Gagal membaca file.");
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800 relative">
      
      {/* --- TOAST NOTIFICATION --- */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] animate-slide-in px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] border border-white/20 backdrop-blur-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-600 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          )}
          <div className="flex-1">
             <h4 className="font-bold text-sm uppercase opacity-90">
                {notification.type === 'success' ? 'Sukses' : 'Gagal'}
             </h4>
             <p className="font-medium text-sm">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100 transition-opacity p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* TUTORIAL MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowTutorial(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
                <HelpCircle className="w-7 h-7" /> Panduan Penggunaan
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-bold text-slate-800">Atur Konfigurasi (Rumus)</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Tentukan <b>KKM</b> sekolah Anda. Kemudian isi <b>Target Nilai Maksimal</b>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-bold text-slate-800">Input Data Siswa</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Anda bisa memasukkan siswa satu per satu secara manual, atau menggunakan Excel (CSV).
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-bold text-slate-800">Klik "Proses & Hitung"</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Setelah semua data masuk, tombol oranye besar akan muncul. Klik tombol tersebut untuk melihat hasil nilai katrol.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <h3 className="font-bold text-slate-800">Export / Simpan</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Jika hasil sudah sesuai, klik tombol "Download Hasil" berwarna hijau.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setShowTutorial(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                >
                  Saya Mengerti
                </button>
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
            <p className="text-slate-500 mt-1">
              Sistem Katrol Nilai Adil (Interpolasi Linear)
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
            <button 
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-sm font-medium border border-indigo-200"
            >
              <HelpCircle className="w-4 h-4" /> Panduan
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
             {/* Tombol Export di Header tetap ada sebagai cadangan */}
             <button 
              onClick={handleExport} 
              disabled={!isProcessed}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${!isProcessed ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
            >
              <Save className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL: INPUT & SETTINGS */}
          <div className="space-y-6">
            
            {/* CONFIGURATION CARD */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Konfigurasi Rumus
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    KKM (Batas Minimal)
                  </label>
                  <input 
                    type="number" 
                    value={kkm} 
                    onChange={(e) => setKkm(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Nilai Maksimal
                  </label>
                  <input 
                    type="number" 
                    value={targetMax} 
                    onChange={(e) => setTargetMax(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Nilai yang mendekati KKM akan ditarik ke angka ini.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                   <input 
                    type="checkbox" 
                    id="boostPassed"
                    checked={boostPassed}
                    onChange={(e) => setBoostPassed(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                   />
                   <label htmlFor="boostPassed" className="text-sm text-slate-700">
                     Katrol juga nilai yang sudah lulus?
                   </label>
                </div>
              </div>
            </div>

            {/* IMPORT & MANUAL INPUT */}
            <div className="space-y-6">
               <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    Input Data
                  </h2>
                  <div className="space-y-3">
                     <div className="flex gap-2">
                        <button 
                          onClick={downloadTemplate}
                          className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2 rounded-lg text-xs flex justify-center items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Template
                        </button>
                        <div className="flex-1 relative">
                          <input 
                            type="file" 
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden" 
                            id="csvUpload"
                          />
                          <label 
                            htmlFor="csvUpload"
                            className="w-full h-full bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg flex justify-center items-center gap-1 cursor-pointer text-xs"
                          >
                            <Upload className="w-3 h-3" /> Upload CSV
                          </label>
                        </div>
                     </div>
                     
                     <div className="border-t border-slate-100 my-3 pt-3">
                        <p className="text-xs font-semibold text-slate-500 mb-2">Atau Input Manual:</p>
                        <div className="flex gap-2 mb-2">
                          <input 
                            type="text" 
                            placeholder="Nama" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <input 
                            type="number" 
                            placeholder="Nilai" 
                            value={newScore}
                            onChange={(e) => setNewScore(e.target.value)}
                            className="w-20 border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <button onClick={addStudent} className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium py-2 rounded-lg flex justify-center items-center gap-2 transition-colors text-sm">
                          <Plus className="w-4 h-4" /> Tambah
                        </button>
                     </div>
                  </div>
               </div>
            </div>

          </div>

          {/* RIGHT PANEL: RESULT TABLE */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ACTION BUTTON AREA */}
            {!isProcessed && students.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                     <AlertCircle className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="font-bold text-amber-800 text-lg">Data Belum Diproses</h3>
                     <p className="text-amber-700 text-sm">
                       Ada {students.length} siswa menunggu perhitungan nilai. Klik tombol untuk memproses.
                     </p>
                   </div>
                </div>
                <button 
                  onClick={handleProcess}
                  className="whitespace-nowrap px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Proses & Hitung Nilai
                </button>
              </div>
            )}

            {isProcessed && (
               <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                 <div className="flex items-center gap-2 text-emerald-800 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    <span>Nilai berhasil dikatrol!</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsProcessed(false)}
                      className="text-slate-500 hover:text-slate-700 text-sm underline"
                    >
                      Edit Data
                    </button>
                    <button 
                      onClick={handleExport}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow flex items-center gap-2 transition-colors"
                    >
                      <Save className="w-4 h-4" /> Download Hasil (CSV)
                    </button>
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
                      <th className="p-4 text-center text-indigo-700">Nilai Katrol</th>
                      <th className="p-4 text-center">Delta</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-slate-400">
                          Belum ada data. Silakan Import atau input manual.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => {
                        const finalScore = calculateFinalScore(student.originalScore);
                        const delta = finalScore - student.originalScore;
                        const isOriginalPassed = student.originalScore >= kkm;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-medium text-slate-700">{student.name}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded text-sm font-semibold ${isOriginalPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {student.originalScore}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                               {isProcessed ? (
                                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg animate-pulse-once">
                                    {finalScore}
                                  </span>
                               ) : (
                                  <span className="text-slate-300 font-bold text-lg">-</span>
                               )}
                            </td>
                            <td className="p-4 text-center text-sm text-slate-500">
                              {isProcessed ? (delta > 0 ? `+${delta}` : '0') : '-'}
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => removeStudent(student.id)}
                                className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors pointer-events-auto"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="mt-12 mb-6 text-center space-y-4">
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Smart Grade Adjuster. Dibuat dengan <Heart className="w-3 h-3 inline text-red-400 fill-current" /> untuk Pendidikan Indonesia.
          </p>
          
          <a 
            href="https://wa.me/6281234567890?text=Halo%20saya%20butuh%20bantuan%20dengan%20aplikasi%20Smart%20Grade%20Adjuster" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
          >
            <MessageCircle className="w-4 h-4" />
            Support Pembuatnya
          </a>
        </div>

      </div>
    </div>
  );
};

export default GradeAdjuster;