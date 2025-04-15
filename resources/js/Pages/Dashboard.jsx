import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import Layout from "../Layouts/layout";
import { UserRole } from "../types/index";
import AdminDashboard from "../Pages/Dashboard/AdminDashboard";
import LecturerDashboard from "../Pages/Dashboard/LecturerDashboard";
import StudentDashboard from "../Pages/Dashboard/StudentDashboard";


export default function Dashboard() {
    const renderDashboard = () => {
        switch (user?.role) {
            case UserRole.ADMIN:
                return <AdminDashboard />;
            case UserRole.LECTURER:
                return <LecturerDashboard />;
            case UserRole.STUDENT:
                return <StudentDashboard />;
            default:
                return <StudentDashboard />;
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}
        // header={
        //     <h2 className="text-xl font-semibold leading-tight text-gray-800">
        //         Dashboard
        //     </h2>
        // }
        >
            <Head title="Dashboard" />

            {/* <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
                        </div>
                    </div>
                </div>
            </div> */}
            <Layout>
                {renderDashboard()}
            </Layout>

        </AuthenticatedLayout>
    );
}
