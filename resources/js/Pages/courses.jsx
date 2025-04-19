import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import CourseList from "../MajorComponents/courses/course-list";
import CourseForm from "../MajorComponents/courses/course-form";
import { Button } from "../components/button";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head } from "@inertiajs/react";

const Courses = ({ auth }) => {
  const { user } = useAuth();
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  const handleAddClick = () => {
    setIsAddingCourse(true);
    setEditingCourseId(null);
  };

  const handleEditClick = (courseId) => {
    setEditingCourseId(courseId);
    setIsAddingCourse(false);
  };

  const handleFormClose = () => {
    setIsAddingCourse(false);
    setEditingCourseId(null);
  };

  if (!user) {
    return <div className="text-center py-8">Loading user data...</div>;
  }

  return (
    <Layout auth={auth} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Courses</h2>}>
      <Head title="Courses" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Courses</h1>
            <p className="mt-2 text-sm text-gray-600">
              Explore and manage all courses offered at Soroti University with ease.
            </p>
          </div>
          {isAdmin && (
            <div className="mt-4 md:mt-0">
              <Button
                onClick={handleAddClick}
                disabled={isAddingCourse}
                className={`flex items-center ${isAddingCourse ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                title="Add a new course"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Course
              </Button>
            </div>
          )}
        </div>

        {(isAddingCourse || editingCourseId) && isAdmin && (
          <div className="animate-fade-in">
            <CourseForm courseId={editingCourseId} onClose={handleFormClose} />
          </div>
        )}

        <CourseList onEditCourse={isAdmin ? handleEditClick : undefined} />
      </div>
    </Layout>
  );
};

export default Courses;