// Since we're in JavaScript, we'll define the same enums from schema.ts here
// This ensures we have the same values in our JS files

// Define UserRole enum
export const UserRole = {
  ADMIN: "admin", 
  LECTURER: "lecturer", 
  STUDENT: "student"
};

// Define Day enum
export const Day = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY", 
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY"
};

// Common constants and utility functions can still be defined here
export const CourseColors = {
  COURSE_1: 'course-1',  // red
  COURSE_2: 'course-2',  // amber
  COURSE_3: 'course-3',  // green
  COURSE_4: 'course-4',  // blue
  COURSE_5: 'course-5',  // violet
  COURSE_6: 'course-6',  // pink
  COURSE_7: 'course-7',  // teal
  COURSE_8: 'course-8'   // orange
};

export const ViewTypes = {
  WEEK: 'week',
  DAY: 'day',
  LIST: 'list'
};

// Define a Filter structure for filters used in the timetable
export const Filter = {
  viewType: ViewTypes.WEEK, // Use ViewTypes.WEEK for consistency
  courseId: null,
  room: null,
  lecturer: null,
  day: null
};

// Define a function to create a StatsData object
export function createStatsData(totalCourses, totalLecturers, availableRooms, totalConflicts) {
  return {
    totalCourses,
    totalLecturers,
    availableRooms,
    totalConflicts
  };
}