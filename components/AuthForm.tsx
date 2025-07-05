"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const AuthForms = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // パスワード確認
        if (password !== confirmPassword) {
          setError("パスワードが一致しません");
          setLoading(false);
          return;
        }
        await signup(email, password, name || undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <button
          onClick={() => setIsLogin(true)}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            backgroundColor: isLogin ? "#007bff" : "#f8f9fa",
            color: isLogin ? "white" : "#333",
            border: "1px solid #dee2e6",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          ログイン
        </button>
        <button
          onClick={() => setIsLogin(false)}
          style={{
            padding: "10px 20px",
            backgroundColor: !isLogin ? "#007bff" : "#f8f9fa",
            color: !isLogin ? "white" : "#333",
            border: "1px solid #dee2e6",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          新規登録
        </button>
      </div>

      <h2>{isLogin ? "ログイン" : "アカウント作成"}</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        {!isLogin && (
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
        )}

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

        {!isLogin && (
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
        )}

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
          {loading ? "処理中..." : isLogin ? "ログイン" : "アカウント作成"}
        </button>
      </form>
    </div>
  );
};
