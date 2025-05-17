import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../Components/card';
import { Button } from '../../Components/button';
import { Trash2, AlertCircle, Clock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { queryClient } from '../../lib/queryClient';
import { useAuth } from '../../hooks/use-auth';
import { UserRole } from '../../types';
import AddAvailabilityForm from './AddAvailabilityForm';
import { Badge } from "../../Components/Badge";

const AvailabilityTable = ({ lecturerId }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const canEdit =
    user?.name === 'admin' ||
    (user?.role === UserRole.ADMIN || (user?.role === UserRole.LECTURER && user?.id === lecturerId));

  const { data: lecturerResponse, isLoading: isLecturerLoading, error: lecturerError } = useQuery({
    queryKey: ['/lecturers', lecturerId],
    queryFn: () => apiRequest('GET', `/lecturers/${lecturerId}`),
    staleTime: 5 * 60 * 1000,
    enabled: !!lecturerId,
  });

  const { data: availabilitiesResponse, isLoading: isAvailabilityLoading, error: availabilityError } = useQuery({
    queryKey: ['/lecturers', lecturerId, 'availability'],
    queryFn: () => apiRequest('GET', `/lecturers/${lecturerId}/availability`),
    staleTime: 5 * 60 * 1000,
    enabled: !!lecturerId,
  });

  // Ensure we have proper data structures
  const lecturer = lecturerResponse?.data || {};
  const availabilities = Array.isArray(availabilitiesResponse) 
    ? availabilitiesResponse 
    : Array.isArray(availabilitiesResponse?.data) 
      ? availabilitiesResponse.data 
      : [];

  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (availabilityId) => {
      const response = await apiRequest('DELETE', `/lecturers/availability/${availabilityId}`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to delete availability');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] });
      toast({
        title: 'Success',
        description: 'Availability slot removed successfully',
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
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

  const formatTime = (time) => {
    return time.length === 5 ? time : time.substring(0, 5);
  };

  const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  if (!lecturerId) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-gray-500">
        <p>Select a lecturer to view their availability</p>
      </div>
    );
  }

  if (isLecturerLoading || isAvailabilityLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (lecturerError || availabilityError) {
    const errorMessage = lecturerError?.message || availabilityError?.message || 'An error occurred';
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-center">{errorMessage}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId] });
            queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Availability Schedule
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {lecturer.title} {lecturer.fullName}
            </p>
          </div>
          {canEdit && (
            <AddAvailabilityForm
              lecturerId={lecturerId}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/lecturers', lecturerId, 'availability'] });
              }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {allDays.map((day) => {
            const dayAvailability = availabilities.filter((slot) => slot.day === day);
            return (
              <div key={day} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {dayAvailability.length} slots
                  </Badge>
                </div>
                {dayAvailability.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-2 bg-gray-50 rounded">
                    No availability set
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dayAvailability.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded group hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteAvailability(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityTable;