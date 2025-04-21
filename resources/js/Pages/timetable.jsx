import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import FilterControls from "../MajorComponents/timetable/filter-controls";
import TimetableGrid from "../MajorComponents/timetable/timetable-grid";
import ConflictList from "../MajorComponents/conflicts/conflict-list";
import TimetableGenerator from "../MajorComponents/timetable/timetable-generator";
import { Filter, Day } from "../types/index";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { useLocation } from "wouter";
import { Head } from "@inertiajs/react";

const Timetable = ({auth}) => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [filters, setFilters] = useState({
    viewType: "week",
    courseId: null,
    roomId: null,
    lecturerId: null,
    day: null,
    department: null,
    level: null,
  });

  // Parse query parameters
  const params = new URLSearchParams((location && typeof location === 'string' && location.includes("?") && location.split("?")[1]) || "");
  const showConflicts = params.get("showConflicts") === "true";
  const showGenerator = params.get("generate") === "true";

  const handleFilterChange = (newFilters) => {
    setFilters({
      viewType: newFilters.viewType || "week",
      courseId: newFilters.courseId,
      roomId: newFilters.room,
      lecturerId: newFilters.lecturer,
      day: newFilters.day !== "all" ? newFilters.day : null,
      department: newFilters.department !== "all" ? newFilters.department : null,
      level: newFilters.level !== "all" ? newFilters.level : null,
    });
  };

  const academicYear = "2023-2024";
  const semester = "First";

  return (
    <Layout user={auth.user}>
      <Head title="Timetable" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          Timetable
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          View and manage the university timetable for {academicYear}, {semester} semester.
        </p>
      </div>

      {user?.role === UserRole.ADMIN && showGenerator && (
        <TimetableGenerator academicYear={academicYear} semester={semester} />
      )}

      <FilterControls onFilterChange={handleFilterChange} defaultFilters={filters} />
      
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
      
      {showConflicts && <ConflictList />}
    </Layout>
  );
};

export default Timetable

