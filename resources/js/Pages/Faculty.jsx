import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Users, BookOpen, Pencil, Trash2, Plus } from 'lucide-react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '../components/Toast'; // Adjust the path to your Toast.jsx file
import Layout from '@/MajorComponents/layout/layout';

const apiRequest = async (method, url, data = null) => {
  const response = await axios({ method, url, data });
  return response.data;
};

export default function Faculty({ auth, isAdmin }) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'default' });

  // Fetch faculties
  const { data: faculties = [], isLoading } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => apiRequest('GET', '/faculties'),
  });

  // Create faculty mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/faculties', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['faculties']);
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: ''});
      setToast({
        open: true,
        title: 'Success',
        description: 'Faculty created successfully!',
        variant: 'default',
      });
    },
    onError: (error) => {
      setToast({
        open: true,
        title: 'Error',
        description: error.response?.data?.message || 'Error creating faculty',
        variant: 'destructive',
      });
    },
  });

  // Update faculty mutation
  const updateMutation = useMutation({
    mutationFn: (data) => apiRequest("PUT", `/faculties/${selectedFaculty.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['faculties']);
      setIsEditModalOpen(false);
      setSelectedFaculty(null);
      setFormData({ name: '', code: ''});
      setToast({
        open: true,
        title: 'Success',
        description: 'Faculty updated successfully!',
        variant: 'default',
      });
    },
    onError: (error) => {
      setToast({
        open: true,
        title: 'Error',
        description: error.response?.data?.message || 'Error updating faculty',
        variant: 'destructive',
      });
    },
  });

  // Delete faculty mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE",`/faculties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['faculties']);
      setToast({
        open: true,
        title: 'Success',
        description: 'Faculty deleted successfully!',
        variant: 'default',
      });
    },
    onError: (error) => {
      setToast({
        open: true,
        title: 'Error',
        description: error.response?.data?.message || 'Error deleting faculty',
        variant: 'destructive',
      });
    },
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
    if (confirm('Are you sure you want to delete this faculty?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditModal = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({
      name: faculty.name,
      code: faculty.code,
    });
    setIsEditModalOpen(true);
  };

  const viewDetails = (id, type) => {
    router.visit(`/faculties/${id}/${type}`);
  };

  return (
    <Layout user={auth.user}>
      <Head title="Faculties" />
      <ToastProvider>
        <div className="py-12 bg-gray-100 min-h-screen">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">Faculties</h1>
                  {isAdmin && (
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Faculty
                    </button>
                  )}
                </div>

                {/* Faculties Table */}
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <p className="text-gray-500 text-center py-4">Loading...</p>
                  ) : faculties.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No faculties found.</p>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {faculties.map((faculty) => (
                          <tr key={faculty.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faculty.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => viewDetails(faculty.id, 'departments')}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Building2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => viewDetails(faculty.id, 'lecturers')}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Users className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => viewDetails(faculty.id, 'courses')}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <BookOpen className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => viewDetails(faculty.id, 'students')}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Users className="h-5 w-5" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => openEditModal(faculty)}
                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                  >
                                    <Pencil className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(faculty.id)}
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
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Create Faculty Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Faculty</h2>
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

          {/* Edit Faculty Modal */}
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Edit Faculty</h2>
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
        </div>

        {/* Toast Viewport */}
        <ToastViewport />
        <Toast
          open={toast.open}
          onOpenChange={(open) => setToast({ ...toast, open })}
          variant={toast.variant}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          <ToastClose />
        </Toast>
      </ToastProvider>
    </Layout>
  );
}