import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
import { Button } from "../../Components/Button";
import { AlertCircle, XCircleIcon, AlertTriangleIcon } from "lucide-react";
import { queryClient } from "../../lib/queryClient";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { UserRole } from "../../types";
import { useAuth } from "../../hooks/use-auth";
import PrimaryButton from "@/Components/PrimaryButton";

const ConflictList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get conflicts
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['conflicts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/conflicts');
      return response.json();
    },
  });

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: async (conflictId) => {
      await apiRequest("PUT", `/conflicts/${conflictId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/timetable'] });
      queryClient.invalidateQueries({ queryKey: ['/stats'] });
      toast({
        title: "Conflict resolved",
        description: "The conflict has been marked as resolved",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to resolve conflict",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle resolve button click
  const handleResolve = (conflictId) => {
    resolveConflictMutation.mutate(conflictId);
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow rounded-lg mb-8">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900">
            Loading conflicts...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <Card className="bg-white shadow rounded-lg mb-8">
        <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <CardTitle className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <AlertCircle className="h-5 w-5 text-green-500 mr-2" />
            No Conflicts Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600">The current timetable has no conflicts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow rounded-lg mb-8">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <CardTitle className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          Conflicts Detected ({conflicts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y divide-gray-200">
          {conflicts.map((conflict) => (
            <li key={conflict.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    {conflict.type === 'ROOM' && (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                    {conflict.type === 'LECTURER' && (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                    {conflict.type === 'AVAILABILITY' && (
                      <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                    )}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {conflict.type === 'ROOM' && 'Room Conflict'}
                    {conflict.type === 'LECTURER' && 'Lecturer Conflict'}
                    {conflict.type === 'AVAILABILITY' && 'Availability Warning'}
                  </h3>
                  <div className="mt-1 text-sm text-gray-600">
                    <p>{conflict.description}</p>
                    {conflict.entry && conflict.conflictingEntry && conflict.type !== 'AVAILABILITY' && (
                      <ul className="mt-1 list-disc pl-5 text-xs text-gray-500">
                        <li>
                          {conflict.entry.course?.name} ({conflict.entry.room?.name}, {conflict.entry.lecturer?.userDetails?.fullName})
                        </li>
                        <li>
                          {conflict.conflictingEntry.course?.name} ({conflict.conflictingEntry.room?.name}, {conflict.conflictingEntry.lecturer?.userDetails?.fullName})
                        </li>
                      </ul>
                    )}
                  </div>
                  {user?.role === UserRole.ADMIN && (
                    <div className="mt-2 flex space-x-2">
                      <PrimaryButton
                        size="sm"
                        onClick={() => handleResolve(conflict.id)}
                        disabled={resolveConflictMutation.isPending}
                      >
                        {resolveConflictMutation.isPending ? 'Resolving...' : 'Resolve'}
                      </PrimaryButton>
                      <PrimaryButton
                        size="sm"
                        variant="outline"
                      >
                        Ignore
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ConflictList;