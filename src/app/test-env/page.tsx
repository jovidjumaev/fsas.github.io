'use client';

import { useEffect, useState } from 'react';

export default function TestEnv() {
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    setEnvVars({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING',
      nodeEnv: process.env.NODE_ENV,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Check if Supabase URL is correct</li>
            <li>Check if Supabase Key exists</li>
            <li>Go to <a href="/student/login" className="text-blue-600 underline">Student Login</a></li>
            <li>Open browser console (F12)</li>
            <li>Try to sign in and check console logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
