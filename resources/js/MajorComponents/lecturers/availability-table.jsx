import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../Components/card";
import { Button } from "../../Components/button";
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../Components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/select";
import { Input } from "../../Components/input";
import { Label } from "../../Components/label";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { queryClient } from "../../lib/queryClient";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../../types";
import { useState } from "react";

const AvailabilityTable = ({ lecturerId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [newDay, setNewDay] = useState("MONDAY");
  const [newStartTime, setNewStartTime] = useState("08:00");
  const [newEndTime, setNewEndTime] = useState("10:00");

  const canEdit =
    user?.role === UserRole.ADMIN || (user?.role === UserRole.LECTURER && user?.id === lecturerId);

  const { data: lecturer, isLoading: isLecturerLoading } = useQuery({
    queryKey: ["/api/lecturers", lecturerId],
    staleTime: 5 * 60 * 1000,
  });

  const { data: availabilities, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ["/api/lecturers", lecturerId, "availability"],
    staleTime: 5 * 60 * 1000,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/lecturers", lecturerId, "availability"] });
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

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (availabilityId) => {
      await apiRequest("DELETE", `/api/lecturers/availability/${availabilityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lecturers", lecturerId, "availability"] });
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

    if (newStartTime >= newEndTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    const formattedStartTime = `${newStartTime}:00`;
    const formattedEndTime = `${newEndTime}:00`;

    addAvailabilityMutation.mutate({
      lecturerId,
      day: newDay,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
    });
  };

  const handleDeleteAvailability = (availabilityId) => {
    if (window.confirm("Are you sure you want to delete this availability slot?")) {
      deleteAvailabilityMutation.mutate(availabilityId);
    }
  };

  const availabilitiesByDay = availabilities?.reduce((acc, availability) => {
    if (!acc[availability.day]) {
      acc[availability.day] = [];
    }
    acc[availability.day].push(availability);
    return acc;
  }, {}) || {};

  const formatTime = (time) => time.substring(0, 5);

  const allDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  if (isLecturerLoading || isAvailabilityLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Lecturer Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            {allDays.map((day) => (
              <div key={day} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lecturer Availability</CardTitle>
        {canEdit && (
          <Dialog open={isAddingAvailability} onOpenChange={setIsAddingAvailability}>
            <DialogTrigger asChild>
              <Button size="sm" className="px-4 py-2" title="Add availability slot">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Availability
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Availability Time</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="day">Day</Label>
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger id="day" aria-label="Select day">
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
                      aria-label="Start time"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      aria-label="End time"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingAvailability(false)}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAvailability}
                  disabled={addAvailabilityMutation.isPending}
                  className="px-6 py-2"
                >
                  {addAvailabilityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Availability"
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
            <caption className="sr-only">Lecturer availability by day</caption>
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Lecturer
                </th>
                {allDays.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="even:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {lecturer?.userDetails?.fullName?.charAt(0) || "L"}
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
                            <span
                              className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                              title={`Available from ${formatTime(availability.startTime)} to ${formatTime(availability.endTime)}`}
                            >
                              {formatTime(availability.startTime)} - {formatTime(availability.endTime)}
                            </span>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1 h-6 w-6 hover:text-red-700"
                                onClick={() => handleDeleteAvailability(availability.id)}
                                disabled={deleteAvailabilityMutation.isPending}
                                aria-label="Delete availability slot"
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800"
                        title="Not available"
                      >
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