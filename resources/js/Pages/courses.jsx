import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import CourseList from "../MajorComponents/courses/course-list";
import CourseForm from "../MajorComponents/courses/course-form";
import { Button } from "../components/button";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

const Courses = ({ auth}) => {
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

  return (
    <Layout auth={auth} header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Courses</h2>}>
      <Head title="Courses" />
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Courses</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage all courses offered at Soroti University.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 md:mt-0">
            <Button onClick={handleAddClick} disabled={isAddingCourse}>
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Course
            </Button>
          </div>
        )}
      </div>

      {(isAddingCourse || editingCourseId) && isAdmin && (
        <CourseForm 
          courseId={editingCourseId} 
          onClose={handleFormClose} 
        />
      )}

      <CourseList onEditCourse={isAdmin ? handleEditClick : undefined} />
    </Layout>
  );
};

export default Courses;
