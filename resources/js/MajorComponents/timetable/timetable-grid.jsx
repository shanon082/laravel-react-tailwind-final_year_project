import { useState, useEffect, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { Day } from "../../types";
import TimetableCell from "./timetable-cell";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";

const TimetableGrid = ({ filter, viewType }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Get timetable data
  const { data: entries, isLoading } = useQuery({
    queryKey: ['/api/timetable', filter],
  });

  // Get time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['/api/timeslots'],
  });

  // Function to navigate between weeks
  const previousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));

  // Get all days in the week
  const days = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];
  
  // Format the week dates
  const getWeekDisplayText = () => {
    // Adjust current date to Monday of the week
    const dayOfWeek = currentWeek.getDay();
    const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Make Monday day 0
    const monday = new Date(currentWeek);
    monday.setDate(currentWeek.getDate() - diff);
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    return `${format(monday, 'MMMM d')} - ${format(friday, 'MMMM d, yyyy')}`;
  };

  // Loading state
  if (isLoading || timeSlotsLoading) {
    return (
      <Card className="bg-white shadow rounded-lg mb-8 overflow-hidden">
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">Weekly Timetable</CardTitle>
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
  const filteredEntries = entries?.filter(entry => {
    if (filter.day && entry.day !== filter.day) return false;
    if (filter.courseId && entry.courseId.toString() !== filter.courseId) return false;
    if (filter.roomId && entry.roomId.toString() !== filter.roomId) return false;
    if (filter.lecturerId && entry.lecturerId.toString() !== filter.lecturerId) return false;
    if (filter.timeSlotId && entry.timeSlotId.toString() !== filter.timeSlotId) return false;
    return true;
  });

  // Get unique courses for the legend
  const uniqueCourses = new Map();
  filteredEntries?.forEach(entry => {
    if (!uniqueCourses.has(entry.course.id)) {
      uniqueCourses.set(entry.course.id, entry.course);
    }
  });

  // Create a map to quickly lookup entries by day and time slot
  const entryMap = new Map();
  filteredEntries?.forEach(entry => {
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
      1: 'course-1',
      2: 'course-2',
      3: 'course-3',
      4: 'course-4',
      5: 'course-5',
      6: 'course-6',
      7: 'course-7',
      8: 'course-8',
    };
    return colorMap[(courseId % 8) + 1] || 'course-1';
  };

  return (
    <Card className="bg-white shadow rounded-lg mb-8 overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900">
          {viewType === 'week' ? 'Weekly Timetable' : 
           viewType === 'day' ? 'Daily Timetable' : 'Timetable List View'}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="default"
            onClick={previousWeek}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-gray-900">{getWeekDisplayText()}</span>
          <Button
            size="icon"
            variant="default"
            onClick={nextWeek}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        {viewType === 'week' && (
          <div className="timetable-grid min-w-full">
            {/* Time column */}
            <div className="timetable-cell bg-gray-50 p-2 text-xs text-center font-medium text-gray-500 border-r border-b border-gray-200"></div>
            
            {/* Day headers */}
            {days.map(day => (
              <div key={day} className="timetable-cell bg-gray-50 p-4 text-center font-medium text-gray-700 border-b border-gray-200">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </div>
            ))}
            
            {/* Time slots and entries */}
            {timeSlots?.map((timeSlot) => (
              <Fragment key={timeSlot.id.toString()}>
                {/* Time slot label */}
                <div className="timetable-cell bg-gray-50 p-2 text-xs text-center font-medium text-gray-500 border-r border-b border-gray-200 flex items-center justify-center">
                  {timeSlot.startTime.substring(0, 5)}<br/>-<br/>{timeSlot.endTime.substring(0, 5)}
                </div>
                
                {/* Entries for each day */}
                {days.map(day => {
                  const isLunchBreak = timeSlot.startTime === '12:00:00';
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
        
        {viewType === 'day' && filter.day && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">{filter.day.charAt(0) + filter.day.slice(1).toLowerCase()}</h3>
            <div className="space-y-4">
              {timeSlots?.map((timeSlot) => (
                <div key={timeSlot.id} className="flex">
                  <div className="w-24 text-sm font-medium text-gray-500 flex items-center">
                    {timeSlot.startTime.substring(0, 5)} - {timeSlot.endTime.substring(0, 5)}
                  </div>
                  <div className="flex-1">
                    <TimetableCell 
                      entry={getEntry(filter.day, timeSlot.id)}
                      isLunchBreak={timeSlot.startTime === '12:00:00'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewType === 'list' && (
          <div className="p-4">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries?.map(entry => {
                    const timeSlot = timeSlots?.find((ts) => ts.id === entry.timeSlotId);
                    return (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-3 w-3 bg-${getCourseColor(entry.course.id)} rounded-full mr-2`}></div>
                            <div className="text-sm font-medium text-gray-900">{entry.course.name}</div>
                          </div>
                          <div className="text-xs text-gray-500">{entry.course.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.day.charAt(0) + entry.day.slice(1).toLowerCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {timeSlot ? `${timeSlot.startTime.substring(0, 5)} - ${timeSlot.endTime.substring(0, 5)}` : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.room.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {entry.lecturer.userDetails?.fullName || `Lecturer ${entry.lecturer.id}`}
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
      
      {viewType !== 'list' && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            {Array.from(uniqueCourses.values()).map(course => (
              <div key={course.id} className="flex items-center">
                <div className={`h-3 w-3 bg-${getCourseColor(course.id)} rounded-full mr-2`}></div>
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