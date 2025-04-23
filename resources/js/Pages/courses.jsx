import { useState } from "react";
import Layout from "../MajorComponents/layout/layout";
import CourseList from "../MajorComponents/courses/course-list";
import CourseForm from "../MajorComponents/courses/course-form";
import Modal from "../components/modal";
import { Button } from "../components/button";
import { Plus } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { UserRole } from "../types";
import { Head } from "@inertiajs/react";

const Courses = ({ auth, coursesResponse }) => {
  console.log("Courses props:", { auth, coursesResponse });
  const { user } = useAuth();
  const [modalState, setModalState] = useState({
    isOpen: false,
    courseId: null,
    isEditMode: false,
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  const openModal = (courseId = null, isEditMode = false) => {
    setModalState({ isOpen: true, courseId, isEditMode });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, courseId: null, isEditMode: false });
  };

  const handleAddClick = () => {
    openModal(null, false);
  };

  const handleEditClick = (courseId) => {
    openModal(courseId, true);
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
                disabled={modalState.isOpen}
                className={`flex items-center ${modalState.isOpen ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
                title="Add a new course"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Add Course
              </Button>
            </div>
          )}
        </div>

        <Modal
          show={modalState.isOpen}
          onClose={closeModal}
          maxWidth="2xl"
          closeable={true}
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {modalState.isEditMode ? "Edit Course" : "Add New Course"}
            </h2>
            {modalState.isOpen && isAdmin && (
              <CourseForm
                courseId={modalState.courseId}
                onClose={closeModal}
              />
            )}
          </div>
        </Modal>

        <CourseList
          onEditCourse={isAdmin ? handleEditClick : undefined}
          coursesResponse={coursesResponse}
        />
      </div>
    </Layout>
  );
};

export default Courses;