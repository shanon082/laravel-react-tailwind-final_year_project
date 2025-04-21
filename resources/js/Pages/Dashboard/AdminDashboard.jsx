import { Head, Link } from '@inertiajs/react';
import { useState, lazy, Suspense } from "react";
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../Components/Tab";
import { Download, Plus, AlertCircle, PieChart, BarChart, AlertCircleIcon, Calendar } from "lucide-react";
import { Badge } from "../../Components/Badge";
import { useToast } from "../../hooks/use-toast";
import Layout from '../../MajorComponents/layout/layout';
import { motion } from "framer-motion";
import SecondaryButton from '@/Components/SecondaryButton';

// Lazy load heavy components
const TimetableGrid = lazy(() => import("../../MajorComponents/timetable/timetable-grid"));
const QuickStats = lazy(() => import("../dashboard/quick-stats"));
const ConflictList = lazy(() => import("../../MajorComponents/conflicts/conflict-list"));
const FilterControls = lazy(() => import("../../MajorComponents/timetable/filter-controls"));

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-48 bg-gray-200 rounded"></div>
  </div>
);

export default function AdminDashboard({ auth }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    viewType: 'week',
  });

  const academicYear = "2023-2024";
  const semester = "First";
  const currentWeek = "3";

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/stats');
      const data = await response.json();
      return { courses: data.totalCourses, lecturers: data.totalLecturers, conflicts: data.totalConflicts };
    },
    // staleTime: 5 * 60 * 1000,
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    toast({
      title: "Filters Applied",
      description: "Timetable updated with new filters.",
      duration: 3000,
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your timetable is being exported to PDF. You'll be notified when it's ready.",
      duration: 5000,
    });
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Timetable PDF has been downloaded.",
        duration: 3000,
      });
    }, 2000);
  };

  return (
    <>
      <Head title="Admin Dashboard" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:pt-6 lg:pt-8" // Only add top padding, avoid stacking with Layout's horizontal padding
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Dashboard
            </h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <Badge variant="secondary">
                Academic Year: {academicYear}
              </Badge>
              <Badge variant="secondary">
                Semester: {semester}
              </Badge>
              <Badge variant="secondary">
                Week: {currentWeek}
              </Badge>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <SecondaryButton
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
              aria-label="Export timetable to PDF"
            >
              <Download className="h-5 w-5" />
              Export
            </SecondaryButton>
            <Link href="/timetable?generate=true">
              <Button
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark transition-colors"
                aria-label="Generate new timetable"
              >
                <Plus className="h-5 w-5" />
                Generate Timetable
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:px-6 lg:px-8">
          <TabsList className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { value: "overview", label: "Overview", icon: PieChart },
              { value: "timetable", label: "Timetables", icon: Calendar },
              { value: "conflicts", label: "Conflicts", icon: AlertCircle },
              { value: "analytics", label: "Analytics", icon: BarChart },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 py-2 px-4 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Suspense fallback={<SkeletonCard />}>
            <TabsContent value="overview" className="mt-6">
              {isStatsLoading ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <>
                  <QuickStats />
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold flex items-center">
                          <AlertCircleIcon className="h-5 w-5 mr-2 text-amber-500" />
                          Active Conflicts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ConflictList limit={3} />
                        <div className="mt-4 text-center">
                          <Link href="/timetable?conflicts=true">
                            <SecondaryButton
                              variant="outline"
                              size="sm"
                              className="hover:bg-gray-100"
                            >
                              View All Conflicts
                            </SecondaryButton>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold flex items-center">
                          <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                          Room Utilization
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                          <p className="text-gray-500">Room utilization chart (to be implemented)</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
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
                    semester,
                  }}
                  viewType={filters.viewType}
                />
              </div>
            </TabsContent>
            <TabsContent value="conflicts" className="mt-6">
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
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
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                      Course Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Course distribution chart (to be implemented)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                      Lecturer Workload
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                      <p className="text-gray-500">Lecturer workload chart (to be implemented)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Suspense>
        </Tabs>
      </motion.div>
    </>
  );
}