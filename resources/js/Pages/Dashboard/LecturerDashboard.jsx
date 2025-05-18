import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/Tab";
import { Download, BookOpen, Calendar, Clock, Users } from "lucide-react";
import { Badge } from "../../Components/Badge";
import TimetableGrid from "../../MajorComponents/timetable/timetable-grid";
import { useToast } from "../../hooks/use-toast";
import Layout from '@/MajorComponents/layout/layout';
import SecondaryButton from '@/Components/SecondaryButton';
import { useQuery } from "@tanstack/react-query";
import { getCurrentAcademicInfo } from "../../utils/academicInfo";

export default function LecturerDashboard({ auth }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timetable");
  const [filters, setFilters] = useState({
    viewType: 'week'
  });

  // Fetch settings for academic information
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/settings');
      const data = await response.json();
      return data.settings;
    },
  });

  // Fetch lecturer's courses
  const { data: teachingCourses = [], isLoading: isCoursesLoading } = useQuery({
    queryKey: ['lecturerCourses'],
    queryFn: async () => {
      const response = await fetch('/lecturer/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    },
  });

  const { academicYear, semester, semesterName, currentWeek } = getCurrentAcademicInfo(settings);

  // Show loading state while data is being fetched
  if (isSettingsLoading || isCoursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format schedule for display
  const formatSchedule = (scheduleEntries) => {
    if (!scheduleEntries || scheduleEntries.length === 0) return 'No schedule set';
    
    return scheduleEntries
      .map(entry => `${entry.day} ${entry.start_time} - ${entry.end_time}`)
      .join(', ');
  };

  // Format room for display
  const formatRoom = (scheduleEntries) => {
    if (!scheduleEntries || scheduleEntries.length === 0) return 'No room assigned';
    
    return scheduleEntries
      .map(entry => entry.room)
      .filter((room, index, self) => room && self.indexOf(room) === index)
      .join(', ');
  };

  // Generate upcoming classes based on current courses and schedule
  const upcomingClasses = teachingCourses
    .flatMap(course => 
      course.schedule.map(scheduleEntry => ({
        id: `${course.id}-${scheduleEntry.day}-${scheduleEntry.start_time}`,
        course: course.code,
        courseName: course.name,
        dateTime: `${scheduleEntry.day} ${scheduleEntry.start_time} - ${scheduleEntry.end_time}`,
        room: scheduleEntry.room || 'No room assigned',
      }))
    )
    .slice(0, 5); // Show only next 5 upcoming classes

  const handleExport = () => {
    toast({
      title: "Exporting timetable",
      description: "Your timetable is being exported to PDF format.",
    });
    // In a real implementation, this would trigger a PDF generation
  };
  return (
    <>
      <Head title="Lecturer Dashboard" />
      <div className='sm:p-6 lg:p-8'>
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Lecturer Dashboard</h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Academic Year: {academicYear}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>{semester}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>{currentWeek}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <SecondaryButton variant="outline" onClick={handleExport}>
              <Download className="-ml-1 mr-2 h-5 w-5" />
              Export Schedule
            </SecondaryButton>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] mb-6 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="timetable">My Schedule</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="timetable" className="mt-6">
            <TimetableGrid
              filter={{
                academic_year: academicYear,
                semester: semesterName,
              }}
              viewType="week"
            />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Courses Teaching
                  </CardTitle>
                  <Badge variant="outline" className="ml-2">{teachingCourses.length} Courses</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {teachingCourses.map((course) => (
                  <div key={course.id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{course.name}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary" className="mr-2">{course.code}</Badge>
                          <span className="text-sm text-gray-500">{course.credits} Credits</span>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          {course.students} Students Enrolled
                        </div>
                        {course.department && (
                          <div className="text-sm text-gray-500 mt-1">
                            Department: {course.department}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatSchedule(course.schedule)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatRoom(course.schedule)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Classes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{classItem.courseName}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2">{classItem.course}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">Topic: {classItem.topic}</p>
                      </div>
                      <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                        <div className="flex items-center text-sm font-medium">
                          <Calendar className="h-4 w-4 mr-1" />
                          {classItem.dateTime}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {classItem.room}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}