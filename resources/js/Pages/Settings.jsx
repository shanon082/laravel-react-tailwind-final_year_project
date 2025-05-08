import Layout from '@/MajorComponents/layout/layout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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

export default function Settings({ auth }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    academic_year: '2023-2024',
    semesters: [
      { name: 'First', start_date: '2023-09-01', end_date: '2023-12-15' },
      { name: 'Second', start_date: '2024-01-15', end_date: '2024-05-30' },
      { name: 'Third', start_date: '2024-06-01', end_date: '2024-08-15' },
    ],
    time_slots: [
      { start_time: '08:00:00', end_time: '09:00:00' },
      { start_time: '09:00:00', end_time: '10:00:00' },
      { start_time: '10:00:00', end_time: '11:00:00' },
      { start_time: '11:00:00', end_time: '12:00:00' },
      { start_time: '13:00:00', end_time: '14:00:00' },
      { start_time: '14:00:00', end_time: '15:00:00' },
    ],
    lunch_break: { start_time: '13:00:00', end_time: '14:00:00' },
    max_courses_per_day: 3,
    notifications: { email: true, in_app: true },
    export_format: 'csv',
    theme: { primary_color: '#4B5EAA', secondary_color: '#FF5733' },
  });

  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/settings');
      return response.json().settings;
    },
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return new Promise((resolve, reject) => {
        router.post(
          '/settings',
          {
            ...data,
            _token: document.querySelector('meta[name="csrf-token"]').content,
          },
          {
            preserveState: true,
            onSuccess: (page) => {
              console.log('Settings update success:', page.props);
              resolve(page.props);
            },
            onError: (errors) => {
              console.error('Settings update error:', errors);
              reject(new Error(errors.message || 'Failed to update settings'));
            },
          }
        );
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Settings updated successfully.',
        variant: 'default',
        duration: 5000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred while updating settings.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSemesterChange = (index, field, value) => {
    const updatedSemesters = [...settings.semesters];
    updatedSemesters[index] = { ...updatedSemesters[index], [field]: value };
    setSettings((prev) => ({ ...prev, semesters: updatedSemesters }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedTimeSlots = [...settings.time_slots];
    updatedTimeSlots[index] = { ...updatedTimeSlots[index], [field]: value };
    setSettings((prev) => ({ ...prev, time_slots: updatedTimeSlots }));
  };

  const addTimeSlot = () => {
    setSettings((prev) => ({
      ...prev,
      time_slots: [...prev.time_slots, { start_time: '00:00:00', end_time: '00:00:00' }],
    }));
  };

  const removeTimeSlot = (index) => {
    setSettings((prev) => ({
      ...prev,
      time_slots: prev.time_slots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    console.log('Saving settings:', settings);
    updateMutation.mutate(settings);
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
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Academic Year */}
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Academic Year</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="academic-year">Current Academic Year</Label>
                        <Input
                          id="academic-year"
                          value={settings.academic_year}
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
                    {settings.semesters.map((semester, index) => (
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
                        {settings.time_slots.map((slot, index) => (
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
                              disabled={settings.time_slots.length === 1}
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
                            value={settings.lunch_break.start_time}
                            onChange={(e) =>
                              handleChange('lunch_break', {
                                ...settings.lunch_break,
                                start_time: e.target.value,
                              })
                            }
                            className="w-32"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={settings.lunch_break.end_time}
                            onChange={(e) =>
                              handleChange('lunch_break', {
                                ...settings.lunch_break,
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
                          value={settings.max_courses_per_day}
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
                          checked={settings.notifications.email}
                          onChange={(e) =>
                            handleChange('notifications', {
                              ...settings.notifications,
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
                          checked={settings.notifications.in_app}
                          onChange={(e) =>
                            handleChange('notifications', {
                              ...settings.notifications,
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
                      value={settings.export_format}
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
                          value={settings.theme.primary_color}
                          onChange={(e) =>
                            handleChange('theme', {
                              ...settings.theme,
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
                          value={settings.theme.secondary_color}
                          onChange={(e) =>
                            handleChange('theme', {
                              ...settings.theme,
                              secondary_color: e.target.value,
                            })
                          }
                          className="h-10 w-32 mt-1"
                        />
                      </div>
                    </div>
                  </section>
                </>
              )}
            </CardContent>
            <div className="p-6 border-t border-gray-200">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {updateMutation.isPending ? (
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