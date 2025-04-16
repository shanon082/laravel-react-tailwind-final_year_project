import { Menu, Bell, Search, ChevronDown } from "lucide-react";
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
import { Link } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { motion, AnimatePresence } from "framer-motion";

const Header = () => {
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Toggle menu"
                className="rounded-full hover:bg-gray-100 text-gray-600"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center">
              <ApplicationLogo className="h-8 w-auto text-primary" />
              <span className="ml-2 text-xl font-semibold text-gray-900 hidden md:block">
                Soroti University
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4 hidden md:flex">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
              </div>
              <Input
                type="text"
                placeholder="Search..."
                className="pl-10 bg-gray-50 border-0 focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary transition-all duration-200 group"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
              <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                View notifications
              </span>
            </Button>

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
                <DropdownMenuItem className="rounded-md hover:bg-gray-100 p-2">
                  <Link href="/settings" className="w-full text-sm">
                    Settings
                  </Link>
                </DropdownMenuItem>
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

      {/* Mobile Sidebar */}
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
                {filteredNavItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                        isActive(item.path)
                          ? "bg-primary text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/settings"
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      url.startsWith("/settings")
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="ml-3">Settings</span>
                  </Link>
                </li>
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