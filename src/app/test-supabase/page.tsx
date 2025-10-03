'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, success, message, data, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Environment variables
      addResult(
        'Environment Variables',
        true,
        'Checking environment variables',
        {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        }
      );

      // Test 2: Supabase client initialization
      try {
        addResult('Supabase Client', true, 'Supabase client initialized successfully');
      } catch (error) {
        addResult('Supabase Client', false, 'Failed to initialize Supabase client', error);
      }

      // Test 3: Basic connection test
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
          addResult('Connection Test', false, 'Connection failed', error);
        } else {
          addResult('Connection Test', true, 'Connection successful');
        }
      } catch (error) {
        addResult('Connection Test', false, 'Connection error', error);
      }

      // Test 4: Authentication test
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'jumajo8@furman.edu',
          password: 'password123'
        });
        
        if (error) {
          addResult('Authentication Test', false, 'Authentication failed', {
            message: error.message,
            status: error.status,
            code: error.code
          });
        } else {
          addResult('Authentication Test', true, 'Authentication successful', {
            userId: data.user?.id,
            email: data.user?.email,
            emailConfirmed: data.user?.email_confirmed_at ? 'YES' : 'NO'
          });
        }
      } catch (error) {
        addResult('Authentication Test', false, 'Authentication error', error);
      }

      // Test 5: User profile access
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          if (userError) {
            addResult('User Profile Access', false, 'User profile access failed', userError);
          } else {
            addResult('User Profile Access', true, 'User profile access successful', userProfile);
          }
        } else {
          addResult('User Profile Access', false, 'No authenticated user');
        }
      } catch (error) {
        addResult('User Profile Access', false, 'User profile access error', error);
      }

    } catch (error) {
      addResult('Test Suite', false, 'Test suite error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Frontend Test</h1>
        
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? '✅' : '❌'} {result.test}
                </h3>
                <span className="text-sm text-gray-500">{result.timestamp}</span>
              </div>
              <p className={`${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
              {result.data && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Run Tests" to test Supabase connection</li>
            <li>Check the results above</li>
            <li>If authentication fails, check the error details</li>
            <li>Go to <a href="/student/login" className="text-blue-600 underline">Student Login</a> and try signing in</li>
            <li>Open browser console (F12) to see detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
