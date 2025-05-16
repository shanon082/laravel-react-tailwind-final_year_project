import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../Components/ToolTip";
import { AlertCircle } from "lucide-react";

const TimetableCell = ({ entry, isLunchBreak = false }) => {
  if (isLunchBreak) {
    return (
      <div className="timetable-cell p-2 border-b border-r border-gray-200 bg-gray-50 min-h-[80px]">
        <div className="text-center text-xs text-gray-500 italic">Lunch Break</div>
      </div>
    );
  }

  if (!entry) {
    return <div className="timetable-cell p-2 border-b border-r border-gray-200 bg-white min-h-[80px]"></div>;
  }

  // Use the color_code from the course, assuming it's a valid CSS color (e.g., '#FF5733' or 'red')
  const colorCode = entry?.course?.color_code || '#D1D5DB'; // Fallback to gray if color_code is missing
  const colorClassOpacity = `bg-[${colorCode}] bg-opacity-20`;
  const borderClass = `border-l-4 border-[${colorCode}]`;

  // Safely access nested properties
  const courseName = entry?.course?.name || 'Unknown Course';
  const courseCode = entry?.course?.code || '';
  const roomName = entry?.room?.name || 'Unknown Room';
  const lecturerName = entry?.lecturer?.userDetails?.fullName || entry?.lecturer?.name || `Lecturer ${entry?.lecturer?.id || 'Unknown'}`;
  const startTime = entry?.timeSlot?.start_time || entry?.timeSlot?.startTime || '';
  const endTime = entry?.timeSlot?.end_time || entry?.timeSlot?.endTime || '';

  return (
    <div className="timetable-cell p-2 border-b border-r border-gray-200 bg-white min-h-[80px]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${colorClassOpacity} rounded-md p-2 ${borderClass} h-full flex flex-col relative`}>
              {entry.hasConflict && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                  <AlertCircle className="h-3 w-3 text-white" />
                </span>
              )}
              <div className="font-medium text-gray-900 text-sm">{courseName}</div>
              <div className="text-xs text-gray-600">Room: {roomName}</div>
              <div className="text-xs text-gray-600">{lecturerName}</div>
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
          <TooltipContent className="max-w-[250px] break-words">
            <div className="space-y-1">
              <p className="font-bold">{courseName} {courseCode && `(${courseCode})`}</p>
              <p>Room: {roomName}</p>
              <p>Lecturer: {lecturerName}</p>
              <p>Time: {startTime} - {endTime}</p>
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