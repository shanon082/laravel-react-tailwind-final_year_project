import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import RoomList from "../MajorComponents/rooms/room-list";
import RoomForm from "../MajorComponents/rooms/room-form";
import { Button } from "../Components/Button";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head } from "@inertiajs/react";

const Rooms = ({auth}) => {
  const { user } = useAuth();
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);

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
    <Layout user={auth.user}>
      <Head title="Rooms" />
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Rooms</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all teaching rooms and facilities at Soroti University.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 md:mt-0">
            <Button onClick={handleAddClick} disabled={isAddingRoom}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Room
            </Button>
          </div>
        )}
      </div>

      {(isAddingRoom || editingRoomId) && isAdmin && (
        <RoomForm 
          roomId={editingRoomId} 
          onClose={handleFormClose} 
        />
      )}

      <RoomList onEditRoom={isAdmin ? handleEditClick : undefined} />
    </Layout>
  );
};

export default Rooms;
