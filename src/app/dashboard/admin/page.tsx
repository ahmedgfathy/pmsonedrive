"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch users');
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user and all their files?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      alert('Failed to delete user');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/files/${fileId}?admin=1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => ({
        ...u,
        files: u.files.filter((f: any) => f.id !== fileId),
      })));
    } else {
      alert('Failed to delete file');
    }
  };

  if (loading) return <div>Loading users...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard - User Management</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Employee ID</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Admin</th>
            <th className="border px-4 py-2">Files</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.employeeId}</td>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.isAdmin ? 'Yes' : 'No'}</td>
              <td className="border px-4 py-2">
                {user.files.length > 0 ? (
                  <ul className="list-disc ml-4">
                    {user.files.map((file: any) => (
                      <li key={file.id}>
                        {file.name} ({(file.size / 1024).toFixed(1)} KB, {file.type})
                        <button
                          className="ml-2 text-red-600 hover:underline"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>No files</span>
                )}
              </td>
              <td className="border px-4 py-2">
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.isAdmin}
                >
                  Delete User
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
