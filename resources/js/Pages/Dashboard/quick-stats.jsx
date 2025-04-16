import { BookOpenIcon, Users, BuildingIcon, AlertCircleIcon, BookOpenTextIcon } from 'lucide-react';
import StatsCard from './stats-card';
import { useQuery } from '@tanstack/react-query';
import axios from "axios";

const QuickStats = () => {
  // const { data: stats, isLoading } = useQuery({
  //   queryKey: ['/api/stats'],
  // });
  const fetchStats = async () => {
    const response = await axios.get("/api/stats");
    return response.data;
  };
  
  const { data:stats, isLoading, error } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: fetchStats
  });

  if (isLoading) {
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
        value={stats?.totalCourses || 0}
        icon={<BookOpenIcon className="h-6 w-6 text-white" />}
        iconBgColor="bg-primary"
        linkText="View all courses"
        linkHref="/courses"
      />
      
      <StatsCard 
        title="Lecturers"
        value={stats?.totalLecturers || 0}
        icon={<Users className="h-6 w-6 text-white" />}
        iconBgColor="bg-secondary"
        linkText="View all lecturers"
        linkHref="/lecturers"
      />
      
      <StatsCard 
        title="Available Rooms"
        value={stats?.availableRooms || 0}
        icon={<BuildingIcon className="h-6 w-6 text-white" />}
        iconBgColor="bg-accent"
        linkText="View all rooms"
        linkHref="/rooms"
      />
      
      <StatsCard 
        title="Conflicts"
        value={stats?.totalConflicts || 0}
        icon={<AlertCircleIcon className="h-6 w-6 text-white" />}
        iconBgColor="bg-red-500"
        linkText="Resolve conflicts"
        linkHref="/timetable?showConflicts=true"
      />
    </div>
  );
};

export default QuickStats;