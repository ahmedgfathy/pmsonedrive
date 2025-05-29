"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      
      // Refresh activity data
      fetchUserActivity();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error restoring file');
    }
  };

  if (loading) return <div className="p-4">Loading activity...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!activity) return <div className="p-4">No activity found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activity Log for {activity.userName}</h1>
        <button
          onClick={() => router.push('/dashboard/admin/users')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Back to Users
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Activity Log */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">File Activity</h2>
          <div className="overflow-y-auto max-h-96">
            {activity.fileActivities.map((activity) => (
              <div key={activity.id} className="mb-4 p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                      {activity.sharedWith && ` with ${activity.sharedWith}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">IP: {activity.ipAddress}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deleted Files */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Deleted Files</h2>
          <div className="overflow-y-auto max-h-96">
            {activity.deletedFiles.map((file) => (
              <div key={file.id} className="mb-4 p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-gray-500">
                      Deleted on: {new Date(file.deletedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Size: {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreFile(file.id)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded"
                  >
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}
