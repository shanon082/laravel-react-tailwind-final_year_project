import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../Components/ToolTip";
import { AlertCircle } from "lucide-react";

const TimetableCell = ({ entries = [], isLunchBreak = false }) => {
  if (isLunchBreak) {
    return (
      <div className="timetable-cell p-2 border-b border-r border-gray-200 bg-gray-50 min-h-[80px]">
        <div className="text-center text-xs text-gray-500 italic">Lunch Break</div>
      </div>
    );
  }

  if (!entries.length) {
    return <div className="timetable-cell p-2 border-b border-r border-gray-200 bg-white min-h-[80px]"></div>;
  }

  const hasConflicts = entries.length > 1;

  return (
    <div className={`timetable-cell p-2 border-b border-r border-gray-200 min-h-[80px] ${hasConflicts ? 'bg-red-50' : 'bg-white'}`}>
      {entries.map((entry, index) => {
        // Get the color code from the course
        const colorCode = entry?.course?.color_code || '#D1D5DB';
        
        // Safely access nested properties
        const courseName = entry?.course?.name || 'Unknown Course';
        const courseCode = entry?.course?.code || '';
        const lecturerName = entry?.lecturer?.fullName || 'Unknown Lecturer';
        const roomName = entry?.room?.name || 'No Room';
        const timeSlot = entry?.timeSlot || {};
        const startTime = timeSlot.start_time?.slice(0, 5) || '';
        const endTime = timeSlot.end_time?.slice(0, 5) || '';

        return (
          <TooltipProvider key={entry.id || index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`rounded-md p-2 mb-1 last:mb-0 ${hasConflicts ? 'border border-red-200' : ''}`}
                  style={{ backgroundColor: `${colorCode}15` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate" title={courseName}>
                        {courseCode}
                      </p>
                      <p className="text-xs text-gray-600 truncate" title={lecturerName}>
                        {lecturerName}
                      </p>
                      <p className="text-xs text-gray-500 truncate" title={roomName}>
                        {roomName}
                      </p>
                    </div>
                    {hasConflicts && (
                      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{courseName}</p>
                  <p>{courseCode}</p>
                  <p>Lecturer: {lecturerName}</p>
                  <p>Room: {roomName}</p>
                  <p>Time: {startTime} - {endTime}</p>
                  {hasConflicts && (
                    <p className="text-red-600 font-medium">
                      Warning: Time slot conflict detected
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

export default TimetableCell;