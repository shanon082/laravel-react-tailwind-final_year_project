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
import { MessageSquare } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

const feedbackTypes = [
  { id: "bug", label: "Bug Report" },
  { id: "feature", label: "Feature Request" },
  { id: "improvement", label: "Improvement Suggestion" },
  { id: "other", label: "Other" }
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
    
    setIsSubmitting(true);
    
    try {
      // This will be replaced with an actual API endpoint once implemented
      // await apiRequest('POST', '/api/feedback', feedback);
      
      // For now, just simulate success
      setTimeout(() => {
        toast({
          title: "Feedback Sent",
          description: "Thank you for your feedback! We appreciate your input.",
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
        description: error.message || "Could not send feedback. Please try again.",
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
          className="fixed bottom-4 right-4 shadow-md z-30 flex items-center"
        >
          <MessageSquare className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Feedback</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve the timetable system by sharing your thoughts or reporting issues.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select 
              value={feedback.type} 
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type of feedback" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback-message">Your Message</Label>
            <Textarea
              id="feedback-message"
              name="message"
              value={feedback.message}
              onChange={handleChange}
              placeholder="Please describe your feedback in detail..."
              className="min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;