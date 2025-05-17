import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const NOTIFICATIONS_PER_PAGE = 10;
const POLLING_INTERVAL = 30000;

const notificationStyles = {
    'new_feedback': {
        icon: '💬',
        className: 'border-blue-100 bg-blue-50',
    },
    'feedback_response': {
        icon: '✅',
        className: 'border-green-100 bg-green-50',
    },
    'timetable_update': {
        icon: '📅',
        className: 'border-purple-100 bg-purple-50',
    },
    'course_update': {
        icon: '📚',
        className: 'border-orange-100 bg-orange-50',
    },
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preferences, setPreferences] = useState(
        JSON.parse(localStorage.getItem('notificationPreferences')) || {
            showFeedback: true,
            showTimetable: true,
            showCourse: true,
        }
    );
    const notificationRef = useRef(null);
    const { toast } = useToast();

    // Intersection Observer for infinite scroll
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.5,
        triggerOnce: false,
        rootMargin: '100px',
    });

    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiRequest('GET', `/notifications?page=${pageNum}&per_page=${NOTIFICATIONS_PER_PAGE}`);
            
            if (response.data) {
                setNotifications(prev => append ? [...prev, ...response.data] : response.data);
                setUnreadCount(response.unread_count || response.data.length);
                setHasMore(response.data.length === NOTIFICATIONS_PER_PAGE);
            }
        } catch (error) {
            setError('Failed to fetch notifications');
            toast({
                title: "Error",
                description: "Failed to load notifications",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Initialize Echo for real-time updates
    useEffect(() => {
        if (window.Echo) {
            try {
                const userId = window?.Laravel?.user?.id;
                
                if (userId) {
                    const channel = window.Echo.private(`App.Models.User.${userId}`)
                        .notification((notification) => {
                            handleNewNotification(notification);
                        });

                    return () => {
                        channel.stopListening('Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
                    };
                }
            } catch (error) {
                console.error('Failed to initialize Echo:', error);
            }
        }
    }, []);

    // Handle new notification
    const handleNewNotification = useCallback((notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast notification
        toast({
            title: "New Notification",
            description: notification.data.message,
            variant: "default",
            className: `border-l-4 ${notificationStyles[notification.data.type]?.className || 'border-blue-500'}`,
        });
    }, [toast]);

    // Polling fallback
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => fetchNotifications(), POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Infinite scroll
    useEffect(() => {
        if (inView && hasMore && !loading) {
            setPage(prev => {
                const nextPage = prev + 1;
                fetchNotifications(nextPage, true);
                return nextPage;
            });
        }
    }, [inView, hasMore, loading, fetchNotifications]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await apiRequest('POST', `/notifications/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to mark notification as read",
                variant: "destructive",
            });
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiRequest('POST', '/notifications/read-all');
            setNotifications([]);
            setUnreadCount(0);
            toast({
                title: "Success",
                description: "All notifications marked as read",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to mark all as read",
                variant: "destructive",
            });
        }
    };

    const togglePreference = (key) => {
        setPreferences(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            localStorage.setItem('notificationPreferences', JSON.stringify(updated));
            return updated;
        });
    };

    const getFilteredNotifications = () => {
        return notifications.filter(notification => {
            const type = notification.data.type;
            if (type.includes('feedback') && !preferences.showFeedback) return false;
            if (type.includes('timetable') && !preferences.showTimetable) return false;
            if (type.includes('course') && !preferences.showCourse) return false;
            return true;
        });
    };

    const handleNotificationClick = (notification) => {
        if (notification.data.url) {
            window.location.href = notification.data.url;
        }
        markAsRead(notification.id);
    };

    return (
        <div className="relative" ref={notificationRef}>
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
                <Bell className="h-6 w-6" />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
                        >
                            {unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            {/* Notification Preferences */}
                            <div className="mt-2 flex gap-2 text-sm">
                                <button
                                    onClick={() => togglePreference('showFeedback')}
                                    className={`px-2 py-1 rounded ${
                                        preferences.showFeedback ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                                    }`}
                                >
                                    Feedback
                                </button>
                                <button
                                    onClick={() => togglePreference('showTimetable')}
                                    className={`px-2 py-1 rounded ${
                                        preferences.showTimetable ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'
                                    }`}
                                >
                                    Timetable
                                </button>
                                <button
                                    onClick={() => togglePreference('showCourse')}
                                    className={`px-2 py-1 rounded ${
                                        preferences.showCourse ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'
                                    }`}
                                >
                                    Courses
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[32rem] overflow-y-auto">
                            {error && (
                                <div className="p-4 text-center text-red-600 bg-red-50">
                                    {error}
                                </div>
                            )}

                            {getFilteredNotifications().length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    No new notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {getFilteredNotifications().map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer relative group ${
                                                notificationStyles[notification.data.type]?.className || ''
                                            }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>

                                            <div className="flex items-start gap-3">
                                                <span className="text-xl">
                                                    {notificationStyles[notification.data.type]?.icon || '📫'}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.data.message}
                                                    </p>
                                                    {notification.data.type === 'feedback_response' && (
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            Response: {notification.data.response}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Infinite Scroll Trigger */}
                                    {hasMore && (
                                        <div ref={loadMoreRef} className="p-4 text-center">
                                            {loading && (
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
} 