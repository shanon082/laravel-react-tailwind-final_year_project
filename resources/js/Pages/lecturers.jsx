import { useState, useEffect } from "react";
import { Button } from "../components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/dialog";
import { Label } from "../components/label";
import { Input } from "../components/input";
import { Plus, UserPlus, Loader2, CheckCircle } from "lucide-react";
import Layout from "../MajorComponents/layout/layout";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types/index";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Head, router } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import LecturerList from "../MajorComponents/lecturers/lecturer-list";
import AvailabilityTable from "../MajorComponents/lecturers/availability-table";
import DangerButton from "@/Components/DangerButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select";
import { RefreshCw } from "lucide-react";

// Title options for the dropdown
const titleOptions = ["Professor", "Lecturer", "Assistant Lecturer", "Associate Professor"];

// Validation schema for AddLecturerDialog
const lecturerFormSchema = z.object({
  username: z.string().min(3, { message: "User name must be at least 3 characters" }),
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  department: z.string().min(1, { message: "Department is required" }),
  title: z.enum(titleOptions, { message: "Please select a valid title" }),
  contact: z
    .string()
    .regex(/^\+?\d{9,15}$/, { message: "Invalid phone number (e.g., +256123456789)" }),
});

const AddLecturerDialog = ({ open, onOpenChange, lecturerId }) => {
  const { toast } = useToast();
  const isEditMode = lecturerId !== null;
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lecturer data for edit mode
  const { data: lecturer, isLoading: isLecturerLoading } = useQuery({
    queryKey: ["/lecturers", lecturerId],
    queryFn: () => apiRequest("GET", `/lecturers/${lecturerId}`),
    enabled: isEditMode,
  });

  // Fetch departments
  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useQuery({
    queryKey: ["/departments"],
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

  // Initialize react-hook-form
  const form = useForm({
    resolver: zodResolver(lecturerFormSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      department: "",
      title: "",
      contact: "",
    },
  });

  useEffect(() => {
    if (lecturer && isEditMode) {
      form.reset({
        username: lecturer.username,
        fullName: lecturer.fullName,
        email: lecturer.email,
        title: lecturer.title,
        department: lecturer.department,
        contact: lecturer.contact,
      });
    }
  }, [lecturer, form, isEditMode]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Submitting form with data:", data);

    try {
      if (isEditMode) {
        await router.put(
          route("lecturers.update", lecturerId),
          {
            username: data.username,
            fullName: data.fullName,
            email: data.email,
            department: data.department,
            title: data.title,
            contact: data.contact,
          },
          {
            onSuccess: () => {
              setShowSuccess(true);
              setTimeout(() => {
                toast({
                  title: "Lecturer Updated",
                  description: "The lecturer has been successfully updated.",
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onOpenChange(false);
                router.visit(route("lecturers"), { only: ["lecturersResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              Object.entries(errors).forEach(([key, message]) => {
                form.setError(key, { message });
              });
              toast({
                title: "Failed to Update Lecturer",
                description: Object.values(errors).join(", ") || "An error occurred.",
                variant: "destructive",
                className: "bg-red-50 border-red-200 text-red-800",
              });
              setIsSubmitting(false);
            },
          }
        );
      } else {
        // Get the department name from the selected department ID
        const selectedDepartment = departments?.find(dept => dept.id.toString() === data.department);
        
        await router.post(
          route("lecturers.store"),
          {
            username: data.username,
            fullName: data.fullName,
            email: data.email,
            department: selectedDepartment?.name || data.department,
            title: data.title,
            contact: data.contact,
          },
          {
            onSuccess: () => {
              setShowSuccess(true);
              setTimeout(() => {
                toast({
                  title: "Lecturer Added",
                  description: "The Lecturer has been successfully Added.",
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onOpenChange(false);
                router.visit(route("lecturers"), { only: ["lecturersResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              Object.entries(errors).forEach(([key, message]) => {
                form.setError(key, { message });
              });
              toast({
                title: "Failed to Add Lecturer",
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  return (
    <DialogContent
      onInteractOutside={(e) => e.preventDefault()}
      className="sm:max-w-md md:max-w-lg bg-white shadow-lg rounded-lg animate-fade-in"
    >
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-gray-900">
          {isEditMode ? "Edit Lecturer" : "Add New Lecturer"}
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          Complete the form below to {isEditMode ? "edit the lecturer's details" : "add a new lecturer to the system"}.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 py-4">
          {[
            {
              id: "username",
              label: "User Name",
              type: "text",
              placeholder: "e.g., John",
              component: "input",
            },
            {
              id: "fullName",
              label: "Full Name",
              type: "text",
              placeholder: "e.g., Dr. John Smith",
              component: "input",
            },
            {
              id: "email",
              label: "Email",
              type: "email",
              placeholder: "e.g., john.smith@sun.ac.ug",
              component: "input",
            },
            {
              id: "department",
              label: "Department",
              component: "select",
            },
            {
              id: "title",
              label: "Title",
              component: "select",
              options: titleOptions.map((title) => ({
                value: title,
                label: title,
              })),
            },
            {
              id: "contact",
              label: "Contact",
              type: "tel",
              placeholder: "e.g., +256 123 456 789",
              component: "input",
            },
          ].map(({ id, label, type, placeholder, component, options }) => (
            <div
              key={id}
              className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4"
            >
              <Label htmlFor={id} className="text-sm font-medium text-gray-700 md:text-right">
                {label}
              </Label>
              <div className="col-span-1 md:col-span-3">
                {component === "input" ? (
                  <Input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className={`h-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${errors[id] ? "border-red-500" : ""}`}
                    {...register(id)}
                    aria-invalid={!!errors[id]}
                    aria-describedby={errors[id] ? `${id}-error` : undefined}
                  />
                ) : (
                  <Select
                    onValueChange={(value) => setValue(id, value)}
                    value={form.watch(id)}
                    disabled={id === "department" && isDepartmentsLoading}
                  >
                    <SelectTrigger
                      className={`h-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${errors[id] ? "border-red-500" : ""}`}
                    >
                      <SelectValue
                        placeholder={
                          id === "department" && isDepartmentsLoading
                            ? "Loading departments..."
                            : placeholder || `Select a ${id}`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {id === "department" ? (
                        departmentsError ? (
                          <div className="flex items-center space-x-2 p-2">
                            <span className="text-red-600">
                              Error loading departments. 
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
                          departments.map((department) => (
                            <SelectItem
                              key={department.id}
                              value={department.id.toString()}
                            >
                              {department.name}
                            </SelectItem>
                          ))
                        ) : (
                          <span className="p-2 text-gray-500">No departments available</span>
                        )
                      ) : (
                        options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {errors[id] && (
                  <p id={`${id}-error`} className="mt-1 text-sm text-red-600 font-medium">
                    {errors[id].message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <DangerButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 py-2 border-gray-200 hover:bg-gray-50 transition-colors duration-200"
            disabled={isSubmitting}
          >
            Cancel
          </DangerButton>
          <Button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
            disabled={isSubmitting || isDepartmentsLoading || departmentsError}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Adding..."}
              </>
            ) : (
              isEditMode ? "Update Lecturer" : "Add Lecturer"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const Lecturers = ({ auth, lecturerResponse, filters }) => {
  const { user } = useAuth();
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleSelectLecturer = (lecturerId) => {
    setSelectedLecturerId(lecturerId);
  };

  if (!user) {
    return <div className="text-center py-8">Loading user data...</div>;
  }

  return (
    <Layout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Lecturers</h2>}>
      <Head title="Lecturers" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Lecturers</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage lecturer profiles and availability for seamless timetable planning.
            </p>
          </div>
          {isAdmin && (
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 px-6 py-2" title="Add a new lecturer">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Lecturer
                </Button>
              </DialogTrigger>
              <AddLecturerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} lecturerId={null} />
            </Dialog>
          )}
        </div>

        {/* Mobile View: Tab-like Interface */}
        <div className="block lg:hidden mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${!selectedLecturerId ? "border-b-2 border-primary bg-blue-100 text-primary" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setSelectedLecturerId(null)}
            >
              All Lecturers
            </button>
            {selectedLecturerId && (
              <button className="px-4 py-2 text-sm font-medium border-b-2 border-primary bg-blue-100 text-primary">
                Availability
              </button>
            )}
          </div>
          <div className="mt-4">
            {!selectedLecturerId ? (
              <LecturerList onSelectLecturer={handleSelectLecturer} selectedLecturerId={selectedLecturerId} />
            ) : (
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLecturerId(null)}
                  className="px-4 py-2"
                >
                  Back to Lecturers
                </Button>
                <AvailabilityTable lecturerId={selectedLecturerId} />
              </div>
            )}
          </div>
        </div>

        {/* Desktop View: Grid Layout */}
        <div className="hidden lg:grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <LecturerList onSelectLecturer={handleSelectLecturer} selectedLecturerId={selectedLecturerId} />
          </div>
          <div className="lg:col-span-2">
            {selectedLecturerId ? (
              <AvailabilityTable lecturerId={selectedLecturerId} />
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500 animate-fade-in">
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
                <p className="mt-2">Select a lecturer to view their availability.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Lecturers;