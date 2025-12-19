
export interface Course {
  id: string;
  name: string;
  grade: string;
  credits: number;
  isRetake?: boolean;
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface SemesterStats {
  semesterCredits: number;
  semesterGpa: number;
  runningCgpa: number;
  revisedCgpa: number; // The CGPA considering future best attempts
}

export interface GradePoint {
  grade: string;
  points: number | null; // Use null for GPA-neutral grades like 'P' or 'NP'
}

export const DEFAULT_GRADE_SCALE: GradePoint[] = [
  { grade: 'A', points: 4.0 },
  { grade: 'A-', points: 3.7 },
  { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3.0 },
  { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 },
  { grade: 'C', points: 2.0 },
  { grade: 'C-', points: 1.7 },
  { grade: 'D+', points: 1.3 },
  { grade: 'D', points: 1.0 },
  { grade: 'D-', points: 0.7 },
  { grade: 'F', points: 0.0 },
  { grade: 'P', points: null },
  { grade: 'NP', points: null },
  { grade: 'INC', points: null },
  { grade: 'W', points: null },
];

export interface GPAResult {
  gpa: number;
  totalCredits: number; 
  totalPoints: number;
}
