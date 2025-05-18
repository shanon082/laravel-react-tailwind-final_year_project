import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/card";
import { Button } from "../../Components/button";
import { Avatar, AvatarFallback } from "../../Components/avatar";
import { ScrollArea } from "../../Components/scroll-area";
import { Search, X, AlertCircle, Mail, Phone, Building2, GraduationCap, Clock } from "lucide-react";
import { Input } from "../../Components/input";
import { useState } from "react";
import { apiRequest } from "../../lib/queryClient";
import { Badge } from "../../Components/Badge";
import AvailabilityTable from "./availability-table";
import PrimaryButton from "@/Components/PrimaryButton";

const LecturerList = ({ onSelectLecturer, selectedLecturerId }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lecturersResponse, isLoading, error } = useQuery({
    queryKey: ["/lecturers", searchQuery],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", `/lecturers${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`);
        console.log("Lecturers data:", data);
        return data;
      } catch (error) {
        console.error('Error fetching lecturers:', error);
        throw error;
      }
    },
  });

  // Extract lecturers from the response
  const lecturers = lecturersResponse?.data || [];

  // No need for additional filtering since the backend handles search
  const filteredLecturers = lecturers;

  console.log("Filtered lecturers:", filteredLecturers);

  const handleViewAvailability = (lecturer) => {
    if (onSelectLecturer) {
      onSelectLecturer(lecturer.id);
    }
  };

  if (error) {
    return (
      <Card className="h-full shadow-sm rounded-lg">
        <CardContent className="flex flex-col items-center justify-center p-6 text-red-600">
          <AlertCircle className="h-10 w-10 mb-2" />
          <p>Error loading lecturers: {error.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm rounded-lg bg-white">
      <CardHeader className="border-b border-gray-100 pb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl font-semibold flex items-center">
            <GraduationCap className="h-5 w-5 mr-2 text-primary" />
            Lecturers Directory
          </CardTitle>
          <Badge variant="outline" className="text-sm">
            {filteredLecturers.length} Lecturers
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by name, department, or title..."
            className="pl-10 h-11 w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search lecturers"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-gray-200"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start gap-4 p-4 animate-pulse bg-gray-50 rounded-lg">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !filteredLecturers.length ? (
          <div className="text-center py-12 px-4">
            <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Lecturers Found
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery 
                ? "No lecturers match your search criteria. Try adjusting your search terms." 
                : "No lecturers have been added to the system yet."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLecturers.map((lecturer) => (
                <div
                  key={lecturer.id}
                  className={`bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedLecturerId === lecturer.id ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                  onClick={() => handleViewAvailability(lecturer)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-white text-lg">
                        {lecturer.fullName?.charAt(0) || "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-900 truncate">
                          {lecturer.title} {lecturer.fullName || `Lecturer ${lecturer.id}`}
                        </h3>
                        <Badge variant="outline" className="ml-2">
                          {lecturer.department || "No Department"}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-500">
                        {lecturer.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">{lecturer.email}</span>
                          </div>
                        )}
                        {lecturer.contact && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{lecturer.contact}</span>
                          </div>
                        )}
                        {lecturer.department && (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="truncate">{lecturer.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LecturerList;