// components/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err) {
      alert('ログイン失敗');
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">ログイン</h2>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <button
        onClick={handleLogin}
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        ログイン
      </button>
    </div>
  );
};

export default LoginForm;
