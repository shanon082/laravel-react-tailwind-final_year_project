import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Day } from "../../types";
import TimetableCell from "./timetable-cell";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

const TimetableGrid = ({ filter, viewType }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get timetable data
  const { data: entries, isLoading } = useQuery({
    queryKey: ["/timetable", filter],
  });

  // Get time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["/timeslots"],
  });

  // Navigation functions
  const previousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Get all days in the week
  const days = [
    Day.MONDAY,
    Day.TUESDAY,
    Day.WEDNESDAY,
    Day.THURSDAY,
    Day.FRIDAY,
  ];

  // Format the week or month display text
  const getDisplayText = () => {
    if (viewType === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    // Adjust current date to Monday of the week
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday day 0
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - diff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return `${format(monday, "MMMM d")} - ${format(friday, "MMMM d, yyyy")}`;
  };

  // Loading state
  if (isLoading || timeSlotsLoading) {
    return (
      <Card className="bg-white shadow rounded-lg mb-8 overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            {viewType === "month"
              ? "Monthly Timetable"
              : viewType === "week"
              ? "Weekly Timetable"
              : viewType === "day"
              ? "Daily Timetable"
              : "Timetable List View"}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter entries based on filter criteria
  const filteredEntries = entries?.filter((entry) => {
    if (filter.day && entry.day !== filter.day) return false;
    if (filter.courseId && entry.courseId.toString() !== filter.courseId)
      return false;
    if (filter.roomId && entry.roomId.toString() !== filter.roomId) return false;
    if (filter.lecturerId && entry.lecturerId.toString() !== filter.lecturerId)
      return false;
    if (filter.timeSlotId && entry.timeSlotId.toString() !== filter.timeSlotId)
      return false;
    return true;
  });

  // Get unique courses for the legend
  const uniqueCourses = new Map();
  filteredEntries?.forEach((entry) => {
    if (!uniqueCourses.has(entry.course.id)) {
      uniqueCourses.set(entry.course.id, entry.course);
    }
  });

  // Create a map to quickly lookup entries by day and time slot
  const entryMap = new Map();
  filteredEntries?.forEach((entry) => {
    const key = `${entry.day}-${entry.timeSlotId}`;
    entryMap.set(key, entry);
  });

  // Function to get an entry for a specific day and time slot
  const getEntry = (day, timeSlotId) => {
    const key = `${day}-${timeSlotId}`;
    return entryMap.get(key) || null;
  };

  // Color mapping for courses
  const getCourseColor = (courseId) => {
    const colorMap = {
      1: "course-1",
      2: "course-2",
      3: "course-3",
      4: "course-4",
      5: "course-5",
      6: "course-6",
      7: "course-7",
      8: "course-8",
    };
    return colorMap[(courseId % 8) + 1] || "course-1";
  };

  // Monthly view logic
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    const firstDayOfMonth = getDay(start); // 0 (Sunday) to 6 (Saturday)
    const weeks = [];
    let week = Array(7).fill(null); // Initialize week with 7 slots

    // Adjust for Monday as first day (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    const dayMapping = {
      0: 6, // Sunday -> 6
      1: 0, // Monday -> 0
      2: 1, // Tuesday -> 1
      3: 2, // Wednesday -> 2
      4: 3, // Thursday -> 3
      5: 4, // Friday -> 4
      6: 5, // Saturday -> 5
    };

    // Fill the first week with empty slots before the first day
    for (let i = 0; i < dayMapping[firstDayOfMonth]; i++) {
      week[i] = null;
    }

    // Fill weeks with days
    daysInMonth.forEach((day, index) => {
      const weekIndex = dayMapping[getDay(day)];
      week[weekIndex] = day;

      if (weekIndex === 6 || index === daysInMonth.length - 1) {
        weeks.push([...week]);
        week = Array(7).fill(null);
      }
    });

    return (
      <div className="timetable-grid min-w-full p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="timetable-cell bg-gray-50 p-2 text-center font-medium text-gray-700 border-b border-gray-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${weekIndex}-${dayIndex}`}
                    className="timetable-cell p-2 border-b border-gray-200 bg-gray-100 min-h-[80px]"
                  ></div>
                );
              }

              const dayName = days[dayIndex]?.toUpperCase();
              if (!dayName || ![...days, "SATURDAY", "SUNDAY"].includes(dayName)) {
                return (
                  <div
                    key={`no-classes-${weekIndex}-${dayIndex}`}
                    className="timetable-cell p-2 border-b border-gray-200 bg-gray-50 min-h-[80px]"
                  >
                    <div className="text-xs text-gray-500">
                      {format(day, "d")} - No classes
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className="timetable-cell p-2 border-b border-gray-200 bg-white min-h-[80px]"
                >
                  <div className="text-xs font-medium text-gray-900">
                    {format(day, "d")}
                  </div>
                  {timeSlots?.map((timeSlot) => {
                    const entry = getEntry(dayName, timeSlot.id);
                    const isLunchBreak = timeSlot.startTime === "12:00:00";
                    return (
                      <TimetableCell
                        key={`${dayName}-${timeSlot.id}`}
                        entry={entry}
                        isLunchBreak={isLunchBreak}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-white shadow rounded-lg mb-8 overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          {viewType === "week"
            ? "Weekly Timetable"
            : viewType === "day"
            ? "Daily Timetable"
            : viewType === "month"
            ? "Monthly Timetable"
            : "Timetable List View"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="default"
            onClick={viewType === "month" ? previousMonth : previousWeek}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-gray-900">
            {getDisplayText()}
          </span>
          <Button
            size="icon"
            variant="default"
            onClick={viewType === "month" ? nextMonth : nextWeek}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        {viewType === "week" && (
          <div className="timetable-grid min-w-full grid grid-cols-timetable">
            {/* Header row: Empty cell + time slot headers */}
            <div className="timetable-cell bg-gray-50 p-2 text-xs text-center font-medium text-gray-500 border-r border-b border-gray-200 sticky top-0 z-10 "></div>
            {timeSlots?.map((timeSlot) => (
              <div
                key={timeSlot.id}
                className="timetable-cell bg-gray-50 p-2 text-xs text-center font-medium text-gray-700 border-r border-b border-gray-200 sticky top-0 z-10  [writing-mode:vertical-rl] rotate-180"
              >
                {timeSlot.startTime.replace(":00", "")} -{" "}
                {timeSlot.endTime.replace(":00", "")}
              </div>
            ))}

            {/* Day rows */}
            {days.map((day) => (
              <Fragment key={day}>
                {/* Day label */}
                <div className="timetable-cell bg-gray-50 p-2 text-xs text-center font-medium text-gray-500 border-r border-b border-gray-200 flex items-center justify-center sticky left-0 z-10 ">
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </div>
                {/* Entries for each time slot */}
                {timeSlots?.map((timeSlot) => {
                  const isLunchBreak = timeSlot.startTime === "12:00:00";
                  return (
                    <TimetableCell
                      key={`${day}-${timeSlot.id}`}
                      entry={getEntry(day, timeSlot.id)}
                      isLunchBreak={isLunchBreak}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        )}

        {viewType === "day" && filter.day && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">
              {filter.day.charAt(0) + filter.day.slice(1).toLowerCase()}
            </h3>
            <div className="space-y-4">
              {timeSlots?.map((timeSlot) => (
                <div key={timeSlot.id} className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 flex items-center">
                    {timeSlot.startTime.replace(":00", "")} -{" "}
                    {timeSlot.endTime.replace(":00", "")}
                  </div>
                  <div className="flex-1">
                    <TimetableCell
                      entry={getEntry(filter.day, timeSlot.id)}
                      isLunchBreak={timeSlot.startTime === "12:00:00"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewType === "month" && renderMonthView()}

        {viewType === "list" && (
          <div className="p-4">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Course
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Day
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Room
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Lecturer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries?.map((entry) => {
                    const timeSlot = timeSlots?.find(
                      (ts) => ts.id === entry.timeSlotId
                    );
                    return (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`h-3 w-3 bg-${getCourseColor(
                                entry.course.id
                              )} rounded-full mr-2`}
                            ></div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.course.name}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.course.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.day.charAt(0) +
                              entry.day.slice(1).toLowerCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {timeSlot
                              ? `${timeSlot.startTime.replace(
                                  ":00",
                                  ""
                                )} - ${timeSlot.endTime.replace(":00", "")}`
                              : "Unknown"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.room.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.lecturer.userDetails?.fullName ||
                              `Lecturer ${entry.lecturer.id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {entry.hasConflict ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Conflict
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Scheduled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {viewType !== "list" && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            {Array.from(uniqueCourses.values()).map((course) => (
              <div key={course.id} className="flex items-center">
                <div
                  className={`h-3 w-3 bg-${getCourseColor(
                    course.id
                  )} rounded-full mr-2`}
                ></div>
                <span className="text-xs text-gray-600">{course.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default TimetableGrid;