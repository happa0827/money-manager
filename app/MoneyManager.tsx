"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, DollarSign, Calendar, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from "date-fns/locale";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import LogoutButton from "@/components/LogoutButton";
import { useRouter } from "next/navigation";

export type Transaction = {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  formattedDate?: string;
};

const MoneyManager = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const { user } = useAuth();
  const router = useRouter();

  const ViewSummaryButton = ({
    transactions,
  }: {
    transactions: Transaction[];
  }) => {
    const handleClick = () => {
      const encoded = encodeURIComponent(JSON.stringify(transactions));
      router.push(`/monthly-summary?data=${encoded}`);
    };

    return (
      <button
        onClick={handleClick}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        月別収支を見る
      </button>
    );
  };

  // API呼び出し用のヘルパー関数
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
  };

  // ページ読み込み時にAPIから取引データを取得
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        console.log("ユーザーがログインしていません");
        return;
      }

      console.log("現在のユーザーID:", user.id);
      setIsLoading(true);

      try {
        const data = await apiCall(`/api/transactions?userId=${user.id}`);
        console.log("取得したデータ:", data);

        setTransactions(data);

        const totalBalance = data.reduce(
          (sum: number, transaction: Transaction) => {
            return transaction.type === "income"
              ? sum + transaction.amount
              : sum - transaction.amount;
          },
          0,
        );
        setBalance(totalBalance);
      } catch (error) {
        console.error("取引データの取得中にエラーが発生しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  // 日付をフォーマットする関数（YYYY-MM-DD → 日本語表記 + 曜日）
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
      return formatted; // 例: 2025年4月22日(火)
    } catch (error) {
      console.error("日付のフォーマット中にエラーが発生しました:", error);
      return dateString;
    }
  };

  const handleTransaction = async (type: "income" | "expense") => {
    if (!user) return; // ユーザーがログインしていない場合は何もしない

    const newAmount = parseFloat(amount);
    if (!amount || isNaN(newAmount)) return;

    const formattedDate = formatDate(transactionDate.toISOString());

    const newTransaction = {
      type,
      amount: newAmount,
      description: description || (type === "income" ? "入金" : "出金"),
      date: transactionDate.toISOString().split("T")[0],
      formattedDate: formattedDate,
      userId: user.id,
    };

    setIsLoading(true);

    try {
      const data = await apiCall("/api/transactions", {
        method: "POST",
        body: JSON.stringify(newTransaction),
      });

      console.log("取引が保存されました:", data);

      const savedTransaction = {
        id: data.id,
        type,
        amount: newAmount,
        description: description || (type === "income" ? "入金" : "出金"),
        date: transactionDate.toISOString().split("T")[0],
        formattedDate: formattedDate,
      };

      setTransactions((prev) => [savedTransaction, ...prev]);
      setBalance((prev) =>
        type === "income" ? prev + newAmount : prev - newAmount,
      );
      setAmount("");
      setDescription("");
    } catch (error) {
      console.error("取引データの保存中にエラーが発生しました:", error);
      alert("取引の保存中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!user) return; // ユーザーがログインしていない場合は何もしない

    if (window.confirm("全てのデータをリセットしてもよろしいですか？")) {
      setIsLoading(true);

      try {
        await apiCall(`/api/transactions?userId=${user.id}`, {
          method: "DELETE",
        });

        setBalance(0);
        setTransactions([]);
      } catch (error) {
        console.error("データのリセット中にエラーが発生しました:", error);
        alert("データのリセット中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLoadFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        if (!json) {
          console.error("ファイルの読み込みに失敗しました。内容が空です。");
          return;
        }

        const loadedTransactions: Transaction[] = JSON.parse(json);
        console.log("読み込んだ取引データ:", loadedTransactions);

        setIsLoading(true);

        // 各取引をAPIに送信
        const savedTransactions = [];
        for (const transaction of loadedTransactions) {
          const transactionData = {
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            formattedDate:
              transaction.formattedDate || formatDate(transaction.date),
            userId: user.id,
          };

          const data = await apiCall("/api/transactions", {
            method: "POST",
            body: JSON.stringify(transactionData),
          });

          savedTransactions.push({
            id: data.id,
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            formattedDate:
              transaction.formattedDate || formatDate(transaction.date),
          });
        }

        console.log(
          "取引データがデータベースに保存されました:",
          savedTransactions,
        );

        // 取引データを状態に反映
        setTransactions(savedTransactions);
        const total = savedTransactions.reduce((sum, t) => {
          return t.type === "income" ? sum + t.amount : sum - t.amount;
        }, 0);
        setBalance(total);
      } catch (err) {
        console.error("ファイル読み込みエラー:", err);
        alert("ファイルの形式が正しくありません。");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = (err) => {
      console.error("FileReaderエラー:", err);
      alert("ファイルの読み込み中にエラーが発生しました。");
    };

    reader.readAsText(file);
  };

  const handleSaveToFile = () => {
    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className={`${darkMode ? "bg-gray-900" : "bg-white"} min-h-screen`}>
      <Card className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
        <CardHeader className="relative">
          {/* 左上にログアウトボタン */}
          <div className="absolute left-4 top-4">
            <LogoutButton />
          </div>
          <button
            onClick={toggleTheme}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="テーマ切り替え"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <CardTitle
            className={`text-2xl text-center ${darkMode ? "text-white" : "text-black"}`}
          >
            家計簿アプリ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <div
              className={`text-3xl font-bold flex items-center justify-center ${
                darkMode ? "text-white" : "text-black"
              }`}
            >
              <DollarSign className="w-8 h-8" />
              <span>{balance.toLocaleString()}円</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="金額"
                disabled={isLoading}
                className={`flex-1 p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                } ${isLoading ? "opacity-50" : ""}`}
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="説明"
                disabled={isLoading}
                className={`flex-1 p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                } ${isLoading ? "opacity-50" : ""}`}
              />
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 flex-1 p-2 border rounded ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <DatePicker
                  selected={transactionDate}
                  onChange={(date: Date | null) => {
                    if (date) setTransactionDate(date);
                  }}
                  dateFormat="yyyy/MM/dd (eee)"
                  locale={ja}
                  disabled={isLoading}
                  className={`w-full p-2 rounded-md border outline-none transition-colors
                    ${
                      darkMode
                        ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                        : "bg-white text-black border-gray-300"
                    }
                    ${isLoading ? "opacity-50" : ""}
                  `}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleTransaction("income")}
                disabled={isLoading}
                className={`flex-1 bg-green-500 text-white p-2 rounded flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Plus className="w-5 h-5" />
                収入
              </button>
              <button
                onClick={() => handleTransaction("expense")}
                disabled={isLoading}
                className={`flex-1 bg-red-500 text-white p-2 rounded flex items-center justify-center gap-2 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Minus className="w-5 h-5" />
                支出
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className={`text-red-600 p-2 hover:bg-red-100 rounded ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                データをリセット
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      <ViewSummaryButton transactions={transactions} />

      {/* ローディング表示 */}
      {isLoading && (
        <div className="text-center mt-4">
          <p className={`${darkMode ? "text-white" : "text-black"}`}>
            処理中...
          </p>
        </div>
      )}

      {/* 取引カードの表示 */}
      <div className="space-y-4 mt-6">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-400">取引がまだありません</p>
        ) : (
          transactions.map((t) => (
            <Card
              key={t.id}
              className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}
            >
              <CardHeader>
                <CardTitle className={darkMode ? "text-white" : "text-black"}>
                  {t.description}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {t.formattedDate || formatDate(t.date)}
                </p>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-lg font-bold ${
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {t.amount.toLocaleString()}円
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={handleSaveToFile}
          disabled={isLoading}
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          JSONで保存
        </button>

        <label
          className={`bg-yellow-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-yellow-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          JSON読み込み
          <input
            type="file"
            accept=".json"
            onChange={handleLoadFromFile}
            disabled={isLoading}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default MoneyManager;
