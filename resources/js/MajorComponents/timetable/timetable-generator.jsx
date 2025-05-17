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
  const [year, setYear] = useState(academicYear);
  const [term, setTerm] = useState(semester);
  const [timetable, setTimetable] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [filter, setFilter] = useState({
    academic_year: academicYear,
    semester: semester,
    day: null,
    course_id: null,
    room_id: null,
    lecturer_id: null,
    department: null,
    level: null,
  });
  const [error, setError] = useState(null);

  // Fetch existing timetable
  const { data: existingTimetable = [], isLoading: timetableLoading, refetch: refetchTimetable } = useQuery({
    queryKey: ['timetable', filter.academic_year, filter.semester],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/timetable?academic_year=${encodeURIComponent(filter.academic_year)}&semester=${encodeURIComponent(filter.semester)}`);
        const data = await response.json();
        setTimetable(data.timetable || []);
        setConflicts(data.conflicts || []);
        return data.timetable || [];
      } catch (error) {
        console.error('Error fetching timetable:', error);
        return [];
      }
    },
    enabled: !!filter.academic_year && !!filter.semester,
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/settings');
      const data = await response.json();
      return data.settings;
    },
  });

  const { academicYear: currentAcademicYear, semesterName } = getCurrentAcademicInfo(settings);

  useEffect(() => {
    if (settings) {
      setYear(currentAcademicYear);
      setTerm(semesterName);
      setFilter((prev) => ({
        ...prev,
        academic_year: currentAcademicYear,
        semester: semesterName,
      }));
    }
  }, [settings]);

  // Fetch time slots
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["/timeslots"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/timeslots');
      return response.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      console.log("Starting timetable generation with data:", data);
      return new Promise((resolve, reject) => {
        router.post(
          "timetable/generate",
          {
            academic_year: data.academic_year,
            semester: parseInt(data.semester, 10)
          },
          {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
              console.log("Generation response:", page);
              // Check for flash message
              const success = page.props?.flash?.success;
              const error = page.props?.flash?.error;
              
              if (error) {
                reject(new Error(error));
                return;
              }

              // Fetch the updated timetable after generation
              router.reload({ only: ['timetable'] });
              
              resolve({
                message: success || 'Timetable generated successfully',
                timetable: page.props.timetable || [],
                conflicts: page.props.conflicts || [],
                stats: page.props.stats || {}
              });
            },
            onError: (errors) => {
              console.error("Generation failed with errors:", errors);
              reject(new Error(errors.message || 'Failed to generate timetable'));
            },
          }
        );
      });
    },
    onSuccess: (response) => {
      console.log("Mutation completed successfully:", response);
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
        duration: 5000
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/timetable'] });
      queryClient.invalidateQueries(['timetable']);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred while generating the timetable. Please check that you have:\n1. Courses in the system\n2. Available rooms\n3. Assigned lecturers\n4. Defined time slots"
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

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
