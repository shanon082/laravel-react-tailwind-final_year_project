import { BookOpenIcon, User, Building, AlertCircleIcon } from 'lucide-react';
import StatsCard from './stats-card';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiRequest = async (method, url) => {
  const response = await axios({ method, url });
  return response.data;
};

const QuickStats = () => {
  // Fetch total courses
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['totalCourses'],
    queryFn: () => apiRequest('GET', '/total-courses'),
  });

  // Fetch total lecturers
  const { data: lecturersData, isLoading: isLecturersLoading } = useQuery({
    queryKey: ['totalLecturers'],
    queryFn: () => apiRequest('GET', '/total-lecturers'),
  });

  // Fetch available rooms
  const { data: roomsData, isLoading: isRoomsLoading } = useQuery({
    queryKey: ['availableRooms'],
    queryFn: () => apiRequest('GET', '/available-rooms'),
  });

  // Fetch total conflicts
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['totalDepartments'],
    queryFn: () => apiRequest('GET', '/total-departments'),
  });

  // Show loading state if any query is loading
  if (isCoursesLoading || isLecturersLoading || isRoomsLoading || isDepartmentsLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-40 animate-pulse">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 h-12 w-12"></div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatsCard
        title="Total Courses"
        value={coursesData?.totalCourses || 0}
        icon={<BookOpenIcon className="h-6 w-6 text-white" />}
        iconBgColor="bg-primary"
        linkText="View all courses"
        linkHref="/courses"
      />
      <StatsCard
        title="Lecturers"
        value={lecturersData?.totalLecturers || 0}
        icon={<User className="h-6 w-6 text-white" />}
        iconBgColor="bg-orange-500"
        linkText="View all lecturers"
        linkHref="/lecturers"
      />
      <StatsCard
        title="Available Rooms"
        value={roomsData?.availableRooms || 0}
        icon={<Building className="h-6 w-6 text-white" />}
        iconBgColor="bg-green-500"
        linkText="View all rooms"
        linkHref="/rooms"
      />
      <StatsCard
        title="Departments"
        value={departmentsData?.totalDepartments || 0}
        icon={<AlertCircleIcon className="h-6 w-6 text-white" />}
        iconBgColor="bg-red-500"
        linkText="view all departments"
        linkHref="/departments"
      />
    </div>
  );
};

export default QuickStats;