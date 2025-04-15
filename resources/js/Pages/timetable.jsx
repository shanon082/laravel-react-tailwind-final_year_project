import { useState } from "react";
import Layout from "../components/layout/layout";
import FilterControls from "../components/timetable/filter-controls";
import TimetableGrid from "../components/timetable/timetable-grid";
import ConflictList from "../components/conflicts/conflict-list";
import TimetableGenerator from "../components/timetable/timetable-generator";
import { Filter, Day } from "../types/index";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { useLocation } from "wouter";

const Timetable = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [filters, setFilters] = useState<Filter>({
    viewType: 'week'
  });

  // Parse query parameters
  const params = new URLSearchParams(location.split("?")[1]);
  const showConflicts = params.get("showConflicts") === "true";
  const showGenerator = params.get("generate") === "true";

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const academicYear = "2023-2024";
  const semester = "First";

  return (
    <Layout>
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

export default Timetable;
