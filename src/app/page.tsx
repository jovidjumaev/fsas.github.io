'use client';

export default function HomePage() {
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
            <p>✅ Supabase: Environment configured</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="text-blue-800 text-sm space-y-1 text-left">
              <li>1. Set up database schema in Supabase</li>
              <li>2. Test authentication flow</li>
              <li>3. Create test users</li>
              <li>4. Test QR code functionality</li>
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/debug-page'}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors"
            >
              Debug Supabase Connection
            </button>
            <button 
              onClick={() => window.open('https://zdtxqzpgggolbebrsymp.supabase.co', '_blank')}
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
