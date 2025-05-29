"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface FileActivity {
  id: string;
  fileName: string;
  action: 'upload' | 'download' | 'share' | 'delete';
  timestamp: string;
  ipAddress: string;
  sharedWith?: string;
  restored?: boolean;
}

interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  employeeId: string;
  fileActivities: FileActivity[];
  deletedFiles: {
    id: string;
    fileName: string;
    deletedAt: string;
    size: number;
  }[];
}

export default function UserActivityPage({ params }: { params: { userId: string } }) {
  const router = useRouter();
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserActivity();
  }, []);

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/users/${params.userId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }

      const data = await response.json();
      setActivity(data);
      setLoading(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading activity');
      setLoading(false);
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/admin/files/${fileId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to restore file');
      
      fetchUserActivity();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error restoring file');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image src="/logo.svg" alt="Company Logo" width={60} height={60} className="mr-4" />
                <span className="font-semibold text-xl text-blue-600">PMDrive Admin</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image src="/logo.svg" alt="Company Logo" width={60} height={60} className="mr-4" />
                <span className="font-semibold text-xl text-blue-600">PMDrive Admin</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image src="/logo.svg" alt="Company Logo" width={60} height={60} className="mr-4" />
                <span className="font-semibold text-xl text-blue-600">PMDrive Admin</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">No activity found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/logo.svg" alt="Company Logo" width={60} height={60} className="mr-4" />
              <span className="font-semibold text-xl text-blue-600">PMDrive Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin/users')}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back to Users
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">User Activity Details</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">{activity.email}</p>
                </div>
                <div className="flex items-center">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{activity.userName}</p>
                    <p className="text-xs text-gray-500">ID: {activity.employeeId}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xl text-gray-600">{activity.userName.charAt(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Activity Log */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">File Activity</h2>
              <div className="overflow-y-auto max-h-[32rem]">
                {activity.fileActivities.map((activity) => (
                  <div key={activity.id} className="mb-4 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{activity.fileName}</p>
                        <p className="text-sm text-gray-600">
                          {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                          {activity.sharedWith && ` with ${activity.sharedWith}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          IP: {activity.ipAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {activity.fileActivities.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No file activity recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Deleted Files */}
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Deleted Files</h2>
              <div className="overflow-y-auto max-h-[32rem]">
                {activity.deletedFiles.map((file) => (
                  <div key={file.id} className="mb-4 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{file.fileName}</p>
                        <p className="text-sm text-gray-600">
                          Deleted on: {new Date(file.deletedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Size: {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRestoreFile(file.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
                {activity.deletedFiles.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No deleted files</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatBytes(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
