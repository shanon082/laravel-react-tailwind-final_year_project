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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../Components/dropdown-menu";
import { Badge } from "../../Components/badge";
import { Edit, MoreHorizontal, Loader2 } from "lucide-react";
import { router } from "@inertiajs/react";

const CourseList = ({ onEditCourse, coursesResponse }) => {
  console.log("coursesResponse:", coursesResponse); // Debug log
  const courses = Array.isArray(coursesResponse?.data) ? coursesResponse.data : [];
  const currentPage = coursesResponse?.current_page || 1;
  const lastPage = coursesResponse?.last_page || 1;
  const total = coursesResponse?.total || courses.length;

  console.log("Courses to render:", courses); // Debug log

  const setCurrentPage = (page) => {
    router.get(
      route("courses"),
      { page, per_page: 10 },
      { preserveState: true, preserveScroll: true }
    );
  };

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No courses found. Add a course to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Courses ({total})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-12">Color</TableHead>
                {onEditCourse && <TableHead className="w-14"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>Year {course.year_level}</TableCell>
                  <TableCell>
                    {course.is_elective ? (
                      <Badge variant="secondary">Elective</Badge>
                    ) : (
                      <Badge>Core</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: course.color_code }}
                    ></div>
                  </TableCell>
                  {onEditCourse && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditCourse(course.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {lastPage > 1 && (
          <div className="flex justify-between mt-4">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {lastPage}
            </span>
            <Button
              disabled={currentPage === lastPage}
              onClick={() => setCurrentPage(currentPage + 1)}
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