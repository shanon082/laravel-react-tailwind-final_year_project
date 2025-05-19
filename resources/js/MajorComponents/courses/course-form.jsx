import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../Components/card";
import { Button } from "../../Components/button";
import { Input } from "../../Components/input";
import Checkbox from "../../Components/Checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../../Components/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/select";
import { Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import DangerButton from "@/Components/DangerButton";
import { router } from "@inertiajs/react";
import ErrorBoundary from "../../Components/ErrorBoundary";

const courseFormSchema = z.object({
  code: z.string().min(3, { message: "Course code must be at least 3 characters" }),
  name: z.string().min(3, { message: "Course name must be at least 3 characters" }),
  credit_units: z.string().min(1, { message: "Credit units are required" }),
  department: z.string().min(1, { message: "Department is required" }),
  lecturer: z.string().min(1, { message: "Lecturer is required" }),
  is_elective: z.boolean().default(false),
  color_code: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Invalid hex color code" }).default("#3B82F6"),
  year_level: z.number().int().min(1).max(6),
  semester: z.number().int().min(1).max(2),
});

const CourseForm = ({ courseId, onClose }) => {
  const { toast } = useToast();
  const isEditMode = courseId !== null;
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["courses", courseId],
    enabled: isEditMode,
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", `/courses/${courseId}`);
        console.log("Course data fetched:", data);
        return data;
      } catch (error) {
        console.error("Error fetching course:", error);
        throw error;
      }
    },
  });

  const {
    data: lecturers,
    isLoading: isLecturersLoading,
    error: lecturersError,
    refetch: refetchLecturers,
  } = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", `/lecturers/list`);
        console.log("Lecturers data fetched:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching lecturers:", error);
        throw error;
      }
    },
  });

  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      try {
        const data = await apiRequest("GET", "/departments");
        console.log("Departments data fetched:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
      }
    },
  });

  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      credit_units: "",
      department: "",
      lecturer: "",
      is_elective: false,
      color_code: "#3B82F6",
      year_level: 1,
      semester: 1,
    },
  });

  useEffect(() => {
    if (course && isEditMode) {
      form.reset({
        code: course.code || "",
        name: course.name || "",
        credit_units: course.credit_units || "",
        department: course.department?.toString() || "",
        lecturer: course.lecturer?.toString() || "",
        is_elective: course.is_elective || false,
        color_code: course.color_code || "#3B82F6",
        year_level: course.year_level || 1,
        semester: course.semester ? parseInt(course.semester, 10) : 1,
      });
    }
  }, [course, form, isEditMode]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Submitting form with data:", data);

    if (!data.color_code.match(/^#[0-9A-F]{6}$/i)) {
      form.setError("color_code", { message: "Invalid color code" });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(data.year_level) || data.year_level < 1 || data.year_level > 6) {
      form.setError("year_level", { message: "Year level must be between 1 and 6" });
      setIsSubmitting(false);
      return;
    }
    if (isNaN(data.semester) || data.semester < 1 || data.semester > 4) {
      form.setError("semester", { message: "Semester must be 1,2,3 or 4" });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      code: data.code,
      name: data.name,
      credit_units: data.credit_units,
      department: data.department,
      lecturer: data.lecturer,
      is_elective: data.is_elective,
      color_code: data.color_code.toUpperCase(),
      year_level: Number(data.year_level),
      semester: Number(data.semester),
    };

    try {
      if (isEditMode) {
        await router.put(
          route("courses.update", courseId),
          payload,
          {
            onSuccess: () => {
              setShowSuccess(true);
              toast({
                title: "Course Updated",
                description: "The course has been successfully updated.",
                className: "bg-green-50 border-green-200 text-green-800",
                icon: <CheckCircle2 className="h-5 w-5" />,
              });
              setTimeout(() => {
                setShowSuccess(false);
                setIsSubmitting(false);
                onClose();
                router.visit(route("courses"), { only: ["coursesResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              const fieldMap = {
                color_code: "color_code",
                year_level: "year_level",
                semester: "semester",
                is_elective: "is_elective",
                code: "code",
                name: "name",
                credit_units: "credit_units",
                department: "department",
                lecturer: "lecturer",
              };
              Object.entries(errors).forEach(([serverField, message]) => {
                const clientField = fieldMap[serverField] || serverField;
                form.setError(clientField, { message });
              });
              toast({
                title: "Failed to Update Course",
                description: Object.values(errors).join(", ") || "An error occurred.",
                variant: "destructive",
                className: "bg-red-50 border-red-200 text-red-800",
              });
              setIsSubmitting(false);
            },
          }
        );
      } else {
        await router.post(
          route("courses.store"),
          payload,
          {
            onSuccess: () => {
              setShowSuccess(true);
              setTimeout(() => {
                toast({
                  title: "Course Created",
                  description: "The course has been successfully created.",
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle2 className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onClose();
                router.visit(route("courses"), { only: ["coursesResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              const fieldMap = {
                color_code: "color_code",
                year_level: "year_level",
                semester: "semester",
                is_elective: "is_elective",
                code: "code",
                name: "name",
                credit_units: "credit_units",
                department: "department",
                lecturer: "lecturer",
              };
              Object.entries(errors).forEach(([serverField, message]) => {
                const clientField = fieldMap[serverField] || serverField;
                form.setError(clientField, { message });
              });
              toast({
                title: "Failed to Create Course",
                description: Object.values(errors).join(", ") || "An error occurred.",
                variant: "destructive",
                className: "bg-red-50 border-red-200 text-red-800",
              });
              setIsSubmitting(false);
            },
          }
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isCourseLoading && isEditMode) {
    return (
      <Card className="mb-8 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Course" : "Add New Course"}</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter course code (e.g., CS101)"
                          {...field}
                          aria-invalid={!!form.formState.errors.code}
                          aria-describedby={form.formState.errors.code ? "code-error" : undefined}
                        />
                      </FormControl>
                      <FormMessage id="code-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter course name (e.g., Introduction to Computer Science)"
                          {...field}
                          aria-invalid={!!form.formState.errors.name}
                          aria-describedby={form.formState.errors.name ? "name-error" : undefined}
                        />
                      </FormControl>
                      <FormMessage id="name-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        {isDepartmentsLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading departments...</span>
                          </div>
                        ) : departmentsError ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600">
                              Error loading departments: {departmentsError.message}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refetchDepartments()}
                              title="Retry"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : Array.isArray(departments) && departments.length > 0 ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isDepartmentsLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((department) => (
                                <SelectItem
                                  key={department.id}
                                  value={department.id.toString()}
                                >
                                  {department.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-500">No departments available</span>
                        )}
                      </FormControl>
                      <FormMessage id="department-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credit_units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Units</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter credit units (e.g., 3)"
                          {...field}
                          aria-invalid={!!form.formState.errors.credit_units}
                          aria-describedby={
                            form.formState.errors.credit_units
                              ? "credit_units-error"
                              : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage
                        id="credit_units-error"
                        className="text-red-600 font-medium"
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lecturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecturer</FormLabel>
                      <FormControl>
                        {isLecturersLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading lecturers...</span>
                          </div>
                        ) : lecturersError ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-600">
                              Error loading lecturers: {lecturersError.message}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => refetchLecturers()}
                              title="Retry"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : Array.isArray(lecturers) && lecturers.length > 0 ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLecturersLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a lecturer" />
                            </SelectTrigger>
                            <SelectContent>
                              {lecturers.map((lecturer) => (
                                <SelectItem
                                  key={lecturer.id}
                                  value={lecturer.id.toString()}
                                >
                                  {lecturer.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-500">No lecturers available</span>
                        )}
                      </FormControl>
                      <FormMessage id="lecturer-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value, 10))}
                          value={field.value.toString()}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage id="semester-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="year_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                          aria-invalid={!!form.formState.errors.year_level}
                          aria-describedby={
                            form.formState.errors.year_level ? "year_level-error" : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage id="year_level-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Code</FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          {...field}
                          className="w-12 h-10 p-1"
                          aria-label="Select course color"
                        />
                        <Input
                          value={field.value}
                          readOnly
                          placeholder="#3B82F6"
                          aria-invalid={!!form.formState.errors.color_code}
                          aria-describedby={
                            form.formState.errors.color_code ? "color_code-error" : undefined
                          }
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: field.value }}
                        ></div>
                      </div>
                      <FormDescription>Choose a color for this course in the timetable</FormDescription>
                      <FormMessage id="color_code-error" className="text-red-600 font-medium" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="is_elective"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Mark as elective course"
                        style={{ pointerEvents: "auto", zIndex: 10 }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Elective Course</FormLabel>
                      <FormDescription>Mark this course as an elective</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <DangerButton
                variant="outline"
                type="button"
                onClick={onClose}
                className="border-gray-200 px-6 py-2"
              >
                Cancel
              </DangerButton>
              <Button
                type="submit"
                disabled={isSubmitting || lecturersError || departmentsError}
                className="px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditMode ? "Update Course" : "Add Course"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </ErrorBoundary>
  );
};

export default CourseForm;