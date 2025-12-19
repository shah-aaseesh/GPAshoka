
import React, { useState, useMemo, useEffect } from 'react';
import { Semester, DEFAULT_GRADE_SCALE, GPAResult, SemesterStats, Course } from './types';
import { SemesterCard } from './components/SemesterCard';
import { parseTextTranscript } from './parserService';
import { 
  Calculator, 
  Plus, 
  TrendingUp, 
  GraduationCap, 
  RefreshCcw, 
  Loader2, 
  ClipboardType, 
  X, 
  Info, 
  Trash2, 
  ChevronRight, 
  BookCheck, 
  CheckCircle2, 
  ListRestart, 
  HelpCircle, 
  AlertTriangle 
} from 'lucide-react';

const App: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const saved = localStorage.getItem('lumina_gpa_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isParsingText, setIsParsingText] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (semesters.length === 0) {
      localStorage.removeItem('lumina_gpa_data');
    } else {
      localStorage.setItem('lumina_gpa_data', JSON.stringify(semesters));
    }
  }, [semesters]);

  const globalRetakeAnalysis = useMemo(() => {
    const supersededIds = new Set<string>();
    const allCourses: (Course & { semIdx: number })[] = [];
    
    semesters.forEach((sem, semIdx) => {
      sem.courses.forEach(c => allCourses.push({ ...c, semIdx }));
    });

    const retakeCourses = allCourses.filter(c => c.isRetake);

    retakeCourses.forEach(retakeCourse => {
      const name = retakeCourse.name.trim().toLowerCase();
      if (!name) return;

      const previousAttempts = allCourses.filter(c => 
        c.name.trim().toLowerCase() === name && 
        c.semIdx <= retakeCourse.semIdx && 
        c.id !== retakeCourse.id
      );

      if (previousAttempts.length > 0) {
        const cluster = [retakeCourse, ...previousAttempts];
        const sorted = [...cluster].sort((a, b) => {
          const pointsA = DEFAULT_GRADE_SCALE.find(g => g.grade === a.grade)?.points ?? -1;
          const pointsB = DEFAULT_GRADE_SCALE.find(g => g.grade === b.grade)?.points ?? -1;
          return pointsB - pointsA;
        });

        sorted.slice(1).forEach(c => supersededIds.add(c.id));
      }
    });

    return supersededIds;
  }, [semesters]);

  const statsBySemester = useMemo(() => {
    return semesters.map((sem, currentSemIdx): SemesterStats => {
      let origPoints = 0;
      let origGpaCr = 0;
      
      const bestUpToNow = new Map<string, { points: number, credits: number }>();

      for (let i = 0; i <= currentSemIdx; i++) {
        semesters[i].courses.forEach(c => {
          const name = c.name.trim().toLowerCase();
          if (!name) return;
          const gInfo = DEFAULT_GRADE_SCALE.find(g => g.grade === c.grade);
          const cr = Number(c.credits) || 0;
          if (cr <= 0 || !gInfo || gInfo.points === null) return;

          const existing = bestUpToNow.get(name);
          const isBetter = gInfo.points > (existing?.points ?? -1);
          if (!existing || (c.isRetake && isBetter)) {
            bestUpToNow.set(name, { points: gInfo.points, credits: cr });
          }
        });
      }

      bestUpToNow.forEach(att => {
        origPoints += att.points * att.credits;
        origGpaCr += att.credits;
      });

      let revPoints = 0;
      let revGpaCr = 0;

      const courseNamesInHistory = new Set<string>();
      for (let i = 0; i <= currentSemIdx; i++) {
        semesters[i].courses.forEach(c => {
          const name = c.name.trim().toLowerCase();
          if (name) courseNamesInHistory.add(name);
        });
      }

      courseNamesInHistory.forEach(name => {
        const allAttempts = semesters.flatMap(s => s.courses).filter(c => c.name.trim().toLowerCase() === name);
        const firstInstance = allAttempts.find(c => !c.isRetake) || allAttempts[0];
        const retakes = allAttempts.filter(c => c.isRetake);
        
        const cluster = [firstInstance, ...retakes];
        const bestGlobally = cluster.reduce((best, curr) => {
          const ptsBest = DEFAULT_GRADE_SCALE.find(g => g.grade === best.grade)?.points ?? -1;
          const ptsCurr = DEFAULT_GRADE_SCALE.find(g => g.grade === curr.grade)?.points ?? -1;
          return ptsCurr > ptsBest ? curr : best;
        });

        const gInfoBest = DEFAULT_GRADE_SCALE.find(g => g.grade === bestGlobally.grade);
        const cr = Number(bestGlobally.credits) || 0;

        if (gInfoBest && gInfoBest.points !== null && cr > 0) {
          revPoints += gInfoBest.points * cr;
          revGpaCr += cr;
        }
      });

      let semPoints = 0, semGpaCr = 0, semEarned = 0;
      sem.courses.forEach(c => {
        const gInfo = DEFAULT_GRADE_SCALE.find(g => g.grade === c.grade);
        const cr = Number(c.credits) || 0;
        if (cr > 0 && gInfo) {
          if (gInfo.points !== null) {
            semPoints += gInfo.points * cr;
            semGpaCr += cr;
            if (c.grade !== 'F') semEarned += cr;
          } else if (c.grade === 'P') {
            semEarned += cr;
          }
        }
      });

      return {
        semesterCredits: semEarned,
        semesterGpa: semGpaCr > 0 ? semPoints / semGpaCr : 0,
        runningCgpa: origGpaCr > 0 ? origPoints / origGpaCr : 0,
        revisedCgpa: revGpaCr > 0 ? revPoints / revGpaCr : 0
      };
    });
  }, [semesters]);

  const stats = useMemo((): GPAResult => {
    const lastStat = statsBySemester[statsBySemester.length - 1];
    if (!lastStat) return { gpa: 0, totalCredits: 0, totalPoints: 0 };

    let totalPoints = 0;
    let totalGpaCr = 0;
    let totalEarned = 0;

    const uniqueCourseNames = new Set(semesters.flatMap(s => s.courses).map(c => c.name.trim().toLowerCase()).filter(Boolean));
    uniqueCourseNames.forEach(name => {
        const allAttempts = semesters.flatMap(s => s.courses).filter(c => c.name.trim().toLowerCase() === name);
        const first = allAttempts.find(a => !a.isRetake) || allAttempts[0];
        const retakes = allAttempts.filter(a => a.isRetake);
        const cluster = [first, ...retakes];
        const best = cluster.reduce((b, c) => {
           const pb = DEFAULT_GRADE_SCALE.find(g => g.grade === b.grade)?.points ?? -1;
           const pc = DEFAULT_GRADE_SCALE.find(g => g.grade === c.grade)?.points ?? -1;
           return pc > pb ? c : b;
        });

        const gInfo = DEFAULT_GRADE_SCALE.find(g => g.grade === best.grade);
        const cr = Number(best.credits) || 0;
        if (gInfo && gInfo.points !== null) {
          totalPoints += gInfo.points * cr;
          totalGpaCr += cr;
          if (best.grade !== 'F') totalEarned += cr;
        }
    });

    semesters.flatMap(s => s.courses).forEach(c => {
      if (c.grade === 'P' && !globalRetakeAnalysis.has(c.id)) {
        totalEarned += (Number(c.credits) || 0);
      }
    });

    return {
      gpa: totalGpaCr > 0 ? totalPoints / totalGpaCr : 0,
      totalCredits: totalEarned,
      totalPoints: totalPoints
    };
  }, [semesters, globalRetakeAnalysis, statsBySemester]);

  const addSemester = () => {
    let nextName = `Semester ${semesters.length + 1}`;
    
    if (semesters.length > 0) {
      const lastSem = semesters[semesters.length - 1];
      const match = lastSem.name.match(/(Monsoon|Spring|Summer|Winter)\s*\(?(\d{4})\)?/i);
      
      if (match) {
        const term = match[1].toLowerCase();
        const year = parseInt(match[2]);
        
        if (term === 'monsoon') {
          nextName = `Spring (${year + 1})`;
        } else if (term === 'spring') {
          nextName = `Summer (${year})`;
        } else if (term === 'summer') {
          nextName = `Monsoon (${year})`;
        } else if (term === 'winter') {
          nextName = `Spring (${year})`;
        }
      }
    } else {
      nextName = `Monsoon (${new Date().getFullYear()})`;
    }

    const newSem: Semester = {
      id: Math.random().toString(36).substr(2, 9),
      name: nextName,
      courses: []
    };
    setSemesters([...semesters, newSem]);
  };

  const updateSemester = (updated: Semester) => {
    setSemesters(semesters.map(s => s.id === updated.id ? updated : s));
  };

  const removeSemester = (id: string) => {
    setSemesters(semesters.filter(s => s.id !== id));
  };

  const handleReset = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 4000); 
      return;
    }
    
    localStorage.removeItem('lumina_gpa_data');
    setSemesters([]);
    setPastedText('');
    setIsTextModalOpen(false);
    setIsParsingText(false);
    setShowResetConfirm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTextParse = async () => {
    if (!pastedText.trim()) return;
    setIsParsingText(true);
    try {
      const parsed = await parseTextTranscript(pastedText);
      if (parsed.length > 0) {
        setSemesters([...semesters, ...parsed]);
        setIsTextModalOpen(false);
        setPastedText('');
      } else {
        alert("No valid courses found.");
      }
    } catch (e) {
      console.error(e);
      alert("Error parsing text.");
    } finally {
      setIsParsingText(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#D2232A] rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1D3D61] leading-none tracking-tight">GPAshoka</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University GPA Suite</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="text-[#D2232A]" size={24} />
                Course History
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleReset}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all group active:scale-95 shadow-sm ${
                    showResetConfirm 
                    ? 'bg-red-600 border-red-600 text-white animate-pulse' 
                    : 'bg-white border-slate-200 text-slate-500 hover:text-[#D2232A] hover:bg-red-50'
                  }`}
                  title={showResetConfirm ? "Click again to confirm reset" : "Reset all data"}
                >
                  {showResetConfirm ? (
                    <>
                      <AlertTriangle size={14} className="text-white" />
                      Confirm Reset?
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500 text-[#1D3D61]" />
                      Reset
                    </>
                  )}
                </button>
                <button 
                  onClick={addSemester}
                  className="flex items-center gap-2 bg-[#D2232A] hover:bg-[#b01c22] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-red-100 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Add Semester
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {semesters.map((sem, index) => (
                <SemesterCard
                  key={sem.id}
                  semester={sem}
                  stats={statsBySemester[index]}
                  onUpdate={updateSemester}
                  onRemove={() => removeSemester(sem.id)}
                  supersededCourseIds={globalRetakeAnalysis}
                />
              ))}

              {semesters.length === 0 && (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Trash2 size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No Academic History</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-8">
                    Your records are empty. Import your transcript or add semesters manually.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setIsTextModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#1D3D61] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#152e4a] transition-all shadow-xl"
                    >
                      Import AMS Data
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 sticky top-24">
               <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
                 <TrendingUp size={20} className="text-[#D2232A]" />
                 Academic Standing
               </h3>
               
               <div className="space-y-8">
                  <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100">
                    <span className="text-[#1D3D61] text-xs font-black uppercase tracking-widest block mb-2 opacity-60">Final Cumulative CGPA</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-[#1D3D61] tracking-tighter">{stats.gpa.toFixed(2)}</span>
                      <span className="text-slate-400 text-sm font-bold">/ 4.00</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Credits</span>
                      <span className="text-2xl font-black text-[#1D3D61] tracking-tight">{stats.totalCredits}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Grade Pts</span>
                      <span className="text-2xl font-black text-[#1D3D61] tracking-tight">{stats.totalPoints.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                     <HelpCircle size={20} className="text-blue-500 shrink-0" />
                     <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                       Scroll down to view detailed grading logic and retake supercession rules.
                     </p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-2 text-xl">
                 <BookCheck size={24} className="text-[#1D3D61]" />
                 Calculation Logic
               </h3>
               
               <ul className="space-y-5">
                  {[
                    { 
                      title: "4.0 Grading Scale", 
                      desc: "Uses the Ashoka scale: A=4.0, A-=3.7, B+=3.3, B=3.0, B-=2.7, C+=2.3, C=2.0, C-=1.7, D+=1.3, D=1.0, D-=0.7, F=0.0." 
                    },
                    { 
                      title: "Neutral Grades", 
                      desc: "P, NP, W, and INC grades are excluded from divisor and point totals entirely." 
                    },
                    { 
                      title: "Earned Credits", 
                      desc: "Earned for any grade of D- or higher, and for 'P' grades." 
                    },
                    { 
                      title: "Semester GPA", 
                      desc: "Isolated calculation for the courses in a single block without outside supercessions." 
                    },
                    { 
                      title: "Local Storage", 
                      desc: "All data is stored locally in your browser. No data leaves your machine." 
                    }
                  ].map((rule, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="mt-1 shrink-0">
                        <CheckCircle2 size={18} className="text-[#D2232A]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#1D3D61] leading-none mb-1.5 uppercase tracking-wide">{rule.title}</h4>
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{rule.desc}</p>
                      </div>
                    </li>
                  ))}
               </ul>
            </div>

            <div className="bg-[#1D3D61] rounded-3xl p-8 shadow-xl shadow-slate-200 text-white">
               <h3 className="font-bold text-white mb-8 flex items-center gap-2 text-xl">
                 <ListRestart size={24} className="text-red-400" />
                 Retake & Supercession Guide
               </h3>
               
               <div className="space-y-6">
                  {[
                    { 
                      title: "Enabling Retake Mode", 
                      desc: "Click the circular arrow icon on a course. This informs the engine that this attempt is intended to replace an older grade." 
                    },
                    { 
                      title: "Fuzzy Name Matching", 
                      desc: "The app links courses by title. Ensure 'Intro to Psych' is spelled identically across semesters for the replacement to trigger." 
                    },
                    { 
                      title: "Automatic Supercession", 
                      desc: "If multiple attempts of the same course exist, the system automatically finds the single best grade and ignores all lower ones." 
                    },
                    { 
                      title: "The 'Superseded' Label", 
                      desc: "Lower grades gain a yellow 'Superseded' badge. They remain in your history but contribute zero points and credits to your CGPA." 
                    },
                    { 
                      title: "Cumulative Impact", 
                      desc: "Retakes significantly boost Cumulative GPA (CGPA) by removing Fs or low grades, while preserving the original semester's historical record." 
                    }
                  ].map((guide, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="mt-1 font-black text-red-400/50 text-xl group-hover:text-red-400 transition-colors">
                        0{i+1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white/90 leading-none mb-2 uppercase tracking-wide">{guide.title}</h4>
                        <p className="text-[13px] text-slate-300 font-medium leading-relaxed">{guide.desc}</p>
                      </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center text-red-400">
                    <Info size={16} />
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    Pro-tip: Use Revised CGPA to preview your standing if you were to retake any current low-grade courses in the future.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>

      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D2232A] rounded-xl flex items-center justify-center text-white">
                  <ClipboardType size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Import AMS Data</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Local Processing Only</p>
                </div>
              </div>
              <button onClick={() => setIsTextModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-slate-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
                <Info size={18} className="text-[#D2232A] shrink-0 mt-0.5" />
                <span>Paste your <strong>AMS Course Report</strong> content. Manually toggle <strong>Retake</strong> on courses to replace previous attempts.</span>
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="go to the Grades & Evaluations' page on your AMS -> Ctrl+A -> Ctrl+C -> navigate back to this page -> Ctrl+V in this box. On macs, use Cmd instead of Ctrl."
                className="w-full h-80 p-5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#1D3D61] outline-none font-mono text-sm leading-relaxed bg-slate-50/50 text-slate-900 placeholder:text-slate-400 shadow-inner"
              />
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setIsTextModalOpen(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleTextParse}
                  disabled={!pastedText.trim() || isParsingText}
                  className="px-10 py-3 bg-[#D2232A] text-white font-black rounded-xl hover:bg-[#b01c22] transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-100"
                >
                  {isParsingText ? <Loader2 className="animate-spin" size={20} /> : <Calculator size={20} />}
                  Parse AMS History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
