
import React from 'react';
import { Course, DEFAULT_GRADE_SCALE } from '../types';
import { Trash2, AlertCircle, RotateCcw } from 'lucide-react';

interface CourseRowProps {
  course: Course;
  onUpdate: (updated: Course) => void;
  onRemove: () => void;
  isSuperseded?: boolean;
}

export const CourseRow: React.FC<CourseRowProps> = ({ course, onUpdate, onRemove, isSuperseded }) => {
  const isFailed = course.grade === 'F';

  return (
    <div className={`grid grid-cols-12 gap-3 items-center mb-2 group p-2 rounded-xl border-2 transition-all animate-in fade-in slide-in-from-top-1 duration-200 ${
      isFailed 
        ? 'border-[#D2232A] bg-red-50/40 shadow-sm' 
        : isSuperseded
        ? 'border-amber-200 bg-amber-50/30 opacity-75'
        : 'border-transparent hover:bg-slate-50'
    }`}>
      <div className="col-span-5 md:col-span-6 flex items-center gap-2">
        {isFailed && <AlertCircle size={18} className="text-[#D2232A] shrink-0" />}
        <div className="relative w-full">
          <input
            type="text"
            value={course.name || ''}
            onChange={(e) => onUpdate({ ...course, name: e.target.value })}
            placeholder="Course Name"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1D3D61] focus:border-[#1D3D61] outline-none transition-all text-sm md:text-base font-medium text-slate-900 placeholder:text-slate-400 ${
              isFailed ? 'bg-white border-red-100' : 'bg-white border-slate-200'
            }`}
          />
          {isSuperseded && (
            <span className="absolute -top-2 -right-1 bg-amber-500 text-[8px] text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">
              Superseded
            </span>
          )}
        </div>
      </div>
      
      <div className="col-span-2 md:col-span-1 flex justify-center">
        <button
          onClick={() => onUpdate({ ...course, isRetake: !course.isRetake })}
          className={`p-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
            course.isRetake 
              ? 'bg-[#1D3D61] text-white shadow-md' 
              : 'bg-slate-100 text-slate-400 hover:text-[#D2232A] hover:bg-red-50'
          }`}
          title={course.isRetake ? "Marked as Retake" : "Mark as Retake"}
        >
          <RotateCcw size={16} />
          <span className="text-[8px] font-bold uppercase leading-none">Retake</span>
        </button>
      </div>

      <div className="col-span-2 md:col-span-2">
        <select
          value={course.grade}
          onChange={(e) => onUpdate({ ...course, grade: e.target.value })}
          className={`w-full px-2 py-2 border-none rounded-lg focus:ring-2 outline-none transition-all text-sm md:text-base font-bold cursor-pointer ${
            isFailed 
              ? 'bg-[#D2232A] text-white hover:bg-[#b01c22] focus:ring-red-400' 
              : isSuperseded
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-[#1D3D61] text-white hover:bg-[#152e4a] focus:ring-[#D2232A]'
          }`}
        >
          <option value="" className="bg-slate-800 text-white">Grade</option>
          {DEFAULT_GRADE_SCALE.map((g) => (
            <option key={g.grade} value={g.grade} className="bg-slate-800 text-white font-medium">
              {g.grade}
            </option>
          ))}
        </select>
      </div>
      
      <div className="col-span-2 md:col-span-2">
        <input
          type="number"
          min="0"
          step="0.5"
          value={course.credits || ''}
          onChange={(e) => onUpdate({ ...course, credits: parseFloat(e.target.value) || 0 })}
          placeholder="Cr."
          className={`w-full px-2 py-2 border-none rounded-lg focus:ring-2 outline-none transition-all text-sm md:text-base text-center font-bold placeholder:text-slate-300 ${
            isFailed 
              ? 'bg-[#D2232A] text-white focus:ring-red-400' 
              : isSuperseded
              ? 'bg-amber-600 text-white'
              : 'bg-[#1D3D61] text-white focus:ring-[#D2232A]'
          }`}
        />
      </div>
      
      <div className="col-span-1 flex justify-center">
        <button
          onClick={onRemove}
          className={`p-2 transition-colors rounded-full ${
            isFailed ? 'text-[#D2232A] hover:bg-red-100' : 'text-slate-300 hover:text-[#D2232A] hover:bg-red-50'
          }`}
          title="Remove course"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
