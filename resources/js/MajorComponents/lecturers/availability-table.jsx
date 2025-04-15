import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "../ui/card";
import { Button } from "../ui/button";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { queryClient } from "../../lib/queryClient";
import { Day, LecturerAvailability, TimeRange } from "@/types";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../../types";
import { useState } from "react";

const AvailabilityTable = ({ lecturerId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newDay, setNewDay] = useState(Day.MONDAY);
  const [newStartTime, setNewStartTime] = useState("08:00");
  const [newEndTime, setNewEndTime] = useState("10:00");

  // Check if user is the same lecturer or an admin
  const canEdit = user?.role === UserRole.ADMIN || 
    (user?.role === UserRole.LECTURER && user?.id === lecturerId);

  // Fetch lecturer details
  const { data: lecturer, isLoading: isLecturerLoading } = useQuery({
    queryKey: ['/api/lecturers', lecturerId],
  });

  // Fetch availabilities for the lecturer
  const { data: availabilities, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['/api/lecturers', lecturerId, 'availability'],
  });

  // Add availability mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData) => {
      const response = await apiRequest(
        "POST", 
        `/api/lecturers/${lecturerId}/availability`, 
        availabilityData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/lecturers', lecturerId, 'availability'] 
      });
      setIsAddingAvailability(false);
      toast({
        title: "Availability added",
        description: "The availability time has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete availability mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (availabilityId) => {
      await apiRequest(
        "DELETE", 
        `/api/lecturers/availability/${availabilityId}`, 
        undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/lecturers', lecturerId, 'availability'] 
      });
      toast({
        title: "Availability removed",
        description: "The availability time has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddAvailability = () => {
    if (!newDay || !newStartTime || !newEndTime) {
      toast({
        title: "Invalid input",
        description: "Please select a day and provide valid time range.",
        variant: "destructive",
      });
      return;
    }

    // Format times to include seconds for API
    const formattedStartTime = `${newStartTime}:00`;
    const formattedEndTime = `${newEndTime}:00`;

    addAvailabilityMutation.mutate({
      lecturerId,
      day: newDay,
      startTime: formattedStartTime,
      endTime: formattedEndTime
    });
  };

  const handleDeleteAvailability = (availabilityId) => {
    deleteAvailabilityMutation.mutate(availabilityId);
  };

  // Group availabilities by day
  const availabilitiesByDay = availabilities?.reduce((acc, availability) => {
    if (!acc[availability.day]) {
      acc[availability.day] = [];
    }
    acc[availability.day].push(availability);
    return acc;
  }, {}) || {};

  // Format time for display (remove seconds)
  const formatTime = (time) => time.substring(0, 5);
  
  const allDays = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

  if (isLecturerLoading || isAvailabilityLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Lecturer Availability</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lecturer Availability</CardTitle>
        {canEdit && (
          <Dialog open={isAddingAvailability} onOpenChange={setIsAddingAvailability}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Availability Time</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="day">Day</Label>
                  <Select value={newDay} onValueChange={(value) => setNewDay(value)}>
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {allDays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingAvailability(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAvailability}
                  disabled={addAvailabilityMutation.isPending}
                >
                  {addAvailabilityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Availability'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lecturer
                </th>
                {allDays.map((day) => (
                  <th key={day} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      {lecturer?.userDetails?.fullName?.charAt(0) || 'L'}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {lecturer?.title} {lecturer?.userDetails?.fullName || `Lecturer ${lecturerId}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lecturer?.userDetails?.department || lecturer?.department}
                      </div>
                    </div>
                  </div>
                </td>
                
                {allDays.map((day) => (
                  <td key={day} className="px-6 py-4 whitespace-nowrap">
                    {availabilitiesByDay[day]?.length ? (
                      <div className="space-y-2">
                        {availabilitiesByDay[day].map((availability) => (
                          <div key={availability.id} className="flex items-center">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
                            </span>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1 h-6 w-6"
                                onClick={() => handleDeleteAvailability(availability.id)}
                                disabled={deleteAvailabilityMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Not Available
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
      {canEdit && (
        <CardFooter className="border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500">
            Note: Lecturer availability is used to prevent scheduling conflicts when generating timetables.
          </p>
        </CardFooter>
      )}
    </Card>
  );
};

export default AvailabilityTable;
