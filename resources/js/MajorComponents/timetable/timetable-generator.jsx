import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../Components/card";
import { Button } from "@/Components/Button";
import { Input } from "../../Components/input";
import { Label } from "../../Components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/select";
import { Loader2, AlertCircle, Download } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "@inertiajs/react";
import { queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import TimetableGrid from "./timetable-grid";
import SecondaryButton from "@/Components/SecondaryButton";
import { Alert, AlertDescription, AlertTitle } from "@/Components/alert";
import { getCurrentAcademicInfo } from "../../utils/academicInfo";

const TimetableGenerator = ({ academicYear, semester }) => {
  const { toast } = useToast();
  const [year, setYear] = useState("");
  const [term, setTerm] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [filter, setFilter] = useState({
    academic_year: "",
    semester: "",
    day: null,
    course_id: null,
    room_id: null,
    lecturer_id: null,
    department: null,
    level: null,
  });
  const [error, setError] = useState(null);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const data = await apiRequest('GET', '/settings');
      return data.settings;
    },
  });

  const { academicYear: currentAcademicYear, semesterName } = getCurrentAcademicInfo(settings);

  // Initialize form values from settings
  useEffect(() => {
    if (settings) {
      setYear(currentAcademicYear || "");
      setTerm(semesterName || "");
      setFilter((prev) => ({
        ...prev,
        academic_year: currentAcademicYear || "",
        semester: semesterName || "",
      }));
    }
  }, [settings, currentAcademicYear, semesterName]);

  // Fetch existing timetable
  const { data: existingTimetable = [], isLoading: timetableLoading, refetch: refetchTimetable } = useQuery({
    queryKey: ['timetable', filter.academic_year, filter.semester],
    queryFn: async () => {
      try {
        const data = await apiRequest('GET', `/timetable?academic_year=${encodeURIComponent(filter.academic_year)}&semester=${encodeURIComponent(filter.semester)}`);
        setTimetable(data.timetable || []);
        setConflicts(data.conflicts || []);
        return data.timetable || [];
      } catch (error) {
        console.error('Error fetching timetable:', error);
        throw error;
      }
    },
    enabled: !!filter.academic_year && !!filter.semester,
  });

  // Fetch time slots from settings
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['timeSlots'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/timeslots');
        return response || [];
      } catch (error) {
        console.error('Error fetching time slots:', error);
        return [];
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Starting timetable generation with data:", data);
      return new Promise((resolve, reject) => {
        router.post(
          route('timetable.generate'),
          {
            academic_year: data.academic_year,
            semester: parseInt(data.semester, 10)
          },
          {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
              console.log("Generation response:", page);
              
              // Extract data from the Inertia page props
              const { timetable, conflicts, stats, flash } = page.props;
              
              if (flash?.error) {
                reject(new Error(flash.error));
                return;
              }

              // Update filter to match generated timetable
              setFilter(prev => ({
                ...prev,
                academic_year: data.academic_year,
                semester: data.semester
              }));
              
              // Update local state
              setTimetable(timetable || []);
              setConflicts(conflicts || []);
              
              // Trigger a refetch of the timetable data
              refetchTimetable();
              
              resolve({
                message: flash?.success || 'Timetable generated successfully',
                timetable,
                conflicts,
                stats: stats || {}
              });
            },
            onError: (errors) => {
              console.error("Generation errors:", errors);
              reject(new Error(errors.message || 'Failed to generate timetable'));
            }
          }
        );
      });
    },
    onSuccess: (data) => {
      // Show success toast with stats
      toast({
        title: "Success",
        description: (
          <div>
            <p>{data.message}</p>
            {data.stats && (
              <ul className="mt-2 text-sm">
                <li>Courses scheduled: {data.stats.courses_scheduled}</li>
                <li>Rooms used: {data.stats.rooms_used}</li>
                <li>Lecturers assigned: {data.stats.lecturers_assigned}</li>
              </ul>
            )}
          </div>
        ),
        className: "bg-green-50 border-green-200",
        duration: 5000
      });
    },
    onError: (error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to generate timetable',
        duration: 10000
      });
    },
  });

  const handleGenerate = async () => {
    try {
      setError(null);
      
      // Validate semester is a number
      const semesterValue = parseInt(term, 10);
      if (isNaN(semesterValue)) {
        setError('Invalid semester value');
        toast({
          variant: "destructive",
          title: "Error",
          description: 'Invalid semester value'
        });
        return;
      }

      // Validate academic year format (YYYY/YYYY)
      const yearPattern = /^\d{4}\/\d{4}$/;
      if (!yearPattern.test(year)) {
        setError('Academic year must be in format YYYY/YYYY (e.g., 2023/2024)');
        toast({
          variant: "destructive",
          title: "Error",
          description: 'Academic year must be in format YYYY/YYYY (e.g., 2023/2024)'
        });
        return;
      }

      const response = await generateMutation.mutateAsync({
        academic_year: year,
        semester: semesterValue,
      });

      if (response.error) {
        setError(response.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error
        });
        return;
      }

      // Show success message with stats
      toast({
        title: "Success",
        description: (
          <div>
            <p>{response.message}</p>
            <ul className="mt-2 text-sm">
              <li>Courses scheduled: {response.stats.courses_scheduled}</li>
              <li>Rooms used: {response.stats.rooms_used}</li>
              <li>Lecturers assigned: {response.stats.lecturers_assigned}</li>
            </ul>
          </div>
        ),
      });

      // Refresh the timetable data
      await refetchTimetable();

    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || 'Failed to generate timetable');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to generate timetable'
      });
    }
  };

  const handleExport = (format) => {
    const url = `/timetable/export?academic_year=${encodeURIComponent(year)}&semester=${encodeURIComponent(term)}&format=${format}`;
    window.location.href = url;
  };

  const handleCancel = () => {
    router.visit(`/timetable?academic_year=${year}&semester=${term}`);
  };

  // Define available semesters
  const availableSemesters = [
    { id: 1, name: "Semester One" },
    { id: 2, name: "Semester Two" },
    { id: 3, name: "Recess/Internship" }
  ];

  const handleYearChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    value = value.replace(/[^\d]/g, '');
    
    // Format as YYYY/YYYY if we have enough digits
    if (value.length >= 4) {
      const firstYear = value.slice(0, 4);
      const nextYear = (parseInt(firstYear) + 1).toString();
      value = `${firstYear}/${nextYear}`;
    }
    
    setYear(value);
  };

  // Add error display in the UI
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  // Add loading state display
  const renderLoading = () => {
    if (!generateMutation.isLoading) return null;
    
    return (
      <div className="mt-4 flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Generating timetable...</span>
      </div>
    );
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Timetable (AI-powered)</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="academic-year">Academic Year</Label>
                <Input
                  id="academic-year"
                  value={year}
                  onChange={handleYearChange}
                  placeholder="e.g., 2023/2024"
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the starting year (e.g., 2023). The end year will be automatically set.
                </p>
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select 
                  value={term} 
                  onValueChange={(value) => {
                    setTerm(value);
                    setFilter(prev => ({
                      ...prev,
                      semester: value
                    }));
                  }}
                >
                  <SelectTrigger id="semester" className="mt-1">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSemesters.map((sem) => (
                      <SelectItem key={sem.id} value={String(sem.id)}>
                        {sem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded text-sm text-red-700">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <strong>Conflicts Detected:</strong>
              </div>
              <ul className="list-disc pl-5 mt-2">
                {conflicts.map((conflict, index) => (
                  <li key={index}>{conflict.description}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            <p>This will generate a new timetable using OpenAI, considering:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Available rooms and their capacities</li>
              <li>Lecturer availability</li>
              <li>Course requirements and conflicts</li>
            </ul>
          </div>

          {renderError()}
          {renderLoading()}
        </CardContent>
        <CardFooter className="justify-between">
          <SecondaryButton variant="outline" onClick={handleCancel}>
            Cancel
          </SecondaryButton>
          <div className="flex space-x-2">
            <Button
              onClick={() => handleExport('csv')}
              disabled={timetable.length === 0 || generateMutation.isPending || timeSlotsLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={timetable.length === 0 || generateMutation.isPending || timeSlotsLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || timeSlotsLoading}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Timetable"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {(timetableLoading || timeSlotsLoading) ? (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <TimetableGrid
          filter={filter}
          viewType="week"
          timetable={timetable}
          timeSlots={timeSlots}
        />
      )}
    </div>
  );
};

export default TimetableGenerator;
