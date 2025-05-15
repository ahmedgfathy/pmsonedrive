"use client";

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
}

interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface UploadStatus {
  type: 'success' | 'error';
  message: string;
  progress?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalStorage] = useState(5 * 1024 * 1024 * 1024); // 5GB
  const [usedStorage, setUsedStorage] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);

  useEffect(() => {
    // Get user from localStorage (set during login)
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/'); // Redirect to login if no user data
      return;
    }
    setUser(JSON.parse(userData));
    fetchFiles(); // Fetch user's files
  }, [router]);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setUsedStorage(data.totalSize || 0);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus({ 
      type: 'success', 
      message: 'Uploading files...', 
      progress: 0 
    });

    try {
      // Check file size limits before uploading
      const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
      const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
      if (totalSize + usedStorage > maxSize) {
        throw new Error('Storage limit exceeded. Please free up some space first.');
      }

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          throw new Error(data.errors.map((e: any) => `${e.fileName}: ${e.error}`).join('\n'));
        }
        throw new Error(data.error || 'Upload failed');
      }

      // Update files list and storage info
      setFiles(prev => [...prev, ...data.files]);
      setUsedStorage(data.totalSize || 0);
      setUploadProgress(100);

      // Show success message
      setUploadStatus({ 
        type: 'success', 
        message: 'Files uploaded successfully!' 
      });
      fetchFiles(); // Refresh file list
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Failed to upload files. Please try again.' 
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Clear the file input
      event.target.value = '';
    }
  }, [usedStorage]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const usedStoragePercentage = (usedStorage / totalStorage) * 100;
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Success Message Component
  const StatusMessage = ({ status }: { status: UploadStatus }) => {
    const bgColor = status.type === 'success' ? 'bg-green-100' : 'bg-red-100';
    const textColor = status.type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = status.type === 'success' ? 'border-green-200' : 'border-red-200';
    const iconColor = status.type === 'success' ? 'text-green-400' : 'text-red-400';

    useEffect(() => {
      if (status.type === 'success') {
        const timer = setTimeout(() => {
          setUploadStatus(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }, [status]);

    return (
      <div className={`fixed bottom-4 right-4 flex items-center p-4 mb-4 rounded-lg border ${bgColor} ${borderColor} transition-all duration-500 ease-in-out transform translate-y-0`}>
        <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 mr-3">
          {status.type === 'success' ? (
            <svg className={`w-5 h-5 ${iconColor}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
            </svg>
          ) : (
            <svg className={`w-5 h-5 ${iconColor}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
            </svg>
          )}
        </div>
        <div className={`text-sm font-medium ${textColor}`}>
          {status.message}
          {status.progress !== undefined && (
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Company Logo"
                width={40}
                height={40}
                className="mr-4"
              />
              <span className="font-semibold text-xl text-blue-600">PMS OneDrive</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Access */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Access</h3>
                <div className="mt-4 space-y-4">
                  <label className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 cursor-pointer">
                    <Image src="/upload.svg" alt="Upload" width={24} height={24} />
                    <span>Upload Files</span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  <button className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
                    <Image src="/file.svg" alt="Recent" width={24} height={24} />
                    <span>Recent Files</span>
                  </button>
                  <button className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
                    <Image src="/globe.svg" alt="Shared" width={24} height={24} />
                    <span>Shared with Me</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Storage</h3>
                <div className="mt-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          Used Space: {formatFileSize(usedStorage)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          {usedStoragePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div
                        style={{ width: `${usedStoragePercentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(totalStorage - usedStorage)} available of {formatFileSize(totalStorage)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <div className="mt-4">
                  {files.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {files.slice(0, 5).map((file) => (
                        <li key={file.id} className="py-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <Image src="/file.svg" alt="File" width={20} height={20} className="mr-2" />
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Your Files</h3>
            </div>
            {uploading && (
              <div className="px-4 py-3 bg-blue-50">
                <div className="flex items-center">
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-blue-700">{uploadProgress}%</span>
                </div>
              </div>
            )}
            <div className="border-t border-gray-200">
              {files.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {files.map((file) => (
                    <li key={file.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <Image src="/file.svg" alt="File" width={24} height={24} className="mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Image src="/download.svg" alt="Download" width={20} height={20} />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Image src="/trash.svg" alt="Delete" width={20} height={20} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-500">No files uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {uploadStatus && <StatusMessage status={uploadStatus} />}
    </div>
  );
}
