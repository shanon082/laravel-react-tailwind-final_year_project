import { useQuery, useMutation } from '@tanstack/react-query';
import { usePage } from '@inertiajs/react'; // Add this import
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../Components/card';
import { Button } from '../../Components/button';
import { Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../hooks/use-auth';
import { UserRole } from '../../types';
import AddAvailabilityForm from './AddAvailabilityForm';
import { useEffect } from 'react'; // Add this import

const AvailabilityTable = ({ lecturerId }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { flash } = usePage().props; // Access flash messages

  const canEdit =
    user?.name === 'admin' ||
    (user?.role === UserRole.ADMIN || (user?.role === UserRole.LECTURER && user?.id === lecturerId));

  const { data: lecturerResponse, isLoading: isLecturerLoading } = useQuery({
    queryKey: ['/lecturers', lecturerId],
    queryFn: () => apiRequest('GET', `/lecturers/${lecturerId}`).then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: availabilitiesResponse, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['/lecturers', lecturerId, 'availability'],
    queryFn: () => apiRequest('GET', `/lecturers/${lecturerId}/availability`).then((res) => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const lecturer = lecturerResponse || {};
  const availabilities = availabilitiesResponse || [];

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast({
        title: 'Success',
        description: flash.success,
      });
      queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] });
    }
    if (flash?.error) {
      toast({
        title: 'Error',
        description: flash.error,
        variant: 'destructive',
      });
    }
  }, [flash, toast]);

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (availabilityId) => {
      await apiRequest('DELETE', `/lecturers/availability/${availabilityId}`);
    },
    onSuccess: () => {
      // No need for toast here since flash messages handle it
      queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] });
    },
    onError: (error) => {
      console.error('Delete error:', error); // Log for debugging
      toast({
        title: 'Failed to remove availability',
        description: error.message || 'An error occurred while removing availability.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteAvailability = (availabilityId) => {
    if (window.confirm('Are you sure you want to delete this availability slot?')) {
      deleteAvailabilityMutation.mutate(availabilityId);
    }
  };

  const availabilitiesByDay = availabilities.reduce((acc, availability) => {
    if (!acc[availability.day]) {
      acc[availability.day] = [];
    }
    acc[availability.day].push(availability);
    return acc;
  }, {}) || {};

  const formatTime = (time) => {
    return time.length === 5 ? time : time.substring(0, 5);
  };

  const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

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
          <AddAvailabilityForm
            lecturerId={lecturerId}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] })}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Lecturer availability by day</caption>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lecturer
                </th>
                {allDays.map((day) => (
                  <th
                    key={day}
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
                      {lecturer?.fullName?.charAt(0) || 'L'}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {lecturer?.title} {lecturer?.fullName || `Lecturer ${lecturerId}`}
                      </div>
                      <div className="text-sm text-gray-500">{lecturer?.department}</div>
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
                              title={`Available from ${formatTime(availability.start_time)} to ${formatTime(availability.end_time)}`}
                            >
                              {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
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