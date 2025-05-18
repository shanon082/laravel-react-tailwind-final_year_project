import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/Card";
import { Button } from "@/Components/Button";
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

const TimetableGrid = ({ filter, viewType, timetable = [], timeSlots = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - diff);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return `${format(monday, "MMMM d")} - ${format(friday, "MMMM d, yyyy")}`;
  };

  // Empty state
  if (timetable.length === 0) {
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
        <CardContent className="p-0">
          <div className="text-center py-4 text-gray-600 bg-gray-100 rounded-md">
            No timetable entries available. Generate a new timetable to view.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter entries based on filter criteria
  const filteredEntries = timetable.filter((entry) => {
    if (!entry) return false;
    
    // Match academic year and semester
    if (filter?.academic_year && entry.academic_year !== filter.academic_year) return false;
    if (filter?.semester && entry.semester !== filter.semester) return false;
    
    // Match other filters
    if (filter?.day && entry.day !== filter.day) return false;
    if (filter?.course_id && entry.course?.id?.toString() !== filter.course_id) return false;
    if (filter?.room_id && entry.room?.id?.toString() !== filter.room_id) return false;
    if (filter?.lecturer_id && entry.lecturer?.id?.toString() !== filter.lecturer_id) return false;
    if (filter?.department && entry.course?.department?.id?.toString() !== filter.department) return false;
    if (filter?.level && entry.course?.year_level?.toString() !== filter.level) return false;
    
    return true;
  });

  // Get unique courses for the legend
  const uniqueCourses = new Map();
  filteredEntries.forEach((entry) => {
    if (entry.course && !uniqueCourses.has(entry.course.id)) {
      uniqueCourses.set(entry.course.id, {
        ...entry.course,
        color_code: entry.course.color_code || '#D1D5DB'
      });
    }
  });

  // Create a map to quickly lookup entries by day and time slot
  const entryMap = new Map();
  filteredEntries.forEach((entry) => {
    if (entry.day && entry.time_slot_id) {
      const key = `${entry.day}-${entry.time_slot_id}`;
      if (!entryMap.has(key)) {
    entryMap.set(key, entry);
      } else {
        // Handle conflicts by creating an array of entries
        const existing = entryMap.get(key);
        if (Array.isArray(existing)) {
          existing.push(entry);
        } else {
          entryMap.set(key, [existing, entry]);
        }
      }
    }
  });

  // Function to get entries for a specific day and time slot
  const getEntry = (day, timeSlotId) => {
    const key = `${day}-${timeSlotId}`;
    const entry = entryMap.get(key);
    return Array.isArray(entry) ? entry : (entry ? [entry] : []);
  };

  // Monthly view logic
  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    const firstDayOfMonth = getDay(start);
    const weeks = [];
    let week = Array(7).fill(null);

    const dayMapping = {
      0: 6, // Sunday -> 6
      1: 0, // Monday -> 0
      2: 1, // Tuesday -> 1
      3: 2, // Wednesday -> 2
      4: 3, // Thursday -> 3
      5: 4, // Friday -> 4
      6: 5, // Saturday -> 5
    };

    for (let i = 0; i < dayMapping[firstDayOfMonth]; i++) {
      week[i] = null;
    }

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
                  {timeSlots.map((timeSlot) => {
                    const entries = getEntry(dayName, timeSlot.id);
                    const isLunchBreak = timeSlot.start_time === "12:00:00";
                    return (
                      <TimetableCell
                        key={`${dayName}-${timeSlot.id}`}
                        entries={entries}
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

  // Weekly view
  const renderWeeklyView = () => {
    return (
      <div className="min-w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {timeSlots.map((timeSlot) => (
              <tr key={timeSlot.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {timeSlot.start_time.slice(0, 5)} - {timeSlot.end_time.slice(0, 5)}
                </td>
                {days.map((day) => {
                  const entries = getEntry(day, timeSlot.id);
                  const isLunchBreak = timeSlot.start_time === "12:00:00";
                  return (
                    <td key={`${day}-${timeSlot.id}`} className="px-6 py-4">
                      <TimetableCell entries={entries} isLunchBreak={isLunchBreak} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
      <CardContent className="p-0">
        {viewType === "month" ? renderMonthView() : renderWeeklyView()}
      </CardContent>
    </Card>
  );
};

export default TimetableGrid;