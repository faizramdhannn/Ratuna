'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Crown, Shield, Briefcase } from 'lucide-react';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/check', { method: 'DELETE' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'superadmin': return <Crown className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'worker': return <Briefcase className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      superadmin: 'bg-purple-600',
      admin: 'bg-blue-600',
      worker: 'bg-green-600'
    };
    return colors[role] || 'bg-gray-600';
  };

  return (
    <nav className="bg-black text-white border-b-4 border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div>
            <h1 className="text-2xl font-bold">Ratuna Cashier</h1>
            <p className="text-sm text-gray-400">Sistem Manajemen Kasir</p>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}