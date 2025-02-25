'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 追加: Transaction型を再定義（もしまだ定義していない場合）
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
        const parsedTransactions = JSON.parse(savedTransactions);
        // 配列かどうか確認してから設定
        if (Array.isArray(parsedTransactions)) {
          setTransactions(parsedTransactions);
        } else {
          console.error('保存されたトランザクションデータが配列ではありません');
          setTransactions([]);
        }
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

    // 前の状態を使用して更新
    setTransactions(prevTransactions => {
      const safeTransactions = Array.isArray(prevTransactions) ? prevTransactions : [];
      return [newTransaction, ...safeTransactions];
    });
    
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
        localStorage.clear(); // balance と transactions の両方をクリア
      } catch (error) {
        console.error('データのリセット中にエラーが発生しました:', error);
      }
      
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

  // 変更: renderTransaction関数のtransactionパラメーターに型を指定
  const renderTransaction = (transaction: Transaction) => {
    try {
      // トランザクションが有効なオブジェクトか確認
      if (!transaction || typeof transaction !== 'object') {
        return null;
      }

      return (
        <div
          key={transaction.id || Date.now()}
          className={`p-3 rounded flex justify-between items-center ${
            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          <div>
            <div className="font-medium">{transaction.description || '説明なし'}</div>
            <div className="text-sm text-gray-600">
              {transaction.formattedDate || formatDate(transaction.date) || '日付なし'}
            </div>
          </div>
          <div className={`font-bold ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'income' ? '+' : '-'}
            {transaction.amount.toLocaleString()}円
          </div>
        </div>
      );
    } catch (error) {
      console.error('トランザクション表示中にエラーが発生しました:', error);
      return null;
    }
  };
};

export default MoneyManager;