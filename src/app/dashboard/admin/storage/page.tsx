'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatBytes } from '@/lib/utils/format';

interface UserStorageStats {
  userId: string;
  name: string | null;
  email: string;
  employeeId: string;
  usedStorage: number;
  quota: number;
  usagePercentage: number;
  fileCount: number;
  oldFiles: number;
  lastActive: string | null;
}

interface SystemStorageStats {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  utilizationPercentage: number;
  totalUsers: number;
  activeUsers: number;
}

export default function StorageManagement() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStorageStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newQuota, setNewQuota] = useState<string>('');
  const [quotaError, setQuotaError] = useState<string>('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const error = await res.json();
          console.error('Admin check failed:', error);
          router.push('/dashboard');
          return;
        }

        const data = await res.json();
        if (!data.isAdmin) {
          router.push('/dashboard');
          return;
        }

        fetchStorageStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      }
    };

    checkAdminStatus();
  }, [router]);

  const fetchStorageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/storage', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch storage statistics');
      }

      const data = await response.json();
      setUserStats(data.userStats);
      setSystemStats(data.systemStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching storage stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuota = async (userId: string) => {
    if (!newQuota) {
      setQuotaError('Please enter a quota value');
      return;
    }

    try {
      setQuotaError('');
      const quotaInBytes = parseInt(newQuota) * 1024 * 1024 * 1024; // Convert GB to bytes

      const response = await fetch(`/api/users/${userId}/quota`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quota: quotaInBytes }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update quota');
      }

      await fetchStorageStats();
      setNewQuota('');
      setSelectedUserId(null);
    } catch (err) {
      setQuotaError(err instanceof Error ? err.message : 'Failed to update quota');
      console.error('Error updating quota:', err);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>;
  }

  if (error) {
    return <div className="p-4">
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    </div>;
  }

  const handleQuotaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuotaError('');
    setNewQuota(e.target.value);
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Storage Management</h1>
        <button
          onClick={() => router.push('/dashboard/admin')}
          className="text-blue-600 hover:text-blue-700"
        >
          Back to Admin Dashboard
        </button>
      </div>

      {systemStats && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-medium mb-1">Total Storage</h3>
              <p className="text-2xl">{formatBytes(systemStats.totalStorage)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-medium mb-1">Available</h3>
              <p className="text-2xl">{formatBytes(systemStats.availableStorage)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <h3 className="font-medium mb-1">Usage</h3>
              <p className="text-2xl">{systemStats.utilizationPercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className={`h-full rounded-full ${
                  systemStats.utilizationPercentage > 90 
                    ? 'bg-red-500' 
                    : systemStats.utilizationPercentage > 75 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.utilizationPercentage}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Active Users: {systemStats.activeUsers} of {systemStats.totalUsers}
          </p>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userStats.map((user) => (
              <tr key={user.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{user.name || user.employeeId}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div>{formatBytes(user.usedStorage)}</div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          user.usagePercentage > 90 
                            ? 'bg-red-500' 
                            : user.usagePercentage > 75 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${user.usagePercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">{user.usagePercentage.toFixed(1)}%</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {selectedUserId === user.userId ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="1024"
                          className="w-20 px-2 py-1 border rounded"
                          value={newQuota}
                          onChange={handleQuotaInputChange}
                          placeholder="GB"
                        />
                        <span className="text-sm text-gray-500">GB</span>
                      </div>
                      {quotaError && <p className="text-xs text-red-500 mt-1">{quotaError}</p>}
                      <div className="mt-2 space-x-2">
                        <button
                          onClick={() => handleUpdateQuota(user.userId)}
                          className="px-2 py-1 bg-green-500 text-white text-sm rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUserId(null);
                            setNewQuota('');
                            setQuotaError('');
                          }}
                          className="px-2 py-1 bg-gray-500 text-white text-sm rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>{formatBytes(user.quota)}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div>{user.fileCount} files</div>
                    {user.oldFiles > 0 && (
                      <div className="text-xs text-amber-600">
                        {user.oldFiles} old files
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {selectedUserId !== user.userId && (
                    <button
                                            onClick={() => setSelectedUserId(user.userId)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit Quota
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
