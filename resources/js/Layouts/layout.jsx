import Header from "./header";
import Footer from "./footer";
import Sidebar from "./sidebar";
import FeedbackDialog from "../MajorComponents/feedback/feedback-dialog";

const Layout = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
      <FeedbackDialog />
    </div>
  );
};

export default Layout;