import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Users, 
  Home,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import { UserRole } from "../../types/index";

const MobileSidebar = ({ isOpen, onClose }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

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

  if (!isOpen) return null;

  const activeClass = "bg-primary text-white flex items-center w-full px-4 py-2 text-sm font-medium rounded-md";
  const inactiveClass = "text-gray-600 hover:text-primary hover:bg-gray-100 flex items-center w-full px-4 py-2 text-sm font-medium rounded-md";

  return (
    <div className="md:hidden fixed inset-0 z-40 bg-white overflow-y-auto">
      <div className="flex flex-col h-full">
        <div className="px-4 py-6 border-b">
          <div className="flex items-center justify-between mb-6">
            <span className="text-primary font-bold text-xl">Soroti University</span>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {user && (
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                {user.fullName?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{user.fullName || 'User'}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-4 py-6 flex-1">
          <div className="space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={onClose}
                className={location === item.path ? activeClass : inactiveClass}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="px-4 py-6 border-t">
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-primary hover:bg-gray-100 flex items-center w-full px-4 py-2 text-sm font-medium rounded-md"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;