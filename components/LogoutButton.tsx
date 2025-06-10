// components/LogoutButton.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('ログアウト失敗:', error);
    } finally {
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow transition"
    >
      <LogOut className="w-4 h-4" />
      ログアウト
    </button>
  );
}
