import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../Components/dialog';
import { Button } from '../../Components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../Components/select';
import { Input } from '../../Components/input';
import { Label } from '../../Components/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

const AddAvailabilityForm = ({ lecturerId, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    day: 'MONDAY',
    start_time: '08:00',
    end_time: '17:00',
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest('POST', `/lecturers/${lecturerId}/availability`, data);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to add availability');
      }
      return response;
    },
    onSuccess: () => {
      setIsOpen(false);
      setFormData({
        day: 'MONDAY',
        start_time: '08:00',
        end_time: '17:00',
      });
      toast({
        title: 'Success',
        description: 'Availability added successfully',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Failed to add availability',
        description: error.message || 'An error occurred while adding availability.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (formData.start_time >= formData.end_time) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
      return;
    }

    addAvailabilityMutation.mutate(formData);
  };

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open && onClose) {
      onClose();
    }
  };

  const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            <Select
              value={formData.day}
              onValueChange={(value) => setFormData(prev => ({ ...prev, day: value }))}
            >
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
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                aria-label="Start time"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                aria-label="End time"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addAvailabilityMutation.isPending}
            className="px-6 py-2"
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
  );
};

export default AddAvailabilityForm;