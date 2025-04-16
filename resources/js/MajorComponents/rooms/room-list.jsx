import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "../../Components/Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../Components/table"
import { Button } from "../../Components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../Components/dropdown-menu"
import { Badge } from "../../Components/badge"
import { Edit, MoreHorizontal, Loader2 } from "lucide-react"

const RoomList = ({ onEditRoom }) => {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["/api/rooms"]
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">
              No rooms found. Add a room to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Group rooms by building
  const roomsByBuilding = rooms.reduce((acc, room) => {
    if (!acc[room.building]) {
      acc[room.building] = []
    }
    acc[room.building].push(room)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rooms ({rooms.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Capacity</TableHead>
                {onEditRoom && <TableHead className="w-14"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(roomsByBuilding).map(
                ([building, buildingRooms]) => (
                  <>
                    {buildingRooms.map((room, index) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          {room.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.type}</Badge>
                        </TableCell>
                        <TableCell>{room.building}</TableCell>
                        <TableCell>{room.capacity} students</TableCell>
                        {onEditRoom && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onEditRoom(room.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default RoomList
