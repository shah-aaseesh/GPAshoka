# GPAshoka: University GPA Suite

A high-performance, privacy-focused GPA calculator specifically designed for **Ashoka University's** grading system.

## 🚀 Features

- **AMS Integration**: Instantly import your entire academic history by pasting text from the "My Course Report" page on the AMS.
- **Retake Management**: Automatically handles course supercessions. If you retake a course, the system identifies the best attempt and excludes lower grades from the CGPA divisor.
- **Local & Private**: All parsing and calculations happen in your browser. Your academic data never leaves your machine.
- **Smart CGPA Projections**: View both your "Running CGPA" (as it stands now) and "Revised CGPA" (predicting the impact of retakes).
- **Ashoka Grading Scale**: Pre-configured with A=4.0, A-=3.7, etc., and supports neutral grades like P, NP, W, and INC.

## 🛠️ Built With

- **React 19**
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)
- **Regex-based Local Parser** (High-performance text extraction)

## 📖 How to Use

1. **Add Semesters**: Use the "Add Semester" button to create blocks manually.
2. **Import Data**: Click "Import AMS Data", go to your AMS Course Report, copy everything (Ctrl+A, Ctrl+C), and paste it into the box.
3. **Toggle Retakes**: For any course you've retaken, click the "Retake" icon on the latest attempt. The app will automatically find the matching previous course name and supersede the lower grade.
4. **Data Persistence**: Your data is automatically saved to your browser's LocalStorage.

## ⚖️ License

MIT License - feel free to use and modify.
