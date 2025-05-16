export function getCurrentAcademicInfo(settings) {
  if (!settings || !settings.semesters) {
    return {
      academicYear: 'Loading...',
      semester: 'Loading...',
      semesterName: '',
      currentWeek: 'Loading...',
    };
  }
  const currentDate = new Date();
  const semester = settings.semesters.find(sem => {
    const start = new Date(sem.start_date);
    const end = new Date(sem.end_date);
    return currentDate >= start && currentDate <= end;
  }) || settings.semesters[0];

  let currentWeek = 'N/A';
  let semesterName = semester ? semester.name : '';
  if (semester) {
    const start = new Date(semester.start_date);
    const diff = currentDate - start;
    if (diff >= 0) {
      currentWeek = `Week ${Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1}`;
    }
  }
  return {
    academicYear: settings.academic_year || 'N/A',
    semester: semester ? `Semester ${semester.name}` : 'N/A',
    semesterName,
    currentWeek,
  };
}