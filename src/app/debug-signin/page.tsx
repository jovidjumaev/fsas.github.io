'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function DebugSignIn() {
  const [email, setEmail] = useState('jumajo8@furman.edu');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'student' | 'professor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { signIn, user, userRole, loading } = useAuth();

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🧪 DEBUG: Starting sign-in test...');
      const result = await signIn(email, password, role);
      setResult(result);
      console.log('🧪 DEBUG: Sign-in result:', result);
    } catch (error: any) {
      console.error('🧪 DEBUG: Sign-in error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Sign-In</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Sign-In</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'student' | 'professor')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
              
              <Button
                onClick={handleTest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Test Sign-In'}
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            
            <div className="space-y-4">
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}
              </div>
              <div>
                <strong>User Role:</strong> {userRole || 'None'}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id || 'N/A'}
              </div>
              <div>
                <strong>User Email:</strong> {user?.email || 'N/A'}
              </div>
            </div>
            
            {result && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Last Result:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Open browser console (F12)</li>
            <li>Click "Test Sign-In" button</li>
            <li>Check console logs for detailed debugging info</li>
            <li>Look for any error messages</li>
            <li>Check if the user state updates correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
