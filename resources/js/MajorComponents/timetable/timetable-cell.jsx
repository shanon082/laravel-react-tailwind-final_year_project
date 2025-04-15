import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../Components/ToolTip";
import { AlertCircle } from "lucide-react";

const TimetableCell = ({ entry, isLunchBreak = false }) => {
  if (isLunchBreak) {
    return (
      <div className="timetable-cell p-2 border-b border-gray-200 bg-gray-50 min-h-[100px]">
        <div className="text-center text-xs text-gray-500 italic">Lunch Break</div>
      </div>
    );
  }

  if (!entry) {
    return <div className="timetable-cell p-2 border-b border-gray-200 bg-white min-h-[100px]"></div>;
  }

  // Get color based on course id or color code
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

  const colorClass = colorMap[(entry.course.id % 8) + 1] || 'course-1';
  const colorClassOpacity = `bg-${colorClass} bg-opacity-20`;
  const borderClass = `border-l-4 border-${colorClass}`;

  return (
    <div className="timetable-cell p-2 border-b border-gray-200 bg-white min-h-[100px]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${colorClassOpacity} rounded-md p-2 ${borderClass} h-full flex flex-col relative`}>
              {entry.hasConflict && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                  <AlertCircle className="h-3 w-3 text-white" />
                </span>
              )}
              <div className="font-medium text-gray-900 text-sm">{entry.course.name}</div>
              <div className="text-xs text-gray-600">Room: {entry.room.name}</div>
              <div className="text-xs text-gray-600">
                {entry.lecturer.userDetails?.fullName || `Lecturer ${entry.lecturer.id}`}
              </div>
              {entry.hasConflict && (
                <div className="text-xs text-red-600 mt-1">
                  {entry.conflictType === 'ROOM' && 'Room Conflict'}
                  {entry.conflictType === 'LECTURER' && 'Lecturer Conflict'}
                  {entry.conflictType === 'AVAILABILITY' && 'Availability Conflict'}
                  {entry.conflictType === 'ROOM_LECTURER' && 'Room & Lecturer Conflict'}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-bold">{entry.course.name} ({entry.course.code})</p>
              <p>Room: {entry.room.name}</p>
              <p>Lecturer: {entry.lecturer.userDetails?.fullName}</p>
              <p>Time: {entry.timeSlot.startTime} - {entry.timeSlot.endTime}</p>
              {entry.hasConflict && (
                <p className="text-red-500 font-semibold">Warning: This session has a conflict!</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default TimetableCell;