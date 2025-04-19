import { useEffect, useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../Components/dialog";
import { Button } from "../../Components/Button";
import { Input } from "../../Components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../Components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/Select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import DangerButton from "@/Components/DangerButton";

const roomFormSchema = z.object({
  name: z.string().min(2, { message: "Room name must be at least 2 characters" }),
  type: z.string().min(1, { message: "Room type is required" }),
  capacity: z.number().int().min(1, { message: "Capacity must be at least 1" }),
  building: z.string().min(1, { message: "Building is required" }),
});

const RoomForm = ({ roomId, onClose, isOpen, initialData }) => {
  const { toast } = useToast();
  const isEditMode = roomId !== null;
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stabilize initialData to prevent unnecessary resets
  const stableInitialData = useMemo(() => initialData, [roomId]);

  // Fetch room data for edit mode
  const { data: room, isLoading: isRoomLoading } = useQuery({
    queryKey: ["/rooms", roomId],
    queryFn: () => apiRequest("GET", `/rooms/${roomId}`),
    enabled: isEditMode && !stableInitialData,
    initialData: stableInitialData || undefined,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize react-hook-form
  const form = useForm({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "",
      capacity: 0,
      building: "",
    },
  });

  // Set initial form values for edit mode
  useEffect(() => {
    if ((room || stableInitialData) && isEditMode) {
      const roomData = room || stableInitialData;
      form.reset({
        name: roomData.name || "",
        type: roomData.type || "",
        capacity: parseInt(roomData.capacity) || 0,
        building: roomData.building || "",
      });
    } else {
      form.reset({
        name: "",
        type: "",
        capacity: 0,
        building: "",
      });
    }
  }, [room, stableInitialData, isEditMode, form, roomId]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    console.log("Submitting form with data:", data);

    try {
      if (isEditMode) {
        await router.put(
          route("rooms.update", roomId),
          {
            name: data.name,
            type: data.type,
            capacity: parseInt(data.capacity),
            building: data.building,
          },
          {
            onSuccess: () => {
              setShowSuccess(true);
              setTimeout(() => {
                toast({
                  title: "Room Updated",
                  description: "The room has been successfully updated.",
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle2 className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onClose();
                router.visit(route("rooms"), { only: ["roomsResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              Object.entries(errors).forEach(([key, message]) => {
                form.setError(key, { message });
              });
              toast({
                title: "Failed to Update Room",
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
          route("rooms.store"),
          {
            name: data.name,
            type: data.type,
            capacity: parseInt(data.capacity),
            building: data.building,
          },
          {
            onSuccess: () => {
              setShowSuccess(true);
              setTimeout(() => {
                toast({
                  title: "Room Created",
                  description: "The room has been successfully created.",
                  className: "bg-green-50 border-green-200 text-green-800",
                  icon: <CheckCircle2 className="h-5 w-5" />,
                });
                setShowSuccess(false);
                setIsSubmitting(false);
                onClose();
                router.visit(route("rooms"), { only: ["roomsResponse"] });
              }, 1000);
            },
            onError: (errors) => {
              console.error("Form submission errors:", errors);
              Object.entries(errors).forEach(([key, message]) => {
                form.setError(key, { message });
              });
              toast({
                title: "Failed to Create Room",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl bg-white/90 backdrop-blur-md border border-white/20 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                {isEditMode ? "Edit Room" : "Add New Room"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Fill in the details to {isEditMode ? "update" : "create"} a room.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-10">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="mt-4 text-lg font-semibold text-gray-800">Success!</p>
            <p className="text-sm text-gray-500">Room {isEditMode ? "updated" : "created"} successfully.</p>
          </div>
        ) : (
          <div>
            {isRoomLoading && isEditMode ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Room Name/Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. A101"
                              {...field}
                              className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Room Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300">
                                <SelectValue placeholder="Select room type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
                              <SelectItem value="Laboratory">Laboratory</SelectItem>
                              <SelectItem value="Seminar Room">Seminar Room</SelectItem>
                              <SelectItem value="Computer Lab">Computer Lab</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Capacity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="building"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Building</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Science Block"
                              {...field}
                              className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DangerButton
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 transition-all rounded-lg"
                    >
                      Cancel
                    </DangerButton>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all rounded-lg flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? "Updating..." : "Creating..."}
                        </>
                      ) : isEditMode ? "Update Room" : "Add Room"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoomForm;