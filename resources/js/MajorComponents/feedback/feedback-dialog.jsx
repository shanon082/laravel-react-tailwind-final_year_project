import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "../../Components/dialog";
import { Button } from "../../Components/Button";
import { Textarea } from "../../Components/textarea";
import { Label } from "../../Components/Label";
import { CheckCircle2, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import DangerButton from "@/Components/DangerButton";
import { UserRole } from "../../types/index";
import { useAuth } from "@/hooks/use-auth";

const feedbackTypes = [
  { id: "BUG", label: "Bug Report", icon: "🐛" },
  { id: "FEATURE", label: "Feature Request", icon: "✨" },
  { id: "IMPROVEMENT", label: "Improvement Suggestion", icon: "💡" },
  { id: "OTHER", label: "Other", icon: "📝" }
];

const FeedbackDialog = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
    course_id: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const maxLength = 500;

  // Only render for lecturers and students
  const allowedRoles = [UserRole.LECTURER, UserRole.STUDENT];
  if (!user?.role || !allowedRoles.includes(user.role)) {
    console.log('FeedbackDialog hidden: Invalid or unauthorized user role', user?.role);
    return null;
  }

  // Fetch courses for course_id selection
  useEffect(() => {
    if (open && user) {
      const fetchCourses = async () => {
        try {
          const response = await apiRequest('GET', '/courses');
          setCourses(response.data || []);
        } catch (err) {
          console.error('Failed to fetch courses:', err);
        }
      };
      fetchCourses();
    }
  }, [open, user]);

  const handleTypeChange = (type) => {
    setFeedback(prev => ({ ...prev, type }));
    setError("");
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value ? Number(e.target.value) : null;
    setFeedback(prev => ({ ...prev, course_id: courseId }));
    setError("");
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setFeedback(prev => ({ ...prev, message: value }));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.type) {
      setError("Please select a feedback type.");
      return;
    }
    
    if (!feedback.message) {
      setError("Please provide your feedback message.");
      return;
    }
    
    if (feedback.message.length < 10) {
      setError("Message must be at least 10 characters long.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await apiRequest('POST', '/feedback', {
        type: feedback.type,
        message: feedback.message,
        course_id: feedback.course_id || null,
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        toast({
          title: "Feedback Sent",
          description: "Thank you for helping us improve! We'll review your feedback soon.",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
          icon: <CheckCircle2 className="h-5 w-5" />,
        });
        setFeedback({ type: "", message: "", course_id: null });
        setShowSuccess(false);
        setOpen(false);
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Feedback submission error:', error);
      const errorMessage = error.message || "Could not send feedback. Please try again later.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-800",
        icon: <AlertTriangle className="h-5 w-5" />,
      });
      setIsSubmitting(false);
    }
  };

  const characterProgress = (feedback.message.length / maxLength) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-6 right-6 shadow-lg z-30 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all rounded-full px-4 py-2"
          aria-label="Provide feedback"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-xl bg-white/80 backdrop-blur-md border border-white/20 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">Share Your Feedback</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Help us improve your experience
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence>
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </motion.div>
              <p className="mt-4 text-lg font-semibold text-gray-800">Thank You!</p>
              <p className="text-sm text-gray-500">Your feedback has been submitted.</p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <Label htmlFor="feedback-type" className="text-sm font-medium text-gray-700">
                  What type of feedback do you have?
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {feedbackTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeChange(type.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                        feedback.type === type.id
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                      disabled={isSubmitting}
                      aria-label={`Select ${type.label}`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-id" className="text-sm font-medium text-gray-700">
                  Related Course (Optional)
                </Label>
                <select
                  id="course-id"
                  value={feedback.course_id || ""}
                  onChange={handleCourseChange}
                  className="w-full rounded-md border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                  disabled={isSubmitting}
                >
                  <option value="">Select a course (optional)</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message" className="text-sm font-medium text-gray-700">
                  Your detailed feedback
                </Label>
                <Textarea
                  id="feedback-message"
                  name="message"
                  value={feedback.message}
                  onChange={handleMessageChange}
                  placeholder="Please describe your feedback in detail. What happened? What did you expect? How can we improve?"
                  className="min-h-[120px] text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300 transition-all"
                  disabled={isSubmitting}
                  aria-describedby="message-error"
                />
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center">
                    <svg className="w-6 h-6" viewBox="0 0 36 36">
                      <path
                        className="fill-none stroke-gray-200 stroke-2"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="fill-none stroke-blue-500 stroke-2"
                        strokeDasharray={`${characterProgress}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="text-xs text-gray-500 ml-2">
                      {feedback.message.length}/{maxLength}
                    </span>
                  </div>
                  {error && (
                    <p id="message-error" className="text-xs text-red-500">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DangerButton
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100 transition-all rounded-lg"
                >
                  Cancel
                </DangerButton>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all rounded-lg flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : "Send Feedback"}
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;