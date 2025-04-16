import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "../../Components/Card"
import { Button } from "../../Components/Button"
import { Input } from "../../Components/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../../Components/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../Components/Select"
import { Loader2 } from "lucide-react"
import { apiRequest } from "../../lib/queryClient"
import { queryClient } from "../../lib/queryClient"
import { useToast } from "../../hooks/use-toast"

const roomFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Room name must be at least 2 characters" }),
  type: z.string().min(1, { message: "Room type is required" }),
  capacity: z
    .number()
    .int()
    .min(1, { message: "Capacity must be at least 1" }),
  building: z.string().min(1, { message: "Building is required" })
})

const RoomForm = ({ roomId, onClose }) => {
  const { toast } = useToast()
  const isEditMode = roomId !== null

  // Fetch room details if in edit mode
  const { data: room, isLoading: isRoomLoading } = useQuery({
    queryKey: ["/api/rooms", roomId],
    enabled: isEditMode
  })

  const form = useForm({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      type: "",
      capacity: 0,
      building: ""
    }
  })

  // Set form values when room data is loaded
  useEffect(() => {
    if (room && isEditMode) {
      form.reset({
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        building: room.building
      })
    }
  }, [room, form, isEditMode])

  const createMutation = useMutation({
    mutationFn: async data => {
      const response = await apiRequest("POST", "/api/rooms", data)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] })
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] })
      toast({
        title: "Room created",
        description: "The room has been successfully created."
      })
      onClose()
    },
    onError: error => {
      toast({
        title: "Failed to create room",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async data => {
      const response = await apiRequest("PUT", `/api/rooms/${roomId}`, data)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] })
      queryClient.invalidateQueries({ queryKey: ["/api/rooms", roomId] })
      queryClient.invalidateQueries({ queryKey: ["/api/timetable"] })
      toast({
        title: "Room updated",
        description: "The room has been successfully updated."
      })
      onClose()
    },
    onError: error => {
      toast({
        title: "Failed to update room",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const onSubmit = data => {
    if (isEditMode) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  if (isRoomLoading && isEditMode) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Room" : "Add New Room"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name/Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lecture Hall">
                          Lecture Hall
                        </SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Seminar Room">
                          Seminar Room
                        </SelectItem>
                        <SelectItem value="Computer Lab">
                          Computer Lab
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Science Block" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Room"
              ) : (
                "Add Room"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

export default RoomForm
