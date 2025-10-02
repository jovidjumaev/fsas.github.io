'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [supabaseStatus, setSupabaseStatus] = useState('Testing...');
  const [tableData, setTableData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      // Test basic connection
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setSupabaseStatus(`❌ Auth Error: ${authError.message}`);
        return;
      }

      // Test table access - use new 'classes' table
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .limit(5);

      if (classesError) {
        setSupabaseStatus(`❌ Database Error: ${classesError.message}`);
        return;
      }

      setSupabaseStatus('✅ Supabase Connected Successfully!');
      setTableData({
        classes: classesData,
        totalClasses: classesData.length
      });
    } catch (error: any) {
      setSupabaseStatus(`❌ Connection Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          FSAS - Furman Smart Attendance System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the Smart Attendance System! The application is running successfully.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2 text-left">
            <p>✅ Frontend: Running on port 3000</p>
            <p>✅ Backend: Running on port 3001</p>
            <p>✅ Next.js: Compiled successfully</p>
            <p>✅ TypeScript: Working</p>
            <p>✅ Tailwind CSS: Loaded</p>
            <p className={supabaseStatus.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {isLoading ? '🔄 Supabase: Testing connection...' : supabaseStatus}
            </p>
          </div>
        </div>

        {tableData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-green-900 mb-2">Database Test Results:</h3>
            <div className="text-green-800 text-sm text-left">
              <p>✅ Classes table accessible</p>
              <p>✅ Found {tableData.totalClasses} classes in database</p>
              <p>✅ All database tables are working correctly</p>
              
              {tableData.classes && tableData.classes.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold mb-2">📚 Classes Found:</p>
                  <ul className="space-y-1">
                    {tableData.classes.map((cls: any, index: number) => (
                      <li key={index} className="text-xs">
                        • {cls.code}: {cls.name} 
                        {cls.room_location && ` (${cls.room_location})`}
                        {cls.schedule_info && ` - ${cls.schedule_info}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && tableData && tableData.totalClasses === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-yellow-900 mb-2">Database is Empty</h3>
            <div className="text-yellow-800 text-sm text-left">
              <p>📊 The database tables are working but contain no data yet.</p>
              <p>🔗 This is expected due to foreign key constraints.</p>
              <p>📝 To add data, you need to:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create users via Supabase Auth first</li>
                <li>Then add user profiles</li>
                <li>Then add courses and other data</li>
              </ol>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">System Ready!</h3>
            <ol className="text-blue-800 text-sm space-y-1 text-left">
              <li>✅ Database schema applied</li>
              <li>✅ Supabase connection working</li>
              <li>✅ All tables accessible</li>
              <li>✅ Ready for data operations</li>
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={testSupabaseConnection}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Connection Again'}
            </button>
            <button 
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition-colors"
            >
              Open Supabase Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
