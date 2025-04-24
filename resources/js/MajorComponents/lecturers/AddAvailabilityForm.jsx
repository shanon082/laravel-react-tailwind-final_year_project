import { useState, useEffect } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../Components/dialog';
import { Button } from '../../Components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../Components/select';
import { Input } from '../../Components/input';
import { Label } from '../../Components/label';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const AddAvailabilityForm = ({ lecturerId, onSuccess }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { flash } = usePage().props; // Access flash messages

  const form = useForm({
    day: 'MONDAY',
    start_time: '08:00',
    end_time: '17:00',
  });

  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      toast({
        title: 'Success',
        description: flash.success,
      });
    }
    if (flash?.error) {
      toast({
        title: 'Error',
        description: flash.error,
        variant: 'destructive',
      });
    }
  }, [flash, toast]);

  const handleSubmit = () => {
    if (form.data.start_time >= form.data.end_time) {
      toast({
        title: 'Invalid time range',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
      return;
    }

    form.post(`/lecturers/${lecturerId}/availability`, {
      onSuccess: () => {
        setIsOpen(false);
        form.reset();
        onSuccess();
      },
      onError: (errors) => {
        toast({
          title: 'Failed to add availability',
          description: errors.message || 'An error occurred while adding availability.',
          variant: 'destructive',
        });
      },
    });
  };

  const allDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              value={form.data.day}
              onValueChange={(value) => form.setData('day', value)}
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
                value={form.data.start_time}
                onChange={(e) => form.setData('start_time', e.target.value)}
                aria-label="Start time"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={form.data.end_time}
                onChange={(e) => form.setData('end_time', e.target.value)}
                aria-label="End time"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={form.processing}
            className="px-6 py-2"
          >
            {form.processing ? (
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