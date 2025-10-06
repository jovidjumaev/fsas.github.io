'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'student' | 'professor' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              FSAS
            </h1>
            <p className="text-lg text-gray-600">
              Furman Smart Attendance System
            </p>
          </Link>
        </div>

        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign In
            </h2>
            <p className="text-gray-600">
              Choose your role to continue
            </p>
          </div>

          {!selectedRole ? (
            <div className="space-y-4">
              <Button
                onClick={() => setSelectedRole('student')}
                className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                🎓 I am a Student
              </Button>
              
              <Button
                onClick={() => setSelectedRole('professor')}
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white"
              >
                👨‍🏫 I am a Professor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedRole === 'student' ? '🎓 Student Login' : '👨‍🏫 Professor Login'}
                </h3>
                <button
                  onClick={() => setSelectedRole(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  ← Change role
                </button>
              </div>
              
              <div className="space-y-3">
                <Link href={`/${selectedRole}/login`} className="block">
                  <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white">
                    Continue to {selectedRole === 'student' ? 'Student' : 'Professor'} Login
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              New user?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
}
