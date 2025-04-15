import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/Tab";
import { Download, Plus, AlertCircle, PieChart, BarChart } from "lucide-react";
import { Badge } from "../../Components/Badge";
import TimetableGrid from "../../MajorComponents/timetable/timetable-grid"; 
import QuickStats from "../dashboard/quick-stats";
import ConflictList from "../../MajorComponents/conflicts/conflict-list";
import FilterControls from "../../MajorComponents/timetable/filter-controls";   
import { useToast } from "../../hooks/use-toast";
import { Link } from "wouter";

export default function AdminDashboard({ auth }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    const [filters, setFilters] = useState({
      viewType: 'week'
    });
  
    // Get the current academic term info
    const academicYear = "2023-2024";
    const semester = "First";
    const currentWeek = "3";
    
    const handleFilterChange = (newFilters) => {
      setFilters(newFilters);
    };
  
    const handleExport = () => {
      toast({
        title: "Exporting timetable",
        description: "Your timetable is being exported to PDF format.",
      });
      // In a real implementation, this would trigger a PDF generation
    };
  
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Admin Dashboard" />
            <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">Admin Dashboard</h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Academic Year: {academicYear}</span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Semester: {semester}</span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span>Week: {currentWeek}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="-ml-1 mr-2 h-5 w-5" />
            Export
          </Button>
          
          <Link href="/timetable?generate=true">
            <Button>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Generate Timetable
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timetable">Timetables</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <QuickStats />
          
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                  Active Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConflictList limit={3} />
                <div className="mt-4 text-center">
                  <Link href="/timetable?conflicts=true">
                    <Button variant="outline" size="sm">View All Conflicts</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                  Room Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Room utilization chart will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timetable" className="mt-6">
          <FilterControls onFilterChange={handleFilterChange} />
          
          <div className="mt-6">
            <TimetableGrid 
              filter={{
                courseId: filters.courseId?.toString(),
                roomId: filters.room?.toString(),
                lecturerId: filters.lecturer?.toString(),
                day: filters.day,
                academicYear,
                semester
              }} 
              viewType={filters.viewType}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="conflicts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                All Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConflictList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                  Course Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Course distribution chart will appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                  Lecturer Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                  <p className="text-gray-500">Lecturer workload chart will appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
        </AuthenticatedLayout>
    );
}