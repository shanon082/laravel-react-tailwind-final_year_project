import Layout from '@/MajorComponents/layout/layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { CheckCircle2, Send } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { Textarea } from '../Components/textarea';
import { Button } from '../Components/Button';
import { Label } from '../Components/Label';

export default function Feedback({ auth, feedbackList = [] }) {
    const [filterType, setFilterType] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [replyForm, setReplyForm] = useState({ feedbackId: null, message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleReply = async (feedbackId, userName) => {
        if (replyForm.feedbackId === feedbackId) {
            // Submit reply
            if (!replyForm.message) {
                toast({
                    title: 'Error',
                    description: 'Please provide a reply message.',
                    variant: 'destructive',
                });
                return;
            }

            if (replyForm.message.length < 10) {
                toast({
                    title: 'Error',
                    description: 'Reply message must be at least 10 characters long.',
                    variant: 'destructive',
                });
                return;
            }

            setIsSubmitting(true);
            try {
                const response = await apiRequest('POST', `/feedback/${feedbackId}/reply`, {
                    resolution_notes: replyForm.message,
                });

                // Update the feedback item in the list
                const updatedFeedback = feedbackList.map(item => 
                    item.id === feedbackId 
                        ? { ...item, is_resolved: true, resolution_notes: replyForm.message }
                        : item
                );
                feedbackList = updatedFeedback;

                toast({
                    title: 'Reply Sent',
                    description: `Reply sent to ${userName || 'user'}.`,
                    variant: 'default',
                    className: 'bg-green-50 border-green-200 text-green-800',
                    icon: <CheckCircle2 className="h-5 w-5" />,
                });
                setReplyForm({ feedbackId: null, message: '' });
            } catch (error) {
                console.error('Feedback reply error:', error);
                toast({
                    title: 'Error',
                    description: error.message || 'Could not send reply. Please try again.',
                    variant: 'destructive',
                });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Open reply form
            setReplyForm({ feedbackId, message: '' });
        }
    };

    const handleCancelReply = () => {
        setReplyForm({ feedbackId: null, message: '' });
    };

    const filteredFeedback = feedbackList
        .filter((feedback) => filterType === 'all' || feedback.type === filterType)
        .sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <Layout user={auth.user}>
            <Head title="User Feedback" />
            <div className="py-12 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900">User Feedback</h1>
                        <p className="mt-2 text-gray-600">
                            View and manage feedback submitted by users.
                        </p>
                    </div>

                    {/* Filter and Sort Controls */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                                Filter by Type
                            </label>
                            <select
                                id="filter"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="mt-1 block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="all">All</option>
                                <option value="BUG">Bug</option>
                                <option value="FEATURE">Feature Request</option>
                                <option value="IMPROVEMENT">Improvement</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                                Sort by
                            </label>
                            <select
                                id="sort"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="mt-1 block w-full sm:w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Feedback List */}
                    {filteredFeedback.length === 0 ? (
                        <div className="flex justify-center items-center py-20">
                            <p className="text-gray-500 text-lg">
                                {filterType === 'all'
                                    ? 'No feedback submitted yet.'
                                    : `No ${filterType} feedback found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFeedback.map((feedback) => (
                                <div
                                    key={feedback.id}
                                    className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                feedback.type === 'BUG'
                                                    ? 'bg-red-100 text-red-600'
                                                    : feedback.type === 'FEATURE'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : feedback.type === 'IMPROVEMENT'
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : feedback.type === 'OTHER'
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {feedback.type}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(feedback.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-md font-semibold text-gray-800 mb-2">{feedback.title}</h3>
                                    <p className="text-gray-800 text-sm whitespace-pre-wrap">
                                        {feedback.content}
                                    </p>
                                    {feedback.course && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Related to: <span className="font-semibold">{feedback.course.name}</span>
                                        </p>
                                    )}
                                    {feedback.user && (
                                        <div className="mt-4 border-t pt-3 text-sm text-gray-500">
                                            Submitted by{' '}
                                            <span className="font-semibold text-gray-700">{feedback.user.name}</span>
                                        </div>
                                    )}
                                    {feedback.is_resolved && feedback.resolution_notes && (
                                        <div className="mt-4 border-t pt-3">
                                            <p className="text-sm text-gray-500">
                                                <span className="font-semibold text-green-600">Resolved</span> - Admin Response:
                                            </p>
                                            <p className="text-sm text-gray-800 mt-1">{feedback.resolution_notes}</p>
                                        </div>
                                    )}
                                    {replyForm.feedbackId === feedback.id ? (
                                        <div className="mt-4 space-y-2">
                                            <Label htmlFor="reply-message" className="text-sm font-medium text-gray-700">
                                                Your Reply
                                            </Label>
                                            <Textarea
                                                id="reply-message"
                                                value={replyForm.message}
                                                onChange={(e) => setReplyForm({ ...replyForm, message: e.target.value })}
                                                placeholder="Enter your reply to the user..."
                                                className="min-h-[80px] text-sm rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-300"
                                                disabled={isSubmitting}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReply(feedback.id, feedback.user?.name)}
                                                    disabled={isSubmitting}
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
                                                >
                                                    <Send className="h-4 w-4" />
                                                    Send Reply
                                                </Button>
                                                <Button
                                                    onClick={handleCancelReply}
                                                    disabled={isSubmitting}
                                                    variant="outline"
                                                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleReply(feedback.id, feedback.user?.name)}
                                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                            disabled={feedback.is_resolved}
                                        >
                                            {feedback.is_resolved ? 'Resolved' : 'Reply'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}