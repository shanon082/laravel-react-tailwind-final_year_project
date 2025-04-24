import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import CourseList from "../MajorComponents/courses/course-list";
import CourseForm from "../MajorComponents/courses/course-form";
import Modal from "../components/modal";
import { Button } from "../components/button";
import { Plus, Filter } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head, router } from "@inertiajs/react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../Components/card";
import { Input } from "../Components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Components/select";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "../Components/ErrorBoundary";
import SecondaryButton from "@/Components/SecondaryButton";

const Courses = ({ auth, coursesResponse, filters }) => {
  console.log("Courses props:", { auth, coursesResponse, filters });
  const { user } = useAuth();
  const [modalState, setModalState] = useState({
    isOpen: false,
    courseId: null,
    isEditMode: false,
  });
  const [filterState, setFilterState] = useState({
    search: filters?.search || "",
    department: filters?.department || "",
    yearLevel: filters?.yearLevel || "",
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  // Fetch departments for the filter dropdown
  const { data: departments, isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/departments");
      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.statusText}`);
      }
      const departmentsData = await response.json();
      return Array.isArray(departmentsData) ? departmentsData : [];
    },
  });

  const openModal = (courseId = null, isEditMode = false) => {
    setModalState({ isOpen: true, courseId, isEditMode });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, courseId: null, isEditMode: false });
  };

  const handleAddClick = () => {
    openModal(null, false);
  };

  const handleEditClick = (courseId) => {
    openModal(courseId, true);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filterState, [key]: value };
    setFilterState(newFilters);
    router.get(
      route("courses"),
      {
        search: newFilters.search,
        department: newFilters.department === "all" ? "" : newFilters.department,
        yearLevel: newFilters.yearLevel,
        per_page: 10,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  const clearFilters = () => {
    setFilterState({ search: "", department: "", yearLevel: "" });
    router.get(
      route("courses"),
      { per_page: 10 },
      { preserveState: true, preserveScroll: true }
    );
  };

  if (!user) {
    return <div className="text-center py-8">Loading user data...</div>;
  }

  return (
    <Layout
      auth={auth}
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Courses
        </h2>
      }
    >
      <Head title="Courses" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Courses
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Explore and manage all courses offered at Soroti University with
              ease.
            </p>
          </div>
          {isAdmin && (
            <div className="mt-4 md:mt-0">
              <Button
                onClick={handleAddClick}
                disabled={modalState.isOpen}
                className={`flex items-center bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 ${
                  modalState.isOpen ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Add a new course"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Course
              </Button>
            </div>
          )}
        </div>

        <ErrorBoundary>
          <Card className="mb-6 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Filter className="mr-2 h-5 w-5 text-gray-500" />
                Filter Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Search by Name
                  </label>
                  <Input
                    id="search"
                    placeholder="Enter course name..."
                    value={filterState.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="w-full"
                    aria-label="Search courses by name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="department"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Department
                  </label>
                  {isDepartmentsLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading departments...</span>
                    </div>
                  ) : (
                    <Select
                      value={filterState.department}
                      onValueChange={(value) =>
                        handleFilterChange("department", value)
                      }
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments?.map((dept) => (
                          <SelectItem
                            key={dept.id}
                            value={dept.id.toString()}
                          >
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="yearLevel"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Year Level
                  </label>
                  <Select
                    value={filterState.yearLevel}
                    onValueChange={(value) =>
                      handleFilterChange("yearLevel", value)
                    }
                  >
                    <SelectTrigger id="yearLevel">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {[1, 2, 3, 4, 5, 6].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <SecondaryButton
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-gray-300 hover:bg-gray-100"
                  >
                    Clear Filters
                  </SecondaryButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </ErrorBoundary>

        <ErrorBoundary>
          <CourseList
            onEditCourse={isAdmin ? handleEditClick : undefined}
            coursesResponse={coursesResponse}
          />
        </ErrorBoundary>
      </div>
    </Layout>
  );
};

export default Courses;