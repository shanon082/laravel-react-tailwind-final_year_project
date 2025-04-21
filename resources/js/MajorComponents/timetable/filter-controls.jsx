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

const FilterControls = ({ onFilterChange, defaultFilters = {} }) => {
  const [department, setDepartment] = useState(defaultFilters.department);
  const [level, setLevel] = useState(defaultFilters.level);
  const [lecturer, setLecturer] = useState(defaultFilters.lecturer);
  const [room, setRoom] = useState(defaultFilters.room);
  const [day, setDay] = useState(defaultFilters.day);
  const [viewType, setViewType] = useState(defaultFilters.viewType || "week");

  // Fetch lecturers for dropdown
  const { data: lecturers } = useQuery({
    queryKey: ["/lecturers"],
  });

  // Fetch rooms for dropdown
  const { data: rooms } = useQuery({
    queryKey: ["/rooms"],
  });

  // Apply filters when the form is submitted
  const applyFilters = () => {
    onFilterChange({
      department,
      level,
      lecturer,
      room,
      day,
      viewType,
    });
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

  // Apply filters when default filters change
  useEffect(() => {
    setDepartment(defaultFilters.department);
    setLevel(defaultFilters.level);
    setLecturer(defaultFilters.lecturer);
    setRoom(defaultFilters.room);
    setDay(defaultFilters.day);
    setViewType(defaultFilters.viewType || "week");
  }, [defaultFilters]);

  return (
    <Card className="bg-white shadow rounded-lg mb-8">
      <CardContent className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Timetable Filters
        </h2>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={department}
              onValueChange={(value) => setDepartment(value)}
            >
              <SelectTrigger id="department" className="mt-1">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Business Administration">
                  Business Administration
                </SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Medicine">Medicine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="course-level">Level</Label>
            <Select
              value={level?.toString()}
              onValueChange={(value) =>
                setLevel(value ? parseInt(value) : undefined)
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
            <Select
              value={lecturer?.toString()}
              onValueChange={(value) =>
                setLecturer(value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger id="lecturer" className="mt-1">
                <SelectValue placeholder="All Lecturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lecturers</SelectItem>
                {lecturers?.map((lecturer) => (
                  <SelectItem
                    key={lecturer.id}
                    value={lecturer.id.toString()}
                  >
                    {lecturer.userDetails?.fullName || `Lecturer ${lecturer.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Label htmlFor="room">Room</Label>
            <Select
              value={room?.toString()}
              onValueChange={(value) =>
                setRoom(value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger id="room" className="mt-1">
                <SelectValue placeholder="All Rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="day">Day</Label>
            <Select
              value={day}
              onValueChange={(value) => setDay(value)}
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