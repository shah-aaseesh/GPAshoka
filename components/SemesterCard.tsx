
import React, { useState } from 'react';
import { Semester, Course, SemesterStats } from '../types';
import { CourseRow } from './CourseRow';
import { PlusCircle, Trash2, BarChart3, TrendingUp, BookOpen, Sparkles, ChevronDown } from 'lucide-react';

interface SemesterCardProps {
  semester: Semester;
  stats: SemesterStats;
  onUpdate: (updated: Semester) => void;
  onRemove: () => void;
  supersededCourseIds: Set<string>;
}

export const SemesterCard: React.FC<SemesterCardProps> = ({ semester, stats, onUpdate, onRemove, supersededCourseIds }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const addCourse = () => {
    const newCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      grade: 'A',
      credits: 4,
      isRetake: false
    };
    onUpdate({ ...semester, courses: [...semester.courses, newCourse] });
  };

  const updateCourse = (updatedCourse: Course) => {
    onUpdate({
      ...semester,
      courses: semester.courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)),
    });
  };

  const removeCourse = (id: string) => {
    onUpdate({
      ...semester,
      courses: semester.courses.filter((c) => c.id !== id),
    });
  };

  const hasImprovement = Math.abs(stats.revisedCgpa - stats.runningCgpa) > 0.001;

  // Ashoka Term Generation
  const currentYear = new Date().getFullYear();
  const terms = ['Monsoon', 'Spring', 'Summer'];
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 4 + i);
  
  const semesterOptions = years.flatMap(y => terms.map(t => `${t} (${y})`));

  const handleSelectTerm = (term: string) => {
    onUpdate({ ...semester, name: term });
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative z-20">
        <div className="flex items-center gap-3 w-full">
          <BookOpen size={18} className="text-[#D2232A] shrink-0" />
          
          <div className="relative group flex items-center gap-1">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-slate-200/50 transition-all font-bold text-[#1D3D61] text-lg outline-none group"
            >
              {semester.name}
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-20 animate-in zoom-in-95 duration-100">
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                      Select Term
                    </div>
                    {semesterOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectTerm(opt)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                          semester.name === opt 
                          ? 'bg-red-50 text-[#D2232A]' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#1D3D61]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-2 pt-2">
                       <input 
                         type="text" 
                         className="w-full px-4 py-2 text-sm font-medium bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-slate-300 outline-none"
                         placeholder="Custom Name..."
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             handleSelectTerm(e.currentTarget.value);
                           }
                         }}
                       />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-300 hover:text-[#D2232A] p-1.5 transition-colors rounded-lg hover:bg-red-50"
          title="Delete Semester"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="p-5">
        <div className="space-y-1">
          {semester.courses.map((course) => (
            <CourseRow
              key={course.id}
              course={course}
              onUpdate={updateCourse}
              onRemove={() => removeCourse(course.id)}
              isSuperseded={supersededCourseIds.has(course.id)}
            />
          ))}
        </div>
        
        <button
          onClick={addCourse}
          className="mt-4 flex items-center gap-2 text-[#D2232A] font-semibold hover:text-[#b01c22] transition-colors py-2 px-3 rounded-lg hover:bg-red-50"
        >
          <PlusCircle size={18} />
          Add Course
        </button>
      </div>

      <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 flex flex-wrap gap-6 items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Semester Credits</span>
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <span className="text-lg">{stats.semesterCredits}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Semester GPA</span>
          <div className="flex items-center gap-1.5 text-[#1D3D61] font-bold">
            <BarChart3 size={16} />
            <span className="text-lg">{stats.semesterGpa.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col ml-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 text-right">Cumulative GPA</span>
          <div className="flex items-center gap-2 justify-end">
            <div className={`flex items-center gap-1.5 font-bold ${hasImprovement ? 'text-slate-400 line-through text-sm' : 'text-[#1D3D61]'}`}>
              {!hasImprovement && <TrendingUp size={16} className="text-[#D2232A]" />}
              <span className={hasImprovement ? 'text-sm' : 'text-xl'}>{stats.runningCgpa.toFixed(2)}</span>
            </div>
            {hasImprovement && (
              <div className="flex items-center gap-1.5 text-[#D2232A] font-black animate-in fade-in slide-in-from-right-2">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-xl">{stats.revisedCgpa.toFixed(2)}</span>
                <span className="text-[8px] bg-red-100 text-[#D2232A] px-1 py-0.5 rounded font-black uppercase tracking-tighter">New CGPA</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
