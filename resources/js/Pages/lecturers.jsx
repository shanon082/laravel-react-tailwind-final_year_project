import { useState } from "react";
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
import { Plus, UserPlus, Loader2 } from "lucide-react";
import Layout from "../MajorComponents/layout/layout";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types/index";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Head } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import LecturerList from "../MajorComponents/lecturers/lecturer-list";
import AvailabilityTable from "../MajorComponents/lecturers/availability-table";
import DangerButton from "@/Components/DangerButton";

// Validation schema for AddLecturerDialog
const lecturerFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  department: z.string().min(1, { message: "Department is required" }),
  specialization: z.string().min(1, { message: "Specialization is required" }),
  contactNumber: z
    .string()
    .regex(/^\+?\d{9,15}$/, { message: "Invalid phone number (e.g., +256123456789)" }),
});

const AddLecturerDialog = ({ open, onOpenChange }) => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(lecturerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      department: "",
      specialization: "",
      contactNumber: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const userResponse = await apiRequest("POST", "/api/register", {
        username: data.email.split("@")[0],
        password: `${data.fullName.split(" ")[0].toLowerCase()}123`,
        fullName: data.fullName,
        email: data.email,
        role: UserRole.LECTURER,
      });
      const userData = await userResponse.json();

      const lecturerResponse = await apiRequest("POST", "/api/lecturers", {
        userId: userData.id,
        department: data.department,
        specialization: data.specialization,
        contactNumber: data.contactNumber,
      });
      await lecturerResponse.json();

      toast({
        title: "Lecturer added",
        description: `${data.fullName} has been added successfully`,
      });

      reset();
      queryClient.invalidateQueries(["/api/lecturers"]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error adding lecturer",
        description: error.message || "Could not add lecturer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-md md:max-w-lg bg-white shadow-lg rounded-lg animate-fade-in">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-gray-900">Add New Lecturer</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          Complete the form below to add a new lecturer to the system.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 py-4">
          {[
            {
              id: "fullName",
              label: "Full Name",
              type: "text",
              placeholder: "e.g., Dr. John Smith",
            },
            {
              id: "email",
              label: "Email",
              type: "email",
              placeholder: "e.g., john.smith@university.edu",
            },
            {
              id: "department",
              label: "Department",
              type: "text",
              placeholder: "e.g., Computer Science",
            },
            {
              id: "specialization",
              label: "Specialization",
              type: "text",
              placeholder: "e.g., Artificial Intelligence",
            },
            {
              id: "contactNumber",
              label: "Contact",
              type: "tel",
              placeholder: "e.g., +256 123 456 789",
            },
          ].map(({ id, label, type, placeholder }) => (
            <div
              key={id}
              className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4"
            >
              <Label htmlFor={id} className="text-sm font-medium text-gray-700 md:text-right">
                {label}
              </Label>
              <div className="col-span-1 md:col-span-3">
                <Input
                  id={id}
                  type={type}
                  placeholder={placeholder}
                  className={`h-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[id] ? "border-red-500" : ""
                  }`}
                  {...register(id)}
                  aria-invalid={!!errors[id]}
                  aria-describedby={errors[id] ? `${id}-error` : undefined}
                />
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Lecturer"
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const Lecturers = ({ auth }) => {
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
              <AddLecturerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
            </Dialog>
          )}
        </div>

        {/* Mobile View: Tab-like Interface */}
        <div className="block lg:hidden mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                !selectedLecturerId ? "border-b-2 border-primary bg-blue-100 text-primary" : "text-gray-500 hover:text-gray-700"
              }`}
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
        <div className="hidden lg:grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <LecturerList onSelectLecturer={handleSelectLecturer} selectedLecturerId={selectedLecturerId} />
          </div>
          <div className="lg:col-span-3">
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