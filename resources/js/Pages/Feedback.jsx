import Layout from '@/MajorComponents/layout/layout';
import { Head } from '@inertiajs/react';

export default function Feedback({ auth }) {
    return (
        <Layout user={auth.user}>
            <Head title="Feedback" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold">Feedback</h1>
                            <p>Manage your account Feedback here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}