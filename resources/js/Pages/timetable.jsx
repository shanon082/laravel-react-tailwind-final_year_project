import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentAcademicInfo } from "../utils/academicInfo";
import Layout from "../MajorComponents/layout/layout";
import FilterControls from "../MajorComponents/timetable/filter-controls";
import TimetableGrid from "../MajorComponents/timetable/timetable-grid";
import ConflictList from "../MajorComponents/conflicts/conflict-list";
import TimetableGenerator from "../MajorComponents/timetable/timetable-generator";
import { Day } from "../types";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { useLocation } from "wouter";
import { Head } from "@inertiajs/react";
import { Button } from "@/Components/Button";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";

const Timetable = ({ auth, timetable = [], conflicts = [], filters = {}, error }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const showConflicts = params.get("showConflicts") === "true";
  const [showGenerator, setShowGenerator] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    viewType: 'week',
    ...filters
  });

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/settings');
      const data = await response.json();
      return data.settings;
    },
  });

  const { academicYear, semester, semesterName, currentWeek } = getCurrentAcademicInfo(settings);

  const { data: timeSlots = [] } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/timeslots');
      return response || [];
    }
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

  const handleFilterChange = (newFilters) => {
    setCurrentFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const toggleGenerator = () => {
    setShowGenerator(prev => !prev);
  };

  return (
    <Layout user={auth.user}>
      <Head title="Timetable" />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Timetable Management
            </h1>
            <Button onClick={toggleGenerator}>
              {showGenerator ? "Hide Generator" : "Generate Timetable"}
            </Button>
          </div>

          {showGenerator && (
            <TimetableGenerator
              academicYear={currentFilters.academic_year}
              semester={currentFilters.semester}
            />
          )}

          <FilterControls
            onFilterChange={handleFilterChange}
            defaultFilters={currentFilters}
          />

          <TimetableGrid
            filter={currentFilters}
            viewType={currentFilters.viewType}
            timetable={timetable}
            timeSlots={timeSlots}
          />

          {conflicts.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium mb-2">Conflicts Found:</h3>
              <ul className="list-disc list-inside text-red-700">
                {conflicts.map((conflict, index) => (
                  <li key={index}>{conflict.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Timetable;