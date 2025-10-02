'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Course, CreateCourseForm } from '@/types';
import { Plus, BookOpen, Users, Calendar } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  onCourseSelect: (course: Course) => void;
  onCreateCourse: (courseData: CreateCourseForm) => void;
  selectedCourse: Course | null;
}

export function CourseList({ 
  courses, 
  onCourseSelect, 
  onCreateCourse, 
  selectedCourse 
}: CourseListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateCourseForm>({
    course_code: '',
    course_name: '',
    semester: 'Fall',
    year: new Date().getFullYear()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onCreateCourse(formData);
      setFormData({
        course_code: '',
        course_name: '',
        semester: 'Fall',
        year: new Date().getFullYear()
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'year' ? (typeof value === 'string' ? parseInt(value) : value) : value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
          <p className="text-gray-600">Manage your courses and track attendance</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </Button>
      </div>

      {/* Create Course Form */}
      {showCreateForm && (
        <Card className="p-6">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Create New Course</h3>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course_code" className="block text-sm font-medium text-gray-700">
                  Course Code
                </label>
                <Input
                  id="course_code"
                  value={formData.course_code}
                  onChange={(value) => handleInputChange('course_code', value)}
                  placeholder="e.g., CSC-475"
                  required
                />
              </div>
              <div>
                <label htmlFor="course_name" className="block text-sm font-medium text-gray-700">
                  Course Name
                </label>
                <Input
                  id="course_name"
                  value={formData.course_name}
                  onChange={(value) => handleInputChange('course_name', value)}
                  placeholder="e.g., Seminar in Computer Science"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                  Semester
                </label>
                <select
                  id="semester"
                  value={formData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(value) => handleInputChange('year', parseInt(value))}
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>

            <CardFooter className="px-0 pt-4">
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first course to start tracking attendance.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="primary"
          >
            Create Course
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedCourse?.id === course.id
                  ? 'ring-2 ring-blue-500 border-blue-500'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onCourseSelect(course)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {course.course_code}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {course.course_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {course.semester} {course.year}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{course.semester} {course.year}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>0 students enrolled</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onCourseSelect(course)}
                >
                  Manage Course
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
