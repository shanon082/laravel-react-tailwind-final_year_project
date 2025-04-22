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
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import DangerButton from "@/Components/DangerButton";
import { router } from "@inertiajs/react";

const courseFormSchema = z.object({
  code: z.string().min(3, { message: "Course code must be at least 3 characters" }),
  name: z.string().min(3, { message: "Course name must be at least 3 characters" }),
  department: z.string().min(1, { message: "Department is required" }),
  is_elective: z.boolean().default(false),
  color_code: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Invalid hex color code" }).default("#3B82F6"),
  year_level: z.number().int().min(1).max(6),
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
      const response = await apiRequest("GET", `/courses/${courseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch course data");
      }
      return response.json();
    },
  });

  const form = useForm({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      department: "",
      is_elective: false,
      color_code: "#3B82F6",
      year_level: 1,
    },
  });

  useEffect(() => {
    if (course && isEditMode) {
      form.reset({
        code: course.code,
        name: course.name,
        department: course.department,
        is_elective: course.is_elective,
        color_code: course.color_code,
        year_level: course.year_level,
      });
    }
  }, [course, form, isEditMode]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Submitting form with data:", data);

    // Validate colorCode and yearLevel
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

    const payload = {
      code: data.code,
      name: data.name,
      department: data.department,
      is_elective: data.is_elective,
      color_code: data.color_code.toUpperCase(),
      year_level: Number(data.year_level),
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
                title: isEditMode ? "Course Updated" : "Course Created",
                description: `The course has been successfully ${isEditMode ? "updated" : "created"}.`,
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
                is_elective: "is_elective",
                code: "code",
                name: "name",
                department: "department",
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
                  title:`Course Created`,
                  description: `The course has been successfully created.`,
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle2 className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onClose();
                router.visit(route("courses"), { only: ["coursesResponse"] }, {
                  onSuccess: (page) => {
                    console.log("router.visit success:", page.props.coursesResponse); // Debug log
                  },
                  onError: (errors) => {
                    console.error("router.visit errors:", errors);
                  },
                });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              const fieldMap = {
                color_code: "color_code",
                year_level: "year_level",
                is_elective: "is_elective",
                code: "code",
                name: "name",
                department: "department",
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
                      <Input
                        placeholder="Enter department (e.g., Computer Science)"
                        {...field}
                        aria-invalid={!!form.formState.errors.department}
                        aria-describedby={form.formState.errors.department ? "department-error" : undefined}
                      />
                    </FormControl>
                    <FormMessage id="department-error" className="text-red-600 font-medium" />
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
                        aria-describedby={form.formState.errors.year_level ? "year_level-error" : undefined}
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
                        aria-describedby={form.formState.errors.color_code ? "color_code-error" : undefined}
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
            <DangerButton variant="outline" type="button" onClick={onClose} className="border-gray-200 px-6 py-2">
              Cancel
            </DangerButton>
            <Button type="submit" disabled={isSubmitting} className="px-6 py-2">
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
  );
};

export default CourseForm;