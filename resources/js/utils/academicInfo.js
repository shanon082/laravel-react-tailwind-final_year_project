export function getCurrentAcademicInfo(settings) {
  // Default values for when settings are not available
  const defaultInfo = {
    academicYear: 'Not Set',
    semester: 'Not Set',
    semesterName: '',
    currentWeek: 'N/A',
    isCurrentSemester: false,
    semesterStartDate: null,
    semesterEndDate: null,
    totalWeeks: 0
  };

  // If settings are not available or invalid, return default values
  if (!settings || !settings.semesters || !Array.isArray(settings.semesters) || settings.semesters.length === 0) {
    console.warn('Settings or semesters data is missing or invalid:', settings);
    return defaultInfo;
  }

  try {
    const currentDate = new Date();
    
    // Find the current semester
    const semester = settings.semesters.find(sem => {
      if (!sem.start_date || !sem.end_date) return false;
      const start = new Date(sem.start_date);
      const end = new Date(sem.end_date);
      return currentDate >= start && currentDate <= end;
    }) || settings.semesters[0];

    // If no valid semester found, return default values
    if (!semester || !semester.start_date || !semester.end_date) {
      console.warn('No valid semester found in settings:', settings);
      return defaultInfo;
    }

    const start = new Date(semester.start_date);
    const end = new Date(semester.end_date);
    const isCurrentSemester = currentDate >= start && currentDate <= end;

    // Calculate current week
    let currentWeek = 'N/A';
    let totalWeeks = 0;
    
    if (start && end) {
      const diff = currentDate - start;
      const totalDiff = end - start;
      
      if (diff >= 0) {
        currentWeek = `Week ${Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1}`;
        totalWeeks = Math.ceil(totalDiff / (1000 * 60 * 60 * 24 * 7));
      }
    }

    return {
      academicYear: settings.academic_year || 'Not Set',
      semester: semester ? `Semester ${semester.name}` : 'Not Set',
      semesterName: semester.name || '',
      currentWeek,
      isCurrentSemester,
      semesterStartDate: start,
      semesterEndDate: end,
      totalWeeks,
      // Add additional useful information
      daysRemaining: isCurrentSemester ? Math.ceil((end - currentDate) / (1000 * 60 * 60 * 24)) : 0,
      semesterProgress: isCurrentSemester ? 
        Math.min(100, Math.max(0, ((currentDate - start) / (end - start)) * 100)) : 0
    };
  } catch (error) {
    console.error('Error calculating academic info:', error);
    return defaultInfo;
  }
}

// Helper function to format dates
export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to get semester status
export function getSemesterStatus(semester) {
  if (!semester || !semester.start_date || !semester.end_date) {
    return 'Not Set';
  }

  const currentDate = new Date();
  const start = new Date(semester.start_date);
  const end = new Date(semester.end_date);

  if (currentDate < start) {
    return 'Upcoming';
  } else if (currentDate > end) {
    return 'Completed';
  } else {
    return 'Current';
  }
}