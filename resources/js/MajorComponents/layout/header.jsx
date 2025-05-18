import { Menu, Search, ChevronDown, X } from "lucide-react";
import { Button } from "../../Components/Button";
import { Avatar, AvatarFallback, AvatarImage } from "../../Components/avatar";
import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../Components/dropdown-menu";
import { Input } from "../../Components/input";
import { Link, router } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useDebouncedCallback } from "use-debounce";
import NotificationBell from "@/Components/NotificationBell";
import { UserRole } from "../../types/index";

const Header = () => {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value);
    if (value.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  }, 300);

  // Fetch search results
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { courses: [], lecturers: [], rooms: [] };

      const [coursesRes, lecturersRes, roomsRes] = await Promise.all([
        apiRequest("GET", `/courses?search=${encodeURIComponent(searchQuery)}`),
        apiRequest("GET", `/lecturers?search=${encodeURIComponent(searchQuery)}`),
        apiRequest("GET", `/rooms?search=${encodeURIComponent(searchQuery)}`),
      ]);

      const courses = await coursesRes.json().then((data) => (Array.isArray(data) ? data : data.data || []));
      const lecturers = await lecturersRes.json().then((data) => (Array.isArray(data) ? data : data.data || []));
      const rooms = await roomsRes.json().then((data) => (Array.isArray(data) ? data : data.data || []));

      return { courses, lecturers, rooms };
    },
    enabled: !!searchQuery.trim(),
  });

  // Handle result click
  const handleResultClick = (type, id) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    router.visit(`/${type}/${id}`);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm"
        style={{ overflow: "hidden" }}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <div className="flex md:hidden">
              {/* Mobile menu button (commented out in original) */}
            </div>
            <div className="flex items-center">
              <ApplicationLogo className="h-8 w-auto text-primary" />
              <span className="ml-2 text-xl font-semibold text-gray-900 hidden md:block">
                Soroti University
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 relative">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
              </div>
              <Input
                type="text"
                placeholder="Search courses, lecturers, rooms..."
                value={searchQuery}
                onChange={(e) => debouncedSearch(e.target.value)}
                onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                className="pl-10 bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg transition-all duration-200 w-full"
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                >
                  {isSearchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : !searchResults ||
                    (!searchResults.courses.length &&
                      !searchResults.lecturers.length &&
                      !searchResults.rooms.length) ? (
                    <div className="p-4 text-center text-gray-500">
                      No results found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {/* Courses */}
                      {searchResults.courses.length > 0 && (
                        <div className="py-2">
                          <div className="px-4 py-2 text-sm font-semibold text-gray-700">
                            Courses
                          </div>
                          {searchResults.courses.map((course) => (
                            <div
                              key={`course-${course.id}`}
                              onClick={() => handleResultClick("courses", course.id)}
                              className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{course.name}</div>
                              <div className="text-xs text-gray-500">
                                {course.code} - {course.department}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Lecturers */}
                      {searchResults.lecturers.length > 0 && (
                        <div className="py-2">
                          <div className="px-4 py-2 text-sm font-semibold text-gray-700">
                            Lecturers
                          </div>
                          {searchResults.lecturers.map((lecturer) => (
                            <div
                              key={`lecturer-${lecturer.id}`}
                              onClick={() => handleResultClick("lecturers", lecturer.id)}
                              className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{lecturer.fullName}</div>
                              <div className="text-xs text-gray-500">
                                {lecturer.title} - {lecturer.department}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Rooms */}
                      {searchResults.rooms.length > 0 && (
                        <div className="py-2">
                          <div className="px-4 py-2 text-sm font-semibold text-gray-700">
                            Rooms
                          </div>
                          {searchResults.rooms.map((room) => (
                            <div
                              key={`room-${room.id}`}
                              onClick={() => handleResultClick("rooms", room.id)}
                              className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                              <div className="font-medium">{room.name}</div>
                              <div className="text-xs text-gray-500">
                                {room.building} - {room.type}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-x-2 pl-1 pr-3 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${user?.fullName || "User"}&background=random&color=fff&bold=true`}
                    />
                    <AvatarFallback className="bg-primary text-white font-medium">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors duration-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-lg shadow-lg bg-white p-2"
              >
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-md hover:bg-gray-100 p-2">
                  <Link href={route("profile.edit")} className="w-full text-sm">
                    Profile
                  </Link>
                </DropdownMenuItem>
                {user?.role === UserRole.ADMIN && (
                  <DropdownMenuItem className="rounded-md hover:bg-gray-100 p-2">
                    <Link href="/settings" className="w-full text-sm">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-md hover:bg-red-50 hover:text-red-600 p-2">
                  <Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="w-full text-sm"
                  >
                    Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      {/* Mobile Sidebar (unchanged, included for completeness) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 md:hidden"
            style={{ overflow: "hidden" }}
          >
            <div className="px-6 py-5 flex items-center justify-between">
              <ApplicationLogo className="h-8 w-auto text-primary" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
            <nav className="px-4 py-2">
              <ul className="space-y-1">
                {/* Add navigation items as needed */}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Header;