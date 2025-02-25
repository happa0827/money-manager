'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0] // YYYY-MM-DD形式
  );

  // ページ読み込み時にローカルストレージからデータを取得
  useEffect(() => {
    try {
      const savedBalance = localStorage.getItem('balance');
      const savedTransactions = localStorage.getItem('transactions');
      
      if (savedBalance) {
        setBalance(parseFloat(savedBalance));
      }
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
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

  const handleTransaction = (type: 'income' | 'expense') => {
    const newAmount = parseFloat(amount);
    if (!amount || isNaN(newAmount)) return;
    
    const newTransaction = {
      id: Date.now(),
      type,
      amount: newAmount,
      description: description || (type === 'income' ? '入金' : '出金'),
      date: transactionDate,
      formattedDate: formatDate(transactionDate)
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setBalance(prevBalance => 
      type === 'income' ? prevBalance + newAmount : prevBalance - newAmount
    );
    setAmount('');
    setDescription('');
  };

  // 日付をフォーマットする関数（YYYY-MM-DD → 日本語表記）
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return dateString;
    }
  };

  // データをリセットする関数
  const handleReset = () => {
    if (window.confirm('全てのデータをリセットしてもよろしいですか？')) {
      // ステートを初期化
      setBalance(0);
      setTransactions([]);
      
      // ローカルストレージをクリア
      try {
        localStorage.removeItem('balance');
        localStorage.removeItem('transactions');
      } catch (error) {
        console.error('データのリセット中にエラーが発生しました:', error);
      }
      
      // 入力フィールドの状態は維持
      // 日付は現在の日付に戻す
      setTransactionDate(new Date().toISOString().split('T')[0]);
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

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
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
                className="flex-1 p-2 border rounded"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="説明"
                className="flex-1 p-2 border rounded"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1 p-2 border rounded">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="flex-1 outline-none"
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
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-600">{transaction.formattedDate || formatDate(transaction.date)}</div>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString()}円
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
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