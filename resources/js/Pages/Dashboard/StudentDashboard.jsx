import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/Tab";
import { Download, GraduationCap, Book, Clock } from "lucide-react";
import { Badge } from "../../Components/Badge";
import TimetableGrid from "../../MajorComponents/timetable/timetable-grid";
import { useToast } from "../../hooks/use-toast";
import { useState, useEffect } from 'react';
import Layout from '@/MajorComponents/layout/layout';
import SecondaryButton from '@/Components/SecondaryButton';
import { getCurrentAcademicInfo } from "../../utils/academicInfo";
import StudentInfoModal from "@/Components/StudentInfoModal";
import axios from 'axios';

export default function StudentDashboard({ auth }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timetable");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [filters, setFilters] = useState({
    viewType: 'week'
  });

  // Fetch settings for academic information
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await response.json();
        return data || {}; // Return empty object if no data
      } catch (error) {
        console.error('Settings fetch error:', error);
        return {}; // Return empty object on error
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch student info
  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['studentInfo'],
    queryFn: async () => {
      const response = await axios.get('/api/student/info');
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.year_of_study || !data.department_id) {
        setShowInfoModal(true);
      }
      setStudentInfo(data);
    },
  });

  // Get enrolled courses based on student info
  const { data: enrolledCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['enrolledCourses', studentInfo?.department_id, studentInfo?.year_of_study],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/student/courses', {
          params: {
            department_id: studentInfo?.department_id,
            year_of_study: studentInfo?.year_of_study,
          }
        });
        return response.data || [];
      } catch (error) {
        console.error('Courses fetch error:', error);
        return [];
      }
    },
    enabled: !!studentInfo?.department_id && !!studentInfo?.year_of_study,
  });

  // Get academic info after all hooks
  const { academicYear, semester, semesterName, currentWeek } = getCurrentAcademicInfo(settings || {});

  // Show loading state while data is being fetched
  if (isSettingsLoading || isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Sample courses data
  const sampleCourses = [
    {
      id: 1,
      code: "CSC101",
      name: "Introduction to Computer Science",
      credits: 3,
      lecturer: "Dr. John Smith",
      schedule: "Mon, Wed 10:00 - 12:00",
      room: "Block A, Room 101"
    },
    {
      id: 2,
      code: "MTH102",
      name: "Calculus I",
      credits: 4,
      lecturer: "Prof. Sarah Johnson",
      schedule: "Tue, Thu 8:00 - 10:00",
      room: "Block B, Room 203"
    },
    {
      id: 3,
      code: "ENG103",
      name: "Technical Writing",
      credits: 3,
      lecturer: "Dr. Michael Brown",
      schedule: "Fri 14:00 - 17:00",
      room: "Block C, Room 105"
    },
  ];

  // Sample upcoming assignments
  const upcomingAssignments = [
    {
      id: 1,
      title: "Programming Assignment 1",
      course: "CSC101",
      dueDate: "Oct 15, 2023",
      status: "pending"
    },
    {
      id: 2,
      title: "Calculus Problem Set",
      course: "MTH102",
      dueDate: "Oct 18, 2023",
      status: "pending"
    },
    {
      id: 3,
      title: "Essay Draft",
      course: "ENG103",
      dueDate: "Oct 20, 2023",
      status: "pending"
    },
  ];

  const handleExport = () => {
    toast({
      title: "Exporting timetable",
      description: "Your timetable is being exported to PDF format.",
    });
  };

  return (
    <>
      <Head title="Student_Dashboard" />
      <StudentInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)} 
      />
      <div className='sm:p-6 lg:p-8'>
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Student Dashboard</h1>
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
              Export Timetable
            </SecondaryButton>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="timetable">My Timetable</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="timetable" className="mt-6">
            <TimetableGrid
              filter={{
                academic_year: academicYear,
                semester: semesterName,
                department_id: studentInfo?.department_id,
                year_of_study: studentInfo?.year_of_study,
              }}
              viewType="week"
            />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <Book className="h-5 w-5 mr-2" />
                    Enrolled Courses
                  </CardTitle>
                  <Badge variant="outline" className="ml-2">{enrolledCourses.length} Courses</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{course.name}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="secondary" className="mr-2">{course.code}</Badge>
                          <span className="text-sm text-gray-500">{course.credits} Credits</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Lecturer: {course.lecturer}</p>
                      </div>
                      <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.schedule}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {course.room}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Upcoming Assignments
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment.id} className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{assignment.title}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2">{assignment.course}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-medium">Due: {assignment.dueDate}</div>
                        <Badge
                          variant={assignment.status === "completed" ? "success" : "secondary"}
                          className="mt-1"
                        >
                          {assignment.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
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