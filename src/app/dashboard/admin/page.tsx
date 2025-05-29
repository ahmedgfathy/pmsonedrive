"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    
    // Check if user is admin
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <Image src="/users.svg" alt="Users" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Manage users, reset passwords, set storage quotas, and monitor user activity.
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Users
          </button>
        </div>

        {/* File Management Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">File Management</h2>
            <Image src="/file.svg" alt="Files" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Monitor file activities, restore deleted files, and manage sharing permissions.
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/files')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Files
          </button>
        </div>

        {/* System Settings Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            <Image src="/settings.svg" alt="Settings" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Configure global settings, default quotas, and security policies.
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/settings')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            System Settings
          </button>
        </div>

        {/* Activity Monitoring Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Activity Monitoring</h2>
            <Image src="/activity.svg" alt="Activity" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Monitor system-wide activity, track file sharing, and view IP access logs.
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/activity')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            View Activity
          </button>
        </div>

        {/* Storage Management Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Storage Management</h2>
            <Image src="/storage.svg" alt="Storage" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Monitor storage usage, manage quotas, and optimize space utilization.
          </p>
          <button
            onClick={() => router.push('/dashboard/admin/storage')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Manage Storage
          </button>
        </div>

        {/* Return to Dashboard */}
        <div className="bg-gray-100 shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Back to Dashboard</h2>
            <Image src="/back.svg" alt="Back" width={24} height={24} />
          </div>
          <p className="text-gray-600 mb-4">
            Return to your user dashboard to manage your own files.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            User Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
