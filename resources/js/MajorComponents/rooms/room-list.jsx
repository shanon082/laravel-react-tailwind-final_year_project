import { router } from "@inertiajs/react"; // Import router instead of useRouter
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card";
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
import { Edit, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../Components/tooltip";
import { useEffect } from "react";

const RoomList = ({ onEditRoom, roomsResponse, filters }) => {
  const rooms = roomsResponse?.data || [];
  const totalPages = roomsResponse?.last_page || 1;
  const totalRooms = roomsResponse?.total || 0;
  const buildings = roomsResponse?.buildings || [];
  const currentPage = roomsResponse?.current_page || 1;

  // Update parent with buildings
  useEffect(() => {
    if (buildings.length > 0) {
      window.dispatchEvent(new CustomEvent("update-buildings", { detail: buildings }));
    }
  }, [buildings]);

  const setCurrentPage = (page) => {
    router.get(
      route('rooms'),
      {
        search: filters.search,
        type: filters.type,
        building: filters.building,
        page,
        per_page: 10,
      },
      {
        preserveState: true,
        preserveScroll: true,
      }
    );
  };

  if (!rooms.length) {
    return (
      <Card className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No rooms found. Add a room to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-md border border-white/20 shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Rooms ({totalRooms})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white/80 backdrop-blur-md">
              <TableRow>
                <TableHead className="text-gray-700 font-semibold">Room Name</TableHead>
                <TableHead className="text-gray-700 font-semibold">Type</TableHead>
                <TableHead className="text-gray-700 font-semibold">Building</TableHead>
                <TableHead className="text-gray-700 font-semibold">Capacity</TableHead>
                {onEditRoom && <TableHead className="w-14 text-gray-700 font-semibold">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room, index) => (
                <TableRow
                  key={room.id}
                  className={`transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50/50" : "bg-white"} hover:bg-blue-50/80 cursor-pointer`}
                >
                  <TableCell className="font-medium text-gray-800">{room.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-200 text-blue-600">
                      {room.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{room.building}</TableCell>
                  <TableCell className="text-gray-600">{room.capacity} students</TableCell>
                  {onEditRoom && (
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditRoom(room.id)}
                              className="text-blue-500 hover:bg-blue-100 rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Room</p>
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

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomList;