'use client';

import { useAuth } from '@/components/mock-providers';

export default function TestPage() {
  const { user, isAuthenticated, isLoading, error } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-4">
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p><strong>Error:</strong> {error ? JSON.stringify(error, null, 2) : 'None'}</p>
      </div>
    </div>
  );
}
