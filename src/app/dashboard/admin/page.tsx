"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();

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
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/dashboard');
      }
    };

    checkAdminStatus();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Company Logo"
                width={150}
                height={150}
                className="mr-4"
                priority
                style={{ objectFit: 'contain', height: '60px' }}
              />
              <span className="text-3xl font-bold text-gray-900">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management Card */}
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-lg rounded-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <Image src="/users.svg" alt="Users" width={24} height={24} />
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">User Management</h3>
                  </div>
                </div>
              <p className="text-gray-600 mb-4">
                Manage users, reset passwords, set storage quotas, and monitor user activity.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/admin/users')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Manage Users
                </button>
              </div>
            </div>
          </div>

          {/* Storage Management Card */}
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-lg rounded-lg transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <Image src="/storage.svg" alt="Storage" width={24} height={24} />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Storage Management</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Monitor storage usage, manage quotas, and optimize space allocation across the system.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/admin/storage')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  View Storage
                </button>
              </div>
            </div>
          </div>

          {/* Activity Monitoring Card */}
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-lg rounded-lg transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <Image src="/activity.svg" alt="Activity" width={24} height={24} />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">Activity Monitoring</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Track user activities, file operations, and system events in real-time.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/admin/activity')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  View Activity
                </button>
              </div>
            </div>
          </div>

          {/* System Settings Card */}
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-lg rounded-lg transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <Image src="/settings.svg" alt="Settings" width={24} height={24} />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">System Settings</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Configure system-wide settings, security policies, and default preferences.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/admin/settings')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Configure Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
