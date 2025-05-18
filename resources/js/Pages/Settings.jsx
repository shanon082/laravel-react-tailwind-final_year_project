import Layout from '@/MajorComponents/layout/layout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/card';
import { Button } from '@/Components/Button';
import { Input } from '@/Components/input';
import { Label } from '@/Components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/select';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Default settings as fallback
const DEFAULT_SETTINGS = {
  academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
  semesters: [
    { 
      name: 'First', 
      start_date: new Date(new Date().getFullYear(), 7, 1).toISOString().split('T')[0], // August 1st
      end_date: new Date(new Date().getFullYear(), 11, 15).toISOString().split('T')[0]  // December 15th
    },
    { 
      name: 'Second', 
      start_date: new Date(new Date().getFullYear() + 1, 0, 15).toISOString().split('T')[0], // January 15th
      end_date: new Date(new Date().getFullYear() + 1, 4, 30).toISOString().split('T')[0]    // May 30th
    },
    { 
      name: 'Third', 
      start_date: new Date(new Date().getFullYear() + 1, 5, 15).toISOString().split('T')[0], // June 15th
      end_date: new Date(new Date().getFullYear() + 1, 6, 30).toISOString().split('T')[0]    // July 30th
    }
  ],
  time_slots: [
    { start_time: '08:00:00', end_time: '10:00:00' },
    { start_time: '11:00:00', end_time: '13:00:00' },
    { start_time: '14:00:00', end_time: '16:00:00' }
  ],
  lunch_break: { start_time: '13:00:00', end_time: '14:00:00' },
  max_courses_per_day: 3,
  notifications: { email: true, in_app: true },
  export_format: 'csv',
  theme: { primary_color: '#4B5EAA', secondary_color: '#FF5733' },
};

export default function Settings({ auth, settings: initialSettings }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current academic year and settings
  const { data: currentSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/settings');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch settings');
      }
      return response.json();
    },
    initialData: initialSettings
  });

  // Fetch lecturers
  const { data: lecturers, isLoading: isLecturersLoading } = useQuery({
    queryKey: ['lecturers'],
    queryFn: async () => {
      const response = await fetch('/lecturers');
      if (!response.ok) {
        throw new Error('Failed to fetch lecturers');
      }
      return response.json();
    }
  });

  // Fetch students
  const { data: students, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch('/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      return response.json();
    }
  });

  // Initialize form data with default values merged with current settings
  const [formData, setFormData] = useState(() => {
    // Merge stored settings with defaults, ensuring all required fields exist
    const storedSettings = initialSettings || {};
    console.log('Initial settings from server:', storedSettings);

    // Ensure semesters have proper date formats
    const semesters = (storedSettings.semesters || DEFAULT_SETTINGS.semesters).map(sem => ({
      ...sem,
      start_date: sem.start_date ? new Date(sem.start_date).toISOString().split('T')[0] : '',
      end_date: sem.end_date ? new Date(sem.end_date).toISOString().split('T')[0] : ''
    }));

    return {
      academic_year: storedSettings.academic_year || DEFAULT_SETTINGS.academic_year,
      semesters,
      time_slots: storedSettings.time_slots || DEFAULT_SETTINGS.time_slots,
      lunch_break: {
        ...DEFAULT_SETTINGS.lunch_break,
        ...(storedSettings.lunch_break || {})
      },
      max_courses_per_day: storedSettings.max_courses_per_day || DEFAULT_SETTINGS.max_courses_per_day,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(storedSettings.notifications || {})
      },
      export_format: storedSettings.export_format || DEFAULT_SETTINGS.export_format,
      theme: {
        ...DEFAULT_SETTINGS.theme,
        ...(storedSettings.theme || {})
      }
    };
  });

  // Log the current form data whenever it changes
  useEffect(() => {
    console.log('Current form data:', formData);
  }, [formData]);

  // Update form data when settings are loaded
  useEffect(() => {
    if (currentSettings) {
      setFormData(prev => ({
        ...DEFAULT_SETTINGS,
        ...currentSettings,
        // Ensure nested objects exist
        semesters: currentSettings.semesters || DEFAULT_SETTINGS.semesters,
        time_slots: currentSettings.time_slots || DEFAULT_SETTINGS.time_slots,
        lunch_break: {
          ...DEFAULT_SETTINGS.lunch_break,
          ...(currentSettings.lunch_break || {})
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(currentSettings.notifications || {})
        },
        theme: {
          ...DEFAULT_SETTINGS.theme,
          ...(currentSettings.theme || {})
        }
      }));
    }
  }, [currentSettings]);

  // Add loading state
  if (isSettingsLoading) {
    return (
      <Layout user={auth.user}>
        <Head title="Settings" />
        <div className="py-12 bg-gray-100 min-h-screen">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSemesterChange = (index, field, value) => {
    setFormData(prev => {
      const updatedSemesters = [...prev.semesters];
      updatedSemesters[index] = { 
        ...updatedSemesters[index], 
        [field]: field.includes('date') ? new Date(value).toISOString().split('T')[0] : value 
      };
      return { ...prev, semesters: updatedSemesters };
    });
  };

  const handleTimeSlotChange = (index, field, value) => {
    setFormData(prev => {
      const updatedTimeSlots = [...prev.time_slots];
      updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
      return { ...prev, time_slots: updatedTimeSlots };
    });
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      time_slots: [...prev.time_slots, { start_time: '00:00:00', end_time: '00:00:00' }],
    }));
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    console.log('Submitting settings data:', formData);
    
    // Validate dates before submission
    const hasInvalidDates = formData.semesters.some(sem => {
      const start = new Date(sem.start_date);
      const end = new Date(sem.end_date);
      return isNaN(start.getTime()) || isNaN(end.getTime()) || start > end;
    });

    if (hasInvalidDates) {
      toast({
        title: 'Error',
        description: 'Please check that all semester dates are valid and end dates are after start dates',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    router.post('/settings', formData, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
          variant: 'default',
        });
        setIsSubmitting(false);
      },
      onError: (errors) => {
        console.error('Error saving settings:', errors);
        toast({
          title: 'Error',
          description: errors.message || 'Failed to save settings',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      },
    });
  };

  return (
    <Layout user={auth.user}>
      <Head title="Settings" />
      <div className="py-12 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Academic Year */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Academic Year</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="academic-year">Current Academic Year</Label>
                    <Input
                      id="academic-year"
                      value={formData.academic_year}
                      onChange={(e) => handleChange('academic_year', e.target.value)}
                      placeholder="e.g. 2023-2024"
                      className="mt-1"
                    />
                  </div>
                </div>
              </section>

              {/* Semesters */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Semesters</h2>
                {formData.semesters.map((semester, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                    <div>
                      <Label htmlFor={`semester-name-${index}`}>Semester Name</Label>
                      <Select
                        value={semester.name}
                        onValueChange={(value) => handleSemesterChange(index, 'name', value)}
                      >
                        <SelectTrigger id={`semester-name-${index}`} className="mt-1">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First">First</SelectItem>
                          <SelectItem value="Second">Second</SelectItem>
                          <SelectItem value="Third">Third</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`semester-start-${index}`}>Start Date</Label>
                      <Input
                        id={`semester-start-${index}`}
                        type="date"
                        value={semester.start_date}
                        onChange={(e) => handleSemesterChange(index, 'start_date', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`semester-end-${index}`}>End Date</Label>
                      <Input
                        id={`semester-end-${index}`}
                        type="date"
                        value={semester.end_date}
                        onChange={(e) => handleSemesterChange(index, 'end_date', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </section>

              {/* Timetable Generation Settings */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Timetable Generation</h2>
                <div className="grid grid-cols-1 gap-6">
                  {/* Time Slots */}
                  <div>
                    <Label>Time Slots</Label>
                    {formData.time_slots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-4 mb-2">
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => handleTimeSlotChange(index, 'start_time', e.target.value)}
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => handleTimeSlotChange(index, 'end_time', e.target.value)}
                          className="w-32"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTimeSlot(index)}
                          disabled={formData.time_slots.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" onClick={addTimeSlot} className="mt-2">
                      Add Time Slot
                    </Button>
                  </div>
                  {/* Lunch Break */}
                  <div>
                    <Label>Lunch Break</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="time"
                        value={formData.lunch_break.start_time}
                        onChange={(e) =>
                          handleChange('lunch_break', {
                            ...formData.lunch_break,
                            start_time: e.target.value,
                          })
                        }
                        className="w-32"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={formData.lunch_break.end_time}
                        onChange={(e) =>
                          handleChange('lunch_break', {
                            ...formData.lunch_break,
                            end_time: e.target.value,
                          })
                        }
                        className="w-32"
                      />
                    </div>
                  </div>
                  {/* Max Courses Per Day */}
                  <div>
                    <Label htmlFor="max-courses">Max Courses Per Day (Per Lecturer)</Label>
                    <Input
                      id="max-courses"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.max_courses_per_day}
                      onChange={(e) => handleChange('max_courses_per_day', parseInt(e.target.value))}
                      className="w-32 mt-1"
                    />
                  </div>
                </div>
              </section>

              {/* Notification Preferences */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={formData.notifications.email}
                      onChange={(e) =>
                        handleChange('notifications', {
                          ...formData.notifications,
                          email: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="in-app-notifications"
                      checked={formData.notifications.in_app}
                      onChange={(e) =>
                        handleChange('notifications', {
                          ...formData.notifications,
                          in_app: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                  </div>
                </div>
              </section>

              {/* Export Format */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Export Format</h2>
                <Select
                  value={formData.export_format}
                  onValueChange={(value) => handleChange('export_format', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </section>

              {/* Theme Customization */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Theme Customization</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={formData.theme.primary_color}
                      onChange={(e) =>
                        handleChange('theme', {
                          ...formData.theme,
                          primary_color: e.target.value,
                        })
                      }
                      className="h-10 w-32 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <Input
                      id="secondary-color"
                      type="color"
                      value={formData.theme.secondary_color}
                      onChange={(e) =>
                        handleChange('theme', {
                          ...formData.theme,
                          secondary_color: e.target.value,
                        })
                      }
                      className="h-10 w-32 mt-1"
                    />
                  </div>
                </div>
              </section>
            </CardContent>
            <div className="p-6 border-t border-gray-200">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}