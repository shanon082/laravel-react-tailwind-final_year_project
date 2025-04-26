import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Home,
  Settings,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  Activity,
  School,
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../../types/index";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const { url } = usePage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Debug: Log user and role
  console.log("Sidebar: user =", user);
  console.log("Sidebar: user.role =", user?.role);

  const getDashboardPath = () => {
    if (!user?.role) {
      console.warn("Sidebar: No user role found, defaulting to /dashboard");
      return "/dashboard";
    }
    switch (user.role) {
      case UserRole.ADMIN:
        return "/admin/dashboard";
      case UserRole.LECTURER:
        return "/lecturer/dashboard";
      case UserRole.STUDENT:
        return "/student/dashboard";
      default:
        console.warn("Sidebar: Invalid user role:", user.role);
        return "/dashboard";
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      path: getDashboardPath(),
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT],
      tooltip: "View your dashboard",
    },    
    {
      name: "Faculty",
      path: "/faculties",
      icon: <School className="h-5 w-5" />,
      roles: [UserRole.ADMIN],
      tooltip: "View faculty",
    },
    {
      name: "Departments",
      path: "/departments",
      icon: <Activity className="h-5 w-5" />,
      roles: [UserRole.ADMIN],
      tooltip: "View department",
    },
    {
      name: "Rooms",
      path: "/rooms",
      icon: <Home className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.LECTURER],
      tooltip: "Manage rooms",
    },
    {
      name: "Lecturers",
      path: "/lecturers",
      icon: <Users className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT],
      tooltip: "View lecturers",
    },
    {
      name: "Courses",
      path: "/courses",
      icon: <BookOpen className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT],
      tooltip: "Browse courses",
    },
    {
      name: "Timetables",
      path: "/timetable",
      icon: <Calendar className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT],
      tooltip: "Manage timetables",
    },
    {
      name: "Feedback",
      path: "/feedback",
      icon: <MessageCircle className="h-5 w-5" />,
      roles: [UserRole.ADMIN],
      tooltip: "Messages",
    },
  ];

  const filteredNavItems = user?.role
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  const isActive = (path) => {
    if (path === getDashboardPath()) {
      return (
        url.startsWith("/admin/dashboard") ||
        url.startsWith("/lecturer/dashboard") ||
        url.startsWith("/student/dashboard") ||
        url === "/dashboard"
      );
    }
    return url.startsWith(path);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (path) => {
    console.log(`Navigating to: ${path}`);
    toggleSidebar();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-primary text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -224 }}
            animate={{ x: 0 }}
            exit={{ x: -224 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-16 left-0 h-[calc(100vh-64px)] w-56 bg-white shadow-lg border-r border-gray-200 flex flex-col z-40 md:hidden"
          >
            <nav className="flex-1 px-3 py-2">
              <ul className="space-y-1">
                {filteredNavItems.length > 0 ? (
                  filteredNavItems.map((item) => (
                    <li key={item.name} className="relative group">
                      <Link
                        href={item.path}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive(item.path)
                            ? "bg-primary text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                        }`}
                        aria-current={isActive(item.path) ? "page" : undefined}
                        onClick={() => handleLinkClick(item.path)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                        <ChevronRight
                          className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                            isActive(item.path)
                              ? "text-white rotate-90"
                              : "text-gray-400 group-hover:text-primary"
                          }`}
                        />
                      </Link>
                      <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        {item.tooltip}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-gray-500 text-sm">
                    No navigation items available
                  </li>
                )}
              </ul>
            </nav>
            <div className="px-3 py-4 border-t border-gray-100">
              <Link
                href="/settings"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group ${
                  url.startsWith("/settings")
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                }`}
                aria-current={url.startsWith("/settings") ? "page" : undefined}
                onClick={() => handleLinkClick("/settings")}
              >
                <Settings className="h-5 w-5" />
                <span className="ml-3">Settings</span>
                <ChevronRight
                  className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                    url.startsWith("/settings")
                      ? "text-white rotate-90"
                      : "text-gray-400 group-hover:text-primary"
                  }`}
                />
                <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  Manage settings
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col fixed top-16 left-0 h-[calc(100vh-64px)] w-80 bg-white shadow-lg border-r border-gray-200 z-40">
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-1">
            {filteredNavItems.length > 0 ? (
              filteredNavItems.map((item) => (
                <li key={item.name} className="relative group">
                  <Link
                    href={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                    }`}
                    aria-current={isActive(item.path) ? "page" : undefined}
                    onClick={() => handleLinkClick(item.path)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                        isActive(item.path)
                          ? "text-white rotate-90"
                          : "text-gray-400 group-hover:text-primary"
                      }`}
                    />
                  </Link>
                  <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {item.tooltip}
                  </span>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-500 text-sm">
                No navigation items available
              </li>
            )}
          </ul>
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <Link
            href="/settings"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group ${
              url.startsWith("/settings")
                ? "bg-primary text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-primary"
            }`}
            aria-current={url.startsWith("/settings") ? "page" : undefined}
            onClick={() => handleLinkClick("/settings")}
          >
            <Settings className="h-5 w-5" />
            <span className="ml-3">Settings</span>
            <ChevronRight
              className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                url.startsWith("/settings")
                  ? "text-white rotate-90"
                  : "text-gray-400 group-hover:text-primary"
              }`}
            />
            <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Manage settings
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;