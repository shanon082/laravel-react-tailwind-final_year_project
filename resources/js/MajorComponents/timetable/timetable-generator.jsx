import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../Components/card";
import { Button } from "../../Components/Button";
import { Input } from "../../Components/input";
import { Label } from "../../Components/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../Components/select";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";

const TimetableGenerator = ({ academicYear, semester }) => {
  const { toast } = useToast();
  const [year, setYear] = useState(academicYear);
  const [term, setTerm] = useState(semester);

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiRequest("POST", "/timetable/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/timetable'] });
      queryClient.invalidateQueries({ queryKey: ['/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/stats'] });
      
      toast({
        title: "Timetable Generated",
        description: `Successfully generated timetable with ${data.entries.length} entries and ${data.conflicts.length} conflicts.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({ academicYear: year, semester: term });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Generate New Timetable</CardTitle>
      </CardHeader>
      <CardContent>
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
                <SelectItem value="First">First</SelectItem>
                <SelectItem value="Second">Second</SelectItem>
                <SelectItem value="Third">Third</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>This will generate a new timetable based on:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Available rooms and their capacities</li>
            <li>Lecturer availability</li>
            <li>Course requirements and conflicts</li>
          </ul>
          <p className="mt-2 text-red-500 font-semibold">
            Warning: This will replace any existing timetable for the selected academic year and semester.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Timetable'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TimetableGenerator;