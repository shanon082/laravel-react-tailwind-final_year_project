import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { useState } from "react";

// LecturerListProps and LecturerWithUserDetails interfaces from TypeScript are omitted in JavaScript since type checking is not available.
const LecturerList = ({ onSelectLecturer, selectedLecturerId }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lecturers, isLoading } = useQuery({
    queryKey: ['/api/lecturers'],
  });

  const filteredLecturers = lecturers?.filter(lecturer => {
    if (!searchQuery) return true;
    
    const fullName = lecturer.userDetails?.fullName || "";
    const department = lecturer.userDetails?.department || lecturer.department || "";
    
    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lecturers</CardTitle>
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search lecturers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !filteredLecturers || filteredLecturers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? "No lecturers match your search" : "No lecturers found"}
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {filteredLecturers.map((lecturer) => (
                <Button
                  key={lecturer.id}
                  variant={selectedLecturerId === lecturer.id ? "default" : "outline"}
                  className="w-full justify-start py-6"
                  onClick={() => onSelectLecturer(lecturer.id)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-primary text-white">
                        {lecturer.userDetails?.fullName?.charAt(0) || 'L'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">
                        {lecturer.title} {lecturer.userDetails?.fullName || `Lecturer ${lecturer.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lecturer.userDetails?.department || lecturer.department}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LecturerList;
