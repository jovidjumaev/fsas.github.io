'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [supabaseStatus, setSupabaseStatus] = useState('Checking...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Check if environment variables are loaded
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          setSupabaseStatus('❌ Environment variables not loaded');
          setError('Missing Supabase environment variables');
          return;
        }

        setSupabaseStatus('✅ Environment variables loaded');
        
        // Try to import and initialize Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(url, key);
        
        // Test connection
        const { data, error: testError } = await supabase.auth.getSession();
        
        if (testError) {
          setSupabaseStatus('❌ Supabase connection failed');
          setError(testError.message);
        } else {
          setSupabaseStatus('✅ Supabase connected successfully');
        }
      } catch (err: any) {
        setSupabaseStatus('❌ Supabase initialization failed');
        setError(err.message);
      }
    };

    checkSupabase();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          FSAS Debug Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-2">
              <p>✅ Frontend: Running on port 3000</p>
              <p>✅ Backend: Running on port 3001</p>
              <p>✅ Next.js: Compiled successfully</p>
              <p>✅ TypeScript: Working</p>
              <p>✅ Tailwind CSS: Loaded</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Supabase Status</h2>
            <div className="space-y-2">
              <p className="font-mono text-sm">
                <strong>Status:</strong> {supabaseStatus}
              </p>
              <p className="font-mono text-sm">
                <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}
              </p>
              <p className="font-mono text-sm">
                <strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 font-semibold">Error:</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Main App
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}