import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../Components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../Components/table";
import { Button } from "../../Components/button";
import { Badge } from "../../Components/badge";
import { Edit } from "lucide-react";
import { router } from "@inertiajs/react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/Components/ToolTip";

const CourseList = ({ onEditCourse, coursesResponse }) => {
  console.log("coursesResponse:", coursesResponse);
  const courses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : [];
  const currentPage = coursesResponse?.current_page || 1;
  const lastPage = coursesResponse?.last_page || 1;
  const total = coursesResponse?.total || courses.length;

  console.log("Courses to render:", courses);

  const setCurrentPage = (page) => {
    router.get(
      route("courses"),
      { page, per_page: 10 },
      { preserveState: true, preserveScroll: true }
    );
  };

  if (!courses || courses.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No courses found. Add a course to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Courses ({total})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 font-semibold">Code</TableHead>
                <TableHead className="text-gray-700 font-semibold">Name</TableHead>
                <TableHead className="text-gray-700 font-semibold">Department</TableHead>
                <TableHead className="text-gray-700 font-semibold">Credit Units</TableHead>
                <TableHead className="text-gray-700 font-semibold">Lecturer</TableHead>
                <TableHead className="text-gray-700 font-semibold">Year</TableHead>
                <TableHead className="text-gray-700 font-semibold">Semester</TableHead>
                <TableHead className="text-gray-700 font-semibold">Type</TableHead>
                <TableHead className="text-gray-700 font-semibold w-12">Color</TableHead>
                {onEditCourse && (
                  <TableHead className="text-gray-700 font-semibold w-14">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course.id}
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <TableCell className="font-medium text-gray-900">
                    {course.code}
                  </TableCell>
                  <TableCell className="text-gray-700">{course.name}</TableCell>
                  <TableCell className="text-gray-700">
                    {course.department?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-700">{course.credit_units}</TableCell>
                  <TableCell className="text-gray-700">
                    {course.lecturer?.fullName || "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-700">{course.year_level}</TableCell>
                  <TableCell className="text-gray-700">{course.semester}</TableCell>
                  <TableCell>
                    {course.is_elective ? (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        Elective
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Core</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: course.color_code }}
                      aria-label={`Course color: ${course.color_code}`}
                    ></div>
                  </TableCell>
                  {onEditCourse && (
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditCourse(course.id)}
                              className="text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
                              aria-label={`Edit course ${course.code}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Course</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {lastPage > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {lastPage}
            </span>
            <Button
              disabled={currentPage === lastPage}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseList;