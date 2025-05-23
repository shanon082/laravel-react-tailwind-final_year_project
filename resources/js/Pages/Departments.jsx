import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Users, BookOpen, Pencil, Trash2, Plus, Filter } from 'lucide-react';
import Layout from '@/MajorComponents/layout/layout';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/card';
import { Input } from '@/Components/input';
import { Button } from '@/Components/button';
import ErrorBoundary from '@/Components/ErrorBoundary';
import { Pagination } from '@/Components/pagination'; // Assuming you have a Pagination component

const apiRequest = async (method, url, data = null) => {
  try {
    if (['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
      await axios.get('/sanctum/csrf-cookie');
    }
    const response = await axios({
      method,
      url,
      data,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
        router.visit('/login'); // Redirect to login on session expiry
        return null;
    }
    console.error('API request failed:', error);
    throw error;
  }
};

export default function Department({ auth, departments, filters = { search: '' } }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_id: '',
  });
  const [search, setSearch] = useState(filters.search || '');

  // Determine if user is admin
  const isAdmin = user?.role === UserRole.ADMIN;

  // Fetch faculties for the form
  const { data: faculties, isLoading: isFacultiesLoading } = useQuery({
    queryKey: ['faculties'],
    queryFn: () => apiRequest('GET', '/faculties'),
  });

  // // Create department mutation
  // const createMutation = useMutation({
  //   mutationFn: (data) => apiRequest('POST', '/departments', data),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['departments']);
  //     setIsCreateModalOpen(false);
  //     setFormData({ name: '', code: '', faculty_id: '' });
  //   },
  //   onError: (error) => alert(error.response?.data?.message || 'Error creating department'),
  // });

  // // Update department mutation
  // const updateMutation = useMutation({
  //   mutationFn: (data) => apiRequest('PUT', `/departments/${selectedDepartment.id}`, data),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['departments']);
  //     setIsEditModalOpen(false);
  //     setSelectedDepartment(null);
  //     setFormData({ name: '', code: '', faculty_id: '' });
  //   },
  //   onError: (error) => alert(error.response?.data?.message || 'Error updating department'),
  // });

  // // Delete department mutation
  // const deleteMutation = useMutation({
  //   mutationFn: (id) => apiRequest('DELETE', `/departments/${id}`),
  //   onSuccess: () => queryClient.invalidateQueries(['departments']),
  //   onError: (error) => alert(error.response?.data?.message || 'Error deleting department'),
  // });

  // Create department mutation
const createMutation = useMutation({
  mutationFn: (data) => apiRequest('POST', '/department', data),
  onSuccess: () => {
    router.reload({ preserveState: true, preserveScroll: true }); // Refresh page
    setIsCreateModalOpen(false);
    setFormData({ name: '', code: '', faculty_id: '' });
  },
  onError: (error) => alert(error.response?.data?.message || 'Error creating department'),
});

// Update department mutation
const updateMutation = useMutation({
  mutationFn: (data) => apiRequest('PUT', `/department/${selectedDepartment.id}`, data),
  onSuccess: () => {
    router.reload({ preserveState: true, preserveScroll: true }); // Refresh page
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
    setFormData({ name: '', code: '', faculty_id: '' });
  },
  onError: (error) => alert(error.response?.data?.message || 'Error updating department'),
});

// Delete department mutation
const deleteMutation = useMutation({
  mutationFn: (id) => apiRequest('DELETE', `/department/${id}`),
  onSuccess: () => {
    router.reload({ preserveState: true, preserveScroll: true }); // Refresh page
  },
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
      faculty_id: department.faculty_id || department.faculty?.id || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    router.get(
      route('department'),
      { search: value, per_page: departments.per_page || 10 },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handlePageChange = (page) => {
    router.get(
      route('department'),
      { page, search, per_page: departments.per_page || 10 },
      { preserveState: true, preserveScroll: true }
    );
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
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Department
                  </Button>
                )}
              </div>

              {/* Search Filter */}
              <ErrorBoundary>
                <Card className="mb-6 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Filter className="mr-2 h-5 w-5 text-gray-500" />
                      Filter Departments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="Search by name..."
                      value={search}
                      onChange={handleSearch}
                      className="w-full"
                      aria-label="Search departments by name"
                    />
                  </CardContent>
                </Card>
              </ErrorBoundary>

              {/* Departments Table */}
              <ErrorBoundary>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departments.data.map((department) => (
                        <tr key={department.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {department.faculty?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => openEditModal(department)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                  aria-label={`Edit department ${department.name}`}
                                >
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(department.id)}
                                  className="text-red-600 hover:text-red-900"
                                  aria-label={`Delete department ${department.name}`}
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
                {/* Pagination */}
                <Pagination
                  currentPage={departments.current_page}
                  lastPage={departments.last_page}
                  onPageChange={handlePageChange}
                />
              </ErrorBoundary>
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
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Department name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Department code"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Faculty
                </label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Select faculty"
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="mr-4 px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  disabled={createMutation.isLoading}
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create'}
                </Button>
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
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Department name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Department code"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Faculty
                </label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                  required
                  aria-label="Select faculty"
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
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="mr-4 px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  disabled={updateMutation.isLoading}
                >
                  {updateMutation.isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}