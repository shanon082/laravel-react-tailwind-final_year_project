import { useState, useEffect } from "react";
import { Card, CardContent } from "../../Components/Card";
import { Button } from "../../Components/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/Select";
import { Day } from "../../types";
import { Label } from "../../Components/Label";
import { useQuery } from "@tanstack/react-query";
import SecondaryButton from "@/Components/SecondaryButton";
import { apiRequest } from "../../lib/queryClient"; // Adjusted path based on your structure
import { Loader2 } from "lucide-react";

const FilterControls = ({ onFilterChange, defaultFilters = {} }) => {
  const [department, setDepartment] = useState(defaultFilters.department);
  const [level, setLevel] = useState(defaultFilters.level);
  const [lecturer, setLecturer] = useState(defaultFilters.lecturer);
  const [room, setRoom] = useState(defaultFilters.room);
  const [day, setDay] = useState(defaultFilters.day);
  const [viewType, setViewType] = useState(defaultFilters.viewType || "week");

  // Fetch departments
  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    error: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        console.log('Fetching departments from:', '/departments/list');
        const data = await apiRequest("GET", "/departments/list");
        console.log('Departments API response:', data);
        if (!Array.isArray(data)) {
          console.warn('Departments data is not an array:', data);
          return [];
        }
        return data;
      } catch (error) {
        console.error("Department fetch error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        throw error;
      }
    },
  });

  // Fetch lecturers
  const {
    data: lecturers,
    isLoading: isLecturersLoading,
    error: lecturersError,
  } = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/lecturers/list");
        console.log('Lecturers data:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Lecturers fetch error:", error);
        throw error;
      }
    },
  });

  // Fetch rooms
  const {
    data: rooms,
    isLoading: isRoomsLoading,
    error: roomsError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/rooms/list");
        console.log('Rooms data:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Rooms fetch error:", error);
        throw error;
      }
    },
  });

  // Apply filters when the form is submitted
  const applyFilters = () => {
    const filters = {
      department: department === "all" ? undefined : department,
      level: level,
      lecturer: lecturer,
      room: room,
      day: day === "all" ? undefined : day,
      viewType,
    };
    console.log("Applying filters:", filters);
    onFilterChange(filters);
  };

  // Reset all filters
  const resetFilters = () => {
    setDepartment(undefined);
    setLevel(undefined);
    setLecturer(undefined);
    setRoom(undefined);
    setDay(undefined);
    setViewType("week");

    onFilterChange({
      viewType: "week",
    });
  };

  // Sync with default filters when they change
  useEffect(() => {
    setDepartment(defaultFilters.department);
    setLevel(defaultFilters.level);
    setLecturer(defaultFilters.lecturer);
    setRoom(defaultFilters.room);
    setDay(defaultFilters.day);
    setViewType(defaultFilters.viewType || "week");
  }, [defaultFilters]);

  // Combine errors for display
  const errorMessage =
    departmentsError || lecturersError || roomsError
      ? "Failed to load filter options. Please try again."
      : null;

  return (
    <Card className="bg-white shadow rounded-lg mb-8">
      <CardContent className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Timetable Filters
        </h2>

        {errorMessage && (
          <div className="mb-4 text-red-600 text-sm">{errorMessage}</div>
        )}

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="department">Department</Label>
            {isDepartmentsLoading ? (
              <div className="flex items-center space-x-2 mt-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading departments...</span>
              </div>
            ) : (
              <Select
                value={department || "all"}
                onValueChange={(value) =>
                  setDepartment(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="department" className="mt-1">
                  <SelectValue placeholder={isDepartmentsLoading ? "Loading..." : "All Departments"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  {!isDepartmentsLoading && (!departments || departments.length === 0) && (
                    <SelectItem value="none" disabled>No departments available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="course-level">Level</Label>
            <Select
              value={level?.toString() || "all"}
              onValueChange={(value) =>
                setLevel(value === "all" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger id="course-level" className="mt-1">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="lecturer">Lecturer</Label>
            {isLecturersLoading ? (
              <div className="flex items-center space-x-2 mt-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading lecturers...</span>
              </div>
            ) : (
              <Select
                value={lecturer?.toString() || "all"}
                onValueChange={(value) =>
                  setLecturer(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger id="lecturer" className="mt-1">
                  <SelectValue placeholder={isLecturersLoading ? "Loading..." : "All Lecturers"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lecturers</SelectItem>
                  {lecturers?.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id.toString()}>
                      {lecturer.fullName || `${lecturer.first_name} ${lecturer.last_name}` || `Lecturer ${lecturer.id}`}
                    </SelectItem>
                  ))}
                  {!isLecturersLoading && (!lecturers || lecturers.length === 0) && (
                    <SelectItem value="none" disabled>No lecturers available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="room">Room</Label>
            {isRoomsLoading ? (
              <div className="flex items-center space-x-2 mt-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading rooms...</span>
              </div>
            ) : (
              <Select
                value={room?.toString() || "all"}
                onValueChange={(value) =>
                  setRoom(value === "all" ? undefined : parseInt(value))
                }
              >
                <SelectTrigger id="room" className="mt-1">
                  <SelectValue placeholder={isRoomsLoading ? "Loading..." : "All Rooms"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {`${room.name} (${room.building})`}
                    </SelectItem>
                  ))}
                  {!isRoomsLoading && (!rooms || rooms.length === 0) && (
                    <SelectItem value="none" disabled>No rooms available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="day">Day</Label>
            <Select
              value={day || "all"}
              onValueChange={(value) =>
                setDay(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="day" className="mt-1">
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value={Day.MONDAY}>Monday</SelectItem>
                <SelectItem value={Day.TUESDAY}>Tuesday</SelectItem>
                <SelectItem value={Day.WEDNESDAY}>Wednesday</SelectItem>
                <SelectItem value={Day.THURSDAY}>Thursday</SelectItem>
                <SelectItem value={Day.FRIDAY}>Friday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="view-type">View</Label>
            <Select
              value={viewType}
              onValueChange={(value) => setViewType(value)}
            >
              <SelectTrigger id="view-type" className="mt-1">
                <SelectValue placeholder="Week View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <SecondaryButton
            variant="outline"
            onClick={resetFilters}
            className="mr-3"
          >
            Reset
          </SecondaryButton>

          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterControls;