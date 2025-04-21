import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/card";
import { Button } from "../../Components/button";
import { Avatar, AvatarFallback } from "../../Components/avatar";
import { ScrollArea } from "../../Components/scroll-area";
import { Search, X } from "lucide-react";
import { Input } from "../../Components/input";
import { useState } from "react";
import { apiRequest } from "../../lib/queryClient";

const LecturerList = ({ onSelectLecturer, selectedLecturerId }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lecturersResponse, isLoading } = useQuery({
    queryKey: ["/lecturers"],
    queryFn: () => apiRequest("GET", "/lecturers").then((res) => res.json()),
  });

  // Extract the data array from the response, default to empty array if undefined
  const lecturers = lecturersResponse?.data || [];

  const filteredLecturers = lecturers.filter((lecturer) => {
    if (!searchQuery) return true;
    const fullName = lecturer.fullName || "";
    const department = lecturer.department || "";
    return (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Card className="h-full shadow-sm rounded-lg">
      <CardHeader>
        <CardTitle>Lecturers</CardTitle>
        <div className="mt-2 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 transition-transform duration-200 group-focus-within:scale-110" />
          <Input
            type="search"
            placeholder="Search lecturers by name or department..."
            className="pl-8 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lecturers"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !filteredLecturers || filteredLecturers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-2">
              {searchQuery ? "No lecturers match your search" : "No lecturers found"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2" role="listbox">
              {filteredLecturers.map((lecturer) => (
                <Button
                  key={lecturer.id}
                  variant={selectedLecturerId === lecturer.id ? "default" : "outline"}
                  className={`w-full justify-start py-6 transition-colors duration-200 ${
                    selectedLecturerId === lecturer.id ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectLecturer(lecturer.id)}
                  aria-selected={selectedLecturerId === lecturer.id}
                  title={`View availability for ${lecturer.fullName || `Lecturer ${lecturer.id}`}`}
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3 border border-gray-200">
                      <AvatarFallback className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                        {lecturer.fullName?.charAt(0) || "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium text-blue-500">
                        {lecturer.title} {lecturer.fullName || `Lecturer ${lecturer.id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lecturer.department}
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