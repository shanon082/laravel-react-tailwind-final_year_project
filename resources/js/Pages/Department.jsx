import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Users, BookOpen, Pencil, Trash2, Plus } from 'lucide-react';
import Layout from '@/MajorComponents/layout/layout';

const apiRequest = async (method, url, data = null) => {
    const response = await axios({ method, url, data });
    return response.data;
};

export default function Department({ auth, departments, isAdmin }) {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        faculty_id: '',
        description: '',
    });

    // Fetch faculties for the form
    const { data: faculties, isLoading: isFacultiesLoading } = useQuery({
        queryKey: ['faculties'],
        queryFn: () => apiRequest('GET', '/api/faculties'), // Adjust to your faculties endpoint
    });

    // Create department mutation
    const createMutation = useMutation({
        mutationFn: (data) => apiRequest('POST', '/departments', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['departments']);
            setIsCreateModalOpen(false);
            setFormData({ name: '', code: '', faculty_id: '', description: '' });
        },
        onError: (error) => alert(error.response?.data?.message || 'Error creating department'),
    });

    // Update department mutation
    const updateMutation = useMutation({
        mutationFn: (data) => apiRequest('PUT', `/departments/${selectedDepartment.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['departments']);
            setIsEditModalOpen(false);
            setSelectedDepartment(null);
            setFormData({ name: '', code: '', faculty_id: '', description: '' });
        },
        onError: (error) => alert(error.response?.data?.message || 'Error updating department'),
    });

    // Delete department mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => apiRequest('DELETE', `/departments/${id}`),
        onSuccess: () => queryClient.invalidateQueries(['departments']),
        onError: (error) => alert(error.response?.data?.message || 'Error deleting department'),
    });

    const handleCreate = (e) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this department?')) {
            deleteMutation.mutate(id);
        }
    };

    const openEditModal = (department) => {
        setSelectedDepartment(department);
        setFormData({
            name: department.name,
            code: department.code,
            faculty_id: department.faculty_id,
            description: department.description || '',
        });
        setIsEditModalOpen(true);
    };

    const viewDetails = (id, type) => {
        router.visit(`/departments/${id}/${type}`); // Adjust to your route structure
    };

    return (
        <Layout user={auth.user}>
            <Head title="Departments" />
            <div className="py-12 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Add Department
                                    </button>
                                )}
                            </div>

                            {/* Departments Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {departments.map((department) => (
                                            <tr key={department.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.code}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{department.faculty?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => viewDetails(department.id, 'lecturers')}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Users className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => viewDetails(department.id, 'courses')}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <BookOpen className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => viewDetails(department.id, 'students')}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        <Building2 className="h-5 w-5" />
                                                    </button>
                                                    {isAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(department)}
                                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                            >
                                                                <Pencil className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(department.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Department Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Department</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Faculty</label>
                                <select
                                    value={formData.faculty_id}
                                    onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                >
                                    <option value="">Select Faculty</option>
                                    {isFacultiesLoading ? (
                                        <option>Loading...</option>
                                    ) : (
                                        faculties?.map((faculty) => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="mr-4 px-4 py-2 text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                                    disabled={createMutation.isLoading}
                                >
                                    {createMutation.isLoading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Department Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Department</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Faculty</label>
                                <select
                                    value={formData.faculty_id}
                                    onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                    required
                                >
                                    <option value="">Select Faculty</option>
                                    {isFacultiesLoading ? (
                                        <option>Loading...</option>
                                    ) : (
                                        faculties?.map((faculty) => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="mr-4 px-4 py-2 text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                                    disabled={updateMutation.isLoading}
                                >
                                    {updateMutation.isLoading ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}