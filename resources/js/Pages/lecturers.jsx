import { useState } from "react";
import { Button } from "../components/button";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../components/dialog";
import { Label } from "../components/label";
import { Input } from "../components/input";
import { Plus, UserPlus } from "lucide-react";
import Layout from "../MajorComponents/layout/layout";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types/index";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import AppLayout from "@/Layouts/AppLayout";

// Will need these components created next
// import LecturerList from "@/components/lecturers/lecturer-list";
// import AvailabilityTable from "@/components/lecturers/availability-table";

const LecturerList = ({ onSelectLecturer, selectedLecturerId }) => {
  // Placeholder component - will be moved to its own file
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Lecturers</h2>
      <div className="space-y-2">
        <div 
          className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedLecturerId === 1 ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
          onClick={() => onSelectLecturer(1)}
        >
          <div className="font-medium">Dr. John Smith</div>
          <div className="text-sm text-gray-500">Computer Science</div>
        </div>
        <div 
          className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${selectedLecturerId === 2 ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
          onClick={() => onSelectLecturer(2)}
        >
          <div className="font-medium">Prof. Sarah Johnson</div>
          <div className="text-sm text-gray-500">Mathematics</div>
        </div>
      </div>
    </div>
  );
};

const AvailabilityTable = ({ lecturerId }) => {
  // Placeholder component - will be moved to its own file
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Availability</h2>
      <div className="border rounded-md divide-y">
        <div className="grid grid-cols-6 p-3 font-medium bg-gray-50">
          <div>Day</div>
          <div className="col-span-5">Available Hours</div>
        </div>
        <div className="grid grid-cols-6 p-3">
          <div>Monday</div>
          <div className="col-span-5">08:00 - 12:00, 14:00 - 17:00</div>
        </div>
        <div className="grid grid-cols-6 p-3">
          <div>Tuesday</div>
          <div className="col-span-5">09:00 - 15:00</div>
        </div>
        <div className="grid grid-cols-6 p-3">
          <div>Wednesday</div>
          <div className="col-span-5">10:00 - 13:00, 15:00 - 18:00</div>
        </div>
        <div className="grid grid-cols-6 p-3">
          <div>Thursday</div>
          <div className="col-span-5">08:00 - 16:00</div>
        </div>
        <div className="grid grid-cols-6 p-3">
          <div>Friday</div>
          <div className="col-span-5">09:00 - 14:00</div>
        </div>
      </div>
    </div>
  );
};

const AddLecturerDialog = ({ open, onOpenChange, onAddLecturer }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: '',
    specialization: '',
    contactNumber: ''
  });
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // First create a user account
      const userResponse = await apiRequest('POST', '/api/register', {
        username: formData.email.split('@')[0],
        password: `${formData.fullName.split(' ')[0].toLowerCase()}123`, // Simple password for demo
        fullName: formData.fullName,
        email: formData.email,
        role: UserRole.LECTURER
      });
      
      const userData = await userResponse.json();
      
      // Then create the lecturer profile with the user ID
      const lecturerResponse = await apiRequest('POST', '/api/lecturers', {
        userId: userData.id,
        department: formData.department,
        specialization: formData.specialization, 
        contactNumber: formData.contactNumber
      });
      
      const lecturerData = await lecturerResponse.json();
      
      // Notify success and refresh the lecturer list
      toast({
        title: "Lecturer added",
        description: `${formData.fullName} has been added successfully`,
        variant: "default",
      });
      
      // Reset form and close dialog
      setFormData({
        fullName: '',
        email: '',
        department: '',
        specialization: '',
        contactNumber: ''
      });
      
      queryClient.invalidateQueries(['/api/lecturers']);
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
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Add New Lecturer</DialogTitle>
        <DialogDescription>
          Complete the form below to add a new lecturer to the system.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
            <Label htmlFor="fullName" className="md:text-right">Full Name</Label>
            <Input 
              id="fullName" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="col-span-1 md:col-span-3" 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
            <Label htmlFor="email" className="md:text-right">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange} 
              className="col-span-1 md:col-span-3" 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
            <Label htmlFor="department" className="md:text-right">Department</Label>
            <Input 
              id="department" 
              name="department"
              value={formData.department}
              onChange={handleChange} 
              className="col-span-1 md:col-span-3" 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
            <Label htmlFor="specialization" className="md:text-right">Specialization</Label>
            <Input 
              id="specialization" 
              name="specialization"
              value={formData.specialization}
              onChange={handleChange} 
              className="col-span-1 md:col-span-3" 
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
            <Label htmlFor="contactNumber" className="md:text-right">Contact</Label>
            <Input 
              id="contactNumber" 
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange} 
              className="col-span-1 md:col-span-3" 
              required
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">
            Add Lecturer
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const Lecturers = ({auth}) => {
  const { user } = useAuth();
  const [selectedLecturerId, setSelectedLecturerId] = useState(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Check if the current user is an admin
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const handleSelectLecturer = (lecturerId) => {
    setSelectedLecturerId(lecturerId);
  };

  const handleAddLecturer = (lecturerData) => {
    console.log("Adding lecturer:", lecturerData);
    // This will be implemented with API integration
  };

  return (
    <AppLayout
    auth={auth}
    header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Lecturers</h2>}>
      <Head title="Lecturers" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Lecturers</h1>
          <p className="mt-2 text-sm text-gray-600">
            View lecturer information and availability for timetable planning.
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Lecturer
              </Button>
            </DialogTrigger>
            
            <AddLecturerDialog 
              open={addDialogOpen} 
              onOpenChange={setAddDialogOpen}
              onAddLecturer={handleAddLecturer}
            />
          </Dialog>
        )}
      </div>

      {/* Mobile View: Tab-like Interface */}
      <div className="block lg:hidden mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium ${!selectedLecturerId ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setSelectedLecturerId(null)}
          >
            All Lecturers
          </button>
          {selectedLecturerId && (
            <button
              className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
            >
              Availability
            </button>
          )}
        </div>
        
        <div className="mt-4">
          {!selectedLecturerId ? (
            <LecturerList 
              onSelectLecturer={handleSelectLecturer} 
              selectedLecturerId={selectedLecturerId} 
            />
          ) : (
            <AvailabilityTable lecturerId={selectedLecturerId} />
          )}
        </div>
      </div>
      
      {/* Desktop View: Grid Layout */}
      <div className="hidden lg:grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LecturerList 
            onSelectLecturer={handleSelectLecturer} 
            selectedLecturerId={selectedLecturerId} 
          />
        </div>
        <div className="lg:col-span-2">
          {selectedLecturerId ? (
            <AvailabilityTable lecturerId={selectedLecturerId} />
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              <p>Select a lecturer to view their availability.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Lecturers;