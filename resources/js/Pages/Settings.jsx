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
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>                            {/* Profile Information */}
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">manage settings</h2>
                            </section>                            
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}