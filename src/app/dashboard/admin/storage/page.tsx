"use client";

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

        // If admin, fetch storage stats
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

  const handleQuotaInputChange = (value: string) => {
    setQuotaError('');
    setNewQuota(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/storage.svg" alt="Storage" width={32} height={32} className="mr-4" />
            <h1 className="text-2xl font-bold text-gray-900">Storage Management</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/admin')}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>

      {/* System Overview */}
      {systemStats && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800">Total Storage</h3>
              <p className="mt-2 text-2xl font-semibold text-blue-900">{formatBytes(systemStats.totalStorage)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800">Available Storage</h3>
              <p className="mt-2 text-2xl font-semibold text-green-900">{formatBytes(systemStats.availableStorage)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-800">System Utilization</h3>
              <p className="mt-2 text-2xl font-semibold text-purple-900">{systemStats.utilizationPercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
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
          <div className="mt-4 text-sm text-gray-600">
            <div>Active Users (Last 30 Days): {systemStats.activeUsers} of {systemStats.totalUsers}</div>
          </div>
        </div>
      )}

      {/* User Storage Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">User Storage Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quota</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userStats.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xl text-gray-600">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || user.employeeId}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{formatBytes(user.usedStorage)}</div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            user.usagePercentage > 90 
                              ? 'bg-red-500' 
                              : user.usagePercentage > 75 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${user.usagePercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{user.usagePercentage.toFixed(1)}%</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {selectedUserId === user.userId ? (
                      <div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="1"
                            max="1024"
                            className="w-20 px-2 py-1 border rounded-md text-sm"
                            value={newQuota}
                            onChange={(e) => handleQuotaInputChange(e.target.value)}
                            placeholder="GB"
                          />
                          <span className="text-sm text-gray-500">GB</span>
                        </div>
                        <div className="mt-1 flex space-x-2">
                          <button
                            onClick={() => handleUpdateQuota(user.userId)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(null);
                              setNewQuota('');
                              setQuotaError('');
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                        {quotaError && (
                          <div className="mt-1 text-xs text-red-500">{quotaError}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">{formatBytes(user.quota)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.fileCount} files</div>
                    {user.oldFiles > 0 && (
                      <div className="text-xs text-amber-600">
                        {user.oldFiles} files older than 90 days
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.lastActive 
                        ? new Date(user.lastActive).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {selectedUserId !== user.userId && (
                      <button
                        onClick={() => setSelectedUserId(user.userId)}
                        className="text-indigo-600 hover:text-indigo-900"
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
    </div>
  );
}
