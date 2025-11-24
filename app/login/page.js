'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-black">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-black rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Ratuna Cashier</h1>
            <p className="text-gray-600">Silakan login untuk melanjutkan</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                placeholder="Masukkan username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                placeholder="Masukkan password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Belum punya akun?{' '}
              <Link href="/register" className="font-bold text-black hover:underline">
                Daftar di sini
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-bold">Demo Account:</p>
              <p>Username: <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ratuna</span></p>
              <p>Password: <span className="font-mono bg-gray-100 px-2 py-1 rounded">ratuna123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}