import { Head, usePage } from '@inertiajs/react';
import Layout from "../MajorComponents/layout/layout";
import { UserRole } from "../types/index";
import AdminDashboard from "../Pages/Dashboard/AdminDashboard";
import LecturerDashboard from "../Pages/Dashboard/LecturerDashboard";
import StudentDashboard from "../Pages/Dashboard/StudentDashboard";

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    console.log("Dashboard: user", user);

    const renderDashboard = () => {
        if (!user) {
            console.warn("Dashboard: No user found, rendering error");
            return (
                <div className="p-6 text-red-600">
                    Error: Please log in to view your dashboard.
                </div>
            );
        }

        switch (user.role) {
            case UserRole.ADMIN:
                return <AdminDashboard />;
            case UserRole.LECTURER:
                return <LecturerDashboard />;
            case UserRole.STUDENT:
                return <StudentDashboard />;
            default:
                console.warn("Dashboard: Invalid role, defaulting to StudentDashboard");
                return <StudentDashboard />;
        }
    };

    return (
        <Layout>
            <Head title="Dashboard" />
            <div className="max-w-7xl mx-auto">
                {renderDashboard()}
            </div>
        </Layout>
    );
}