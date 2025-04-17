import Header from "./header";
import Footer from "./footer";
import Sidebar from "./sidebar";
import { useAuth } from "../../hooks/use-auth";
import FeedbackDialog from "../feedback/feedback-dialog";

const Layout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header: Fixed, 64px */}
      <Header />

      <div className="flex flex-1">
        {/* Sidebar: Fixed, 320px on desktop, toggled on mobile */}
        <Sidebar />

        {/* Main Content: Scrollable */}
        <main
          className="flex-1 w-full mx-auto sm:px-6 lg:px-8 md:ml-80" // Changed md:ml-20 to md:ml-80 to match sidebar width
          style={{
            marginTop: "64px", 
            minHeight: "calc(100vh - 128px)",
            overflowY: "hidden",
          }}
        >
          {children}
        </main>
      </div>

      {/* Footer: Fixed, ~64px */}
      <Footer />

      {/* Feedback Dialog */}
      <FeedbackDialog />
    </div>
  );
};

export default Layout;