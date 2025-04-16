import { useState } from "react";
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
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "../../Components/Select";
import { Label } from "../../Components/Label";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import DangerButton from "@/Components/DangerButton";

const feedbackTypes = [
  { id: "bug", label: "Bug Report", icon: "🐛" },
  { id: "feature", label: "Feature Request", icon: "✨" },
  { id: "improvement", label: "Improvement Suggestion", icon: "💡" },
  { id: "other", label: "Other", icon: "📝" }
];

const FeedbackDialog = () => {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value) => {
    setFeedback(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.type || !feedback.message) {
      toast({
        title: "Missing information",
        description: "Please select a feedback type and provide your message.",
        variant: "destructive",
      });
      return;
    }
    
    if (feedback.message.length < 10) {
      toast({
        title: "Message too short",
        description: "Please provide more details (at least 10 characters).",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // This will be replaced with an actual API endpoint once implemented
      // await apiRequest('POST', '/api/feedback', feedback);
      
      // For now, just simulate success
      setTimeout(() => {
        toast({
          title: "Feedback Sent",
          description: "Thank you for helping us improve! We'll review your feedback soon.",
          variant: "default",
        });
        
        setFeedback({
          type: "",
          message: ""
        });
        
        setOpen(false);
        setIsSubmitting(false);
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Error sending feedback",
        description: error.message || "Could not send feedback. Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="fixed bottom-6 right-6 shadow-lg z-30 flex items-center gap-2 bg-white hover:bg-gray-50 transition-all"
          aria-label="Provide feedback"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden md:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Share Your Feedback</DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Help us improve your experience
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="feedback-type" className="text-sm font-medium text-gray-200">
              What type of feedback do you have?
            </Label>
            <Select 
              value={feedback.type} 
              onValueChange={handleTypeChange}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent className="rounded-md bg-white">
                {feedbackTypes.map(type => (
                  <SelectItem 
                    key={type.id} 
                    value={type.id}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm">{type.icon}</span>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback-message" className="text-sm font-medium text-gray-200">
              Your detailed feedback
            </Label>
            <Textarea
              id="feedback-message"
              name="message"
              value={feedback.message}
              onChange={handleChange}
              placeholder="Please describe your feedback in detail. What happened? What did you expect? How can we improve?"
              className="min-h-[150px] text-sm"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-200">
              {feedback.message.length}/500 characters
            </p>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <DangerButton 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </DangerButton>
            <Button 
              type="submit"
              disabled={isSubmitting || !feedback.type || !feedback.message}
              className="w-full sm:w-auto border border-white bg-primary text-white hover:bg-primary/90 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : "Send Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;