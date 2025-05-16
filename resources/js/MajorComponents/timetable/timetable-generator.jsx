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

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/settings');
      return response.json().settings;
    },
  });

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
      return new Promise((resolve, reject) => {
        router.post(
          '/timetable/generate',
          {
            ...data,
            _token: document.querySelector('meta[name="csrf-token"]').content,
          },
          {
            preserveState: true,
            onSuccess: (page) => {
              setTimetable(page.props.timetable || []);
              setConflicts(page.props.conflicts || []);
              setFilter({
                ...filter,
                academic_year: data.academic_year,
                semester: data.semester,
              });
              resolve(page.props);
            },
            onError: (errors) => {
              reject(new Error(errors.message || 'Failed to generate timetable'));
            },
          }
        );
      });
    },
    onSuccess: (props) => {
      if (!props.timetable || props.timetable.length === 0) {
        toast({
          title: "No Timetable Generated",
          description: "No timetable entries were generated. Please ensure sufficient data is available.",
          variant: "warning",
          duration: 5000,
        });
      } else if (props.conflicts && props.conflicts.length > 0) {
        toast({
          title: "Conflicts Detected",
          description: `${props.conflicts.length} conflicts found in the generated timetable.`,
          variant: "warning",
          duration: 5000,
        });
      } else {
        toast({
          title: "Success",
          description: "Timetable generated and saved successfully.",
          variant: "default",
          duration: 5000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/timetable'] });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred while generating the timetable.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      academic_year: year,
      semester: term,
    });
  };

  const handleExport = (format) => {
    const url = `/timetable/export?academic_year=${encodeURIComponent(year)}&semester=${encodeURIComponent(term)}&format=${format}`;
    window.location.href = url;
  };

  const handleCancel = () => {
    router.visit(`/timetable?academic_year=${year}&semester=${term}`);
  };

  // Update year and term based on settings once loaded
  useEffect(() => {
    if (settings) {
      setYear(settings.academic_year || academicYear);
      if (settings.semesters && settings.semesters.length > 0) {
        setTerm(settings.semesters[0].name);
        setFilter((prev) => ({
          ...prev,
          academic_year: settings.academic_year || academicYear,
          semester: settings.semesters[0].name,
        }));
      }
    }
  }, [settings]);

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
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 2023-2024"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger id="semester" className="mt-1">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.semesters ?? []).map((sem) => (
                      <SelectItem key={sem.name} value={sem.name}>
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

      {timeSlotsLoading ? (
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
