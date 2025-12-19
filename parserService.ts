
import { Semester } from "./types";

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * High-performance local parser specifically for Ashoka University's 
 * "My Course Report" layout.
 */
export const parseTranscriptLocally = (rawText: string): Semester[] => {
  const lines = rawText.split('\n');
  const semesters: Semester[] = [];
  let currentSemester: Semester | null = null;

  // Pattern for Semester Headings (e.g., "Monsoon 2023", "Spring 2024")
  const semesterRegex = /^(Monsoon|Spring|Summer|Winter)\s+(\d{4})$/i;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 1. Detect Semester Heading
    const semMatch = trimmed.match(semesterRegex);
    if (semMatch) {
      currentSemester = {
        id: generateId(),
        name: semMatch[0].trim(),
        courses: []
      };
      semesters.push(currentSemester);
      return;
    }

    // 2. Identify Course Rows by Signature
    // Format: [Index] [Code] [Title...] [RegCr] [Grade] [EarnedCr] [Points]
    const parts = trimmed.split(/\s+/);
    
    // An Ashoka course row typically has at least 6 parts:
    // Index, Code, Title (1+ parts), RegCr, Grade, EarnedCr, Points
    if (parts.length >= 6) {
      const isIndex = /^\d+$/.test(parts[0]);
      if (isIndex) {
        // Last 4 parts are usually: RegCr, Grade, EarnedCr, Pts
        const lastFour = parts.slice(-4);
        const [regCrStr, grade, earnedCrStr, ptsStr] = lastFour;

        // Validation: RegCr must be a number, Grade must look like a grade or "--"
        const regCr = parseFloat(regCrStr);
        const isGrade = /^[A-DFP][+-]?$|^--$|^P$|^NP$|^INC$|^W$/i.test(grade);

        if (!isNaN(regCr) && isGrade) {
          // Everything between the Index/Code and the last 4 items is the Title/Code
          const nameAndCode = parts.slice(1, -4).join(' ').trim();

          if (currentSemester && nameAndCode) {
            currentSemester.courses.push({
              id: generateId(),
              name: nameAndCode,
              grade: grade === "--" ? "" : grade.toUpperCase(),
              credits: regCr,
              isRetake: false
            });
          }
        }
      }
    }
  });

  // Filter out empty semesters and return
  return semesters.filter(s => s.courses.length > 0);
};

export const parseTextTranscript = async (rawText: string): Promise<Semester[]> => {
  return new Promise((resolve) => {
    const results = parseTranscriptLocally(rawText);
    resolve(results);
  });
};
