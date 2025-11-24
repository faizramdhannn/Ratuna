'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Registrasi gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="w-full max-w-md p-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-black text-center">
            <div className="inline-block p-4 bg-green-500 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Registrasi Berhasil!</h2>
            <p className="text-gray-600 mb-2">Akun Anda telah dibuat.</p>
            <p className="text-gray-600 mb-6">Menunggu approval dari Super Admin...</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12">
      <div className="w-full max-w-md p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-4 border-black">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-black rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Daftar Akun</h1>
            <p className="text-gray-600">Buat akun baru untuk sistem kasir</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                placeholder="Masukkan nama lengkap"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                placeholder="Pilih username"
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
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Konfirmasi Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
                placeholder="Ketik ulang password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-bold text-black hover:underline">
                Login di sini
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Setelah registrasi, akun Anda akan menunggu approval dari Super Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}