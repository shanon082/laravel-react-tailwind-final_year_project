import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Layout from '@/MajorComponents/layout/layout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function Settings({ auth }) {
    const [profile, setProfile] = useState({
        name: auth.user.name || '',
        email: auth.user.email || '',
    });
    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
    });

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPassword({ ...password, [e.target.name]: e.target.value });
    };

    const handleNotificationChange = (e) => {
        setNotifications({ ...notifications, [e.target.name]: e.target.checked });
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        // Add logic to update profile (e.g., API call)
        alert('Profile updated!');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        // Add logic to update password (e.g., API call)
        alert('Password updated!');
    };

    const handleDeleteAccount = () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // Add logic to delete account (e.g., API call)
            alert('Account deleted!');
        }
    };

    return (
        <Layout user={auth.user}>
            <Head title="Settings" />
            <div className="py-12 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>

                            {/* Profile Information */}
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Information</h2>
                                <p className="text-gray-600 mb-4">Update your account's profile information.</p>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                value={profile.name}
                                                onChange={handleProfileChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                id="email"
                                                value={profile.email}
                                                onChange={handleProfileChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Your email"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            onClick={handleProfileSubmit}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Password Management */}
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
                                <p className="text-gray-600 mb-4">Ensure your account is secure by updating your password.</p>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="current" className="block text-sm font-medium text-gray-700">
                                                Current Password
                                            </label>
                                            <input
                                                type="password"
                                                name="current"
                                                id="current"
                                                value={password.current}
                                                onChange={handlePasswordChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Current password"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="new" className="block text-sm font-medium text-gray-700">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="new"
                                                id="new"
                                                value={password.new}
                                                onChange={handlePasswordChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="New password"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                                                Confirm New Password
                                            </label>
                                            <input
                                                type="password"
                                                name="confirm"
                                                id="confirm"
                                                value={password.confirm}
                                                onChange={handlePasswordChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            onClick={handlePasswordSubmit}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Notification Preferences */}
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Preferences</h2>
                                <p className="text-gray-600 mb-4">Manage how you receive notifications.</p>
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            name="email"
                                            id="email-notifications"
                                            checked={notifications.email}
                                            onChange={handleNotificationChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                                            Receive email notifications
                                        </label>
                                    </div>
                                    <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            name="sms"
                                            id="sms-notifications"
                                            checked={notifications.sms}
                                            onChange={handleNotificationChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
                                            Receive SMS notifications
                                        </label>
                                    </div>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => alert('Notification preferences saved!')}
                                            className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Delete Account */}
                            <section>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Delete Account</h2>
                                <p className="text-gray-600 mb-4">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <div className="border-t border-gray-200 pt-4">
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}