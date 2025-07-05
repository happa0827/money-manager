// components/SignupForm.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // パスワード確認
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, name || undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "アカウント作成に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <h2>アカウント作成</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label htmlFor="name">名前（任意）</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="お名前"
          />
        </div>

        <div>
          <label htmlFor="email">メールアドレス *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="password">パスワード *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="8文字以上のパスワード"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">パスワード確認 *</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="パスワードを再入力"
          />
        </div>

        {error && <div style={{ color: "red", fontSize: "14px" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "アカウント作成中..." : "アカウント作成"}
        </button>
      </form>
    </div>
  );
};
