import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Users, 
  Home,
  Settings
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../types/index";

const Sidebar = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { 
      name: "Dashboard", 
      path: "/dashboard", 
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />, 
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT] 
    },
    { 
      name: "Timetables", 
      path: "/timetable", 
      icon: <Calendar className="h-5 w-5 mr-3" />, 
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT] 
    },
    { 
      name: "Courses", 
      path: "/courses", 
      icon: <BookOpen className="h-5 w-5 mr-3" />, 
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT] 
    },
    { 
      name: "Lecturers", 
      path: "/lecturers", 
      icon: <Users className="h-5 w-5 mr-3" />, 
      roles: [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT] 
    },
    { 
      name: "Rooms", 
      path: "/rooms", 
      icon: <Home className="h-5 w-5 mr-3" />, 
      roles: [UserRole.ADMIN, UserRole.LECTURER] 
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const activeClass = "bg-primary text-white flex items-center px-4 py-2 text-sm font-medium rounded-md";
  const inactiveClass = "text-gray-600 hover:text-primary hover:bg-gray-100 flex items-center px-4 py-2 text-sm font-medium rounded-md";

  return (
    <div className="hidden md:block bg-white border-r border-gray-200 w-64 flex-shrink-0 h-full min-h-screen overflow-y-auto">
      <div className="px-4 py-5">
        <div className="text-primary font-bold text-xl text-center mb-6">Soroti University</div>
        <div className="space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={location === item.path ? activeClass : inactiveClass}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="px-4 py-4 mt-10 border-t border-gray-200">
        <Link href="/settings" className="text-gray-600 hover:text-primary hover:bg-gray-100 flex items-center px-4 py-2 text-sm font-medium rounded-md">
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;