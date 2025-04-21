import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Layout from "../MajorComponents/layout/layout";
import RoomList from "../MajorComponents/rooms/room-list";
import RoomForm from "../MajorComponents/rooms/room-form";
import { Button } from "../Components/Button";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head } from "@inertiajs/react";
import { Input } from "../Components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/Select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

const Rooms = ({ auth, roomsResponse, filters }) => {
  const { user } = useAuth();
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [filterType, setFilterType] = useState(filters.type || "all");
  const [filterBuilding, setFilterBuilding] = useState(filters.building || "all");
  const [buildings, setBuildings] = useState(roomsResponse.buildings);

  // Pre-fetch room data for editing
  const { data: editingRoomData } = useQuery({
    queryKey: ["/rooms", editingRoomId],
    queryFn: () =>{ apiRequest("GET", `/rooms/${editingRoomId}`);
    return response.json(); 
  },
    enabled: !!editingRoomId,
  });

  useEffect(() => {
    const handleBuildingsUpdate = (event) => {
      setBuildings(event.detail);
    };

    window.addEventListener("update-buildings", handleBuildingsUpdate);
    return () => window.removeEventListener("update-buildings", handleBuildingsUpdate);
  }, []);

  // Update URL with filters
  useEffect(() => {
    router.get(
      route('rooms'),
      {
        search: searchQuery,
        type: filterType === "all" ? "" : filterType,
        building: filterBuilding === "all" ? "" : filterBuilding,
        page: roomsResponse.current_page,
        per_page: 10,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    );
  }, [searchQuery, filterType, filterBuilding]);

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleAddClick = () => {
    setIsAddingRoom(true);
    setEditingRoomId(null);
  };

  const handleEditClick = (roomId) => {
    setEditingRoomId(roomId);
    setIsAddingRoom(false);
  };

  const handleFormClose = () => {
    setIsAddingRoom(false);
    setEditingRoomId(null);
  };

  return (
    <Layout>
      <Head title="Rooms" />
      <div className="sm:pt-6 lg:pt-8">
        <div className="sm:px-6 lg:px-8 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Rooms</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Manage all teaching rooms and facilities at Soroti University.
                </p>
              </div>
              {isAdmin && (
                <Button
                  onClick={handleAddClick}
                  className="mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all rounded-lg flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Room
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-40 rounded-lg">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Lecture Hall">Lecture Hall</SelectItem>
              <SelectItem value="Laboratory">Laboratory</SelectItem>
              <SelectItem value="Seminar Room">Seminar Room</SelectItem>
              <SelectItem value="Computer Lab">Computer Lab</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-full sm:w-40 rounded-lg">
              <SelectValue placeholder="Filter by Building" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building} value={building}>
                  {building}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:px-6 lg:px-8">
          <RoomList
            onEditRoom={isAdmin ? handleEditClick : undefined}
            roomsResponse={roomsResponse}
            filters={{ search: searchQuery, type: filterType, building: filterBuilding }}
          />
        </div>

        {(isAddingRoom || editingRoomId) && isAdmin && (
          <RoomForm
            roomId={editingRoomId}
            onClose={handleFormClose}
            isOpen={isAddingRoom || !!editingRoomId}
            initialData={editingRoomData}
          />
        )}
      </div>
    </Layout>
  );
};

export default Rooms;