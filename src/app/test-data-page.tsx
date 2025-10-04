'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TestDataPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);

    const tests = [
      {
        name: 'Auth Connection',
        test: async () => {
          const { data, error } = await supabase.auth.getSession();
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'User Profiles Table',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Courses Table',
        test: async () => {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Class Sessions Table',
        test: async () => {
          const { data, error } = await supabase
            .from('class_sessions')
            .select('*')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'Attendance Records Table',
        test: async () => {
          const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      },
      {
        name: 'QR Code Usage Table',
        test: async () => {
          const { data, error } = await supabase
            .from('qr_code_usage')
            .select('*')
            .limit(5);
          return { success: !error, data, error: error?.message };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const result = await test.test();
        results.push({
          name: test.name,
          success: result.success,
          data: result.data,
          error: result.error,
          rowCount: Array.isArray(result.data) ? result.data.length : 0
        });
      } catch (err: any) {
        results.push({
          name: test.name,
          success: false,
          error: err.message,
          rowCount: 0
        });
      }
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const createTestData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a test course (this will work without auth)
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          course_code: 'CSC-475',
          course_name: 'Seminar in Computer Science',
          professor_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          semester: 'Fall',
          year: 2024
        })
        .select();

      if (courseError) {
        throw new Error(courseError.message);
      }

      setData(courseData);
      console.log('Test data created:', courseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Supabase Data Test Page
        </h1>

        <div className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Test Controls</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Button
                  onClick={runTests}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Run All Tests'}
                </Button>
                <Button
                  onClick={createTestData}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Test Data
                </Button>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-red-800 font-semibold">Error:</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Test Results</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          {result.success ? '✅' : '❌'} {result.name}
                        </h3>
                        <span className="text-sm text-gray-600">
                          {result.rowCount} rows
                        </span>
                      </div>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Display */}
          {data && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Test Data Created</h2>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Connection Info */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Connection Information</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
