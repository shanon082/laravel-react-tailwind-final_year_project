import { useState, useEffect } from "react";
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

const Timetable = ({ auth, flash }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const showConflicts = params.get("showConflicts") === "true";
  const academicYear = params.get("academic_year") || "2023-2024";
  const semester = params.get("semester") || "First";
  const [showGenerator, setShowGenerator] = useState(false);

  const [filters, setFilters] = useState({
    viewType: "week",
    course_id: null,
    room_id: null,
    lecturer_id: null,
    day: null,
    department: null,
    level: null,
  });

  // Display flash messages as toasts
  useEffect(() => {
    if (flash?.error) {
      toast({
        title: "Error",
        description: flash.error,
        variant: "destructive",
        duration: 5000,
      });
    }
    if (flash?.success) {
      toast({
        title: "Success",
        description: flash.success,
        variant: "default",
        duration: 5000,
      });
    }
  }, [flash, toast]);

  const handleFilterChange = (newFilters) => {
    setFilters({
      viewType: newFilters.viewType || "week",
      course_id: newFilters.course_id,
      room_id: newFilters.room_id,
      lecturer_id: newFilters.lecturer_id,
      day: newFilters.day !== "all" ? newFilters.day : null,
      department: newFilters.department !== "all" ? newFilters.department : null,
      level: newFilters.level !== "all" ? newFilters.level : null,
    });
  };

  const toggleGenerator = () => {
    setShowGenerator(!showGenerator);
  };

  return (
    <Layout user={auth.user}>
      <Head title="Timetable" />
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Timetable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage the university timetable for {academicYear}, {semester} semester.
          </p>
        </div>
        {user?.role === UserRole.ADMIN && (
          <Button onClick={toggleGenerator}>
            {showGenerator ? "Hide Generator" : "Generate Timetable"}
          </Button>
        )}
      </div>

      {user?.role === UserRole.ADMIN && showGenerator && (
        <TimetableGenerator academicYear={academicYear} semester={semester} />
      )}

      <FilterControls onFilterChange={handleFilterChange} defaultFilters={filters} />
      
      <TimetableGrid 
        filter={{
          course_id: filters.course_id?.toString(),
          room_id: filters.room_id?.toString(),
          lecturer_id: filters.lecturer_id?.toString(),
          day: filters.day,
          academic_year: academicYear,
          semester: semester,
          department: filters.department,
          level: filters.level,
        }}
        viewType={filters.viewType}
      />
      
      {showConflicts && <ConflictList />}
    </Layout>
  );
};

export default Timetable;