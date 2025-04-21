import Layout from '@/MajorComponents/layout/layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';

export default function Feedback({ auth, feedbackList = [] }) {
    const [filterType, setFilterType] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const { toast } = useToast();

    const handleReply = async (feedbackId, userName) => {
        // Placeholder for reply logic (e.g., open a reply form or send via API)
        try {
            // Example: await apiRequest('POST', `/feedback/${feedbackId}/reply`, { message: 'Reply message' });
            toast({
                title: 'Reply Sent',
                description: `Reply sent to ${userName || 'user'}.`,
                variant: 'default',
                className: 'bg-green-50 border-green-200 text-green-800',
                icon: <CheckCircle2 className="h-5 w-5" />,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Could not send reply.',
                variant: 'destructive',
            });
        }
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
                                <option value="bug">Bug</option>
                                <option value="feature">Feature Request</option>
                                <option value="improvement">Improvement</option>
                                <option value="other">Other</option>
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
                            {filteredFeedback.map((feedback, index) => (
                                <div
                                    key={index}
                                    className="p-6 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                feedback.type === 'bug'
                                                    ? 'bg-red-100 text-red-600'
                                                    : feedback.type === 'feature'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : feedback.type === 'improvement'
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : feedback.type === 'other'
                                                    ? 'bg-gray-100 text-gray-600'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {feedback.type.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(feedback.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 text-sm whitespace-pre-wrap">
                                        {feedback.message}
                                    </p>
                                    {feedback.user && (
                                        <div className="mt-4 border-t pt-3 text-sm text-gray-500">
                                            Submitted by{' '}
                                            <span className="font-semibold text-gray-700">{feedback.user.name}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleReply(feedback.id, feedback.user?.name)}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        Reply
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}