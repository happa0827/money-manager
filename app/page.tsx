'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, Calendar, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ja } from 'date-fns/locale';

// 追加: Transaction型を定義
type Transaction = {
  id: number;
  type: 'income' | 'expense'; // 'income'または'expense'のいずれか
  amount: number;
  description: string;
  date: string;
  formattedDate: string; // 追加: formattedDateプロパティを定義
};

const MoneyManager = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]); // Transaction型を指定
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  // 追加: ダークモード状態の管理
  const [darkMode, setDarkMode] = useState(false);

  // ページ読み込み時にローカルストレージからデータとテーマ設定を取得
  useEffect(() => {
    try {
      const savedBalance = localStorage.getItem('balance');
      const savedTransactions = localStorage.getItem('transactions');
      const savedTheme = localStorage.getItem('darkMode');
      
      if (savedBalance) {
        setBalance(parseFloat(savedBalance));
      }
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }
      if (savedTheme) {
        setDarkMode(savedTheme === 'true');
      }
    } catch (error) {
      console.error('データの読み込み中にエラーが発生しました:', error);
      // エラーが発生した場合は初期状態にリセット
      setBalance(0);
      setTransactions([]);
    }
  }, []);

  // データが更新されたらローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem('balance', balance.toString());
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('データの保存中にエラーが発生しました:', error);
    }
  }, [balance, transactions]);

  // ダークモード設定が変更されたら保存
  useEffect(() => {
    try {
      localStorage.setItem('darkMode', darkMode.toString());
      // HTML要素にクラスを追加/削除
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('テーマ設定の保存中にエラーが発生しました:', error);
    }
  }, [darkMode]);

  const handleTransaction = (type: 'income' | 'expense') => {
    const newAmount = parseFloat(amount);
    if (!amount || isNaN(newAmount)) return;
    
    const newTransaction = {
      id: Date.now(),
      type,
      amount: newAmount,
      description: description || (type === 'income' ? '入金' : '出金'),
      date: transactionDate.toISOString().split('T')[0], // 保存はISO形式
      formattedDate: formatDate(transactionDate.toISOString())
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setBalance(prevBalance => 
      type === 'income' ? prevBalance + newAmount : prevBalance - newAmount
    );
    setAmount('');
    setDescription('');
  };

  // 日付をフォーマットする関数（YYYY-MM-DD → 日本語表記）
// 日付をフォーマットする関数（YYYY-MM-DD → 日本語表記 + 曜日）
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short' // ← ここで曜日を追加
    });
    return formatted; // 例: 2025年4月22日(火)
  } catch (error) {
    console.error('日付のフォーマット中にエラーが発生しました:', error);
    return dateString;
  }
};


const handleReset = () => {
  if (window.confirm('全てのデータをリセットしてもよろしいですか？')) {
    setBalance(0);
    setTransactions([]);

    try {
      localStorage.removeItem('balance');
      localStorage.removeItem('transactions');
    } catch (error) {
      console.error('データのリセット中にエラーが発生しました:', error);
    }

    // 入力フィールドの状態は維持
    // 日付は Date 型で初期化
    setTransactionDate(new Date());
  }
};


  // データをエクスポートする関数
  const handleExport = () => {
    try {
      const data = {
        balance: balance,
        transactions: transactions,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `money-manager-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('データのエクスポート中にエラーが発生しました:', error);
      alert('エクスポート中にエラーが発生しました');
    }
  };

  // テーマを切り替える関数
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <div className={`max-w-2xl mx-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader className="relative">
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
          <CardTitle className="text-2xl text-center">家計簿アプリ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <div className="text-3xl font-bold flex items-center justify-center">
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
                className={`flex-1 p-2 border rounded ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="説明"
                className={`flex-1 p-2 border rounded ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            
            <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 flex-1 p-2 border rounded ${
  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
}`}>
  <Calendar className="w-4 h-4 text-gray-500" />
  <DatePicker
  selected={transactionDate}
  onChange={(date: Date | null) => {
    if (date) setTransactionDate(date);
  }}
  dateFormat="yyyy/MM/dd (eee)" // 曜日付き
  locale={ja}
  className={`w-full p-2 rounded-md border outline-none transition-colors
    ${darkMode
      ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400'
      : 'bg-white text-black border-gray-300'}
  `}
/>
</div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleTransaction('income')}
                className="flex-1 bg-green-500 text-white p-2 rounded flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                入金
              </button>
              <button
                onClick={() => handleTransaction('expense')}
                className="flex-1 bg-red-500 text-white p-2 rounded flex items-center justify-center gap-2"
              >
                <Minus className="w-4 h-4" />
                出金
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">取引履歴</h3>
              <div className="space-x-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  エクスポート
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  リセット
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className={`p-3 rounded flex justify-between items-center ${
                      transaction.type === 'income' 
                        ? darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100' 
                        : darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {transaction.formattedDate || formatDate(transaction.date)}
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'income' 
                        ? darkMode ? 'text-green-300' : 'text-green-600' 
                        : darkMode ? 'text-red-300' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}円
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  取引データがありません
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoneyManager;