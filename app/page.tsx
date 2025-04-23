'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, DollarSign, Calendar, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ja } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';  // Supabaseのインスタンスをインポート

type Transaction = {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  formattedDate?: string; // ←これを追加！
};


const MoneyManager = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [darkMode, setDarkMode] = useState(false);

  
  // ページ読み込み時にデータベースから取引データを取得
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
  
        if (error) throw error;
  
        const transactionsWithFormatted = data.map((t) => ({
          ...t,
          formattedDate: t.formatteddate,
        }));
  
        setTransactions(transactionsWithFormatted);
  
        const totalBalance = transactionsWithFormatted.reduce((sum: number, transaction: Transaction) => {
          return transaction.type === 'income'
            ? sum + transaction.amount
            : sum - transaction.amount;
        }, 0);
        setBalance(totalBalance);
      } catch (error) {
        console.error('取引データの取得中にエラーが発生しました:', error);
      }
    };
  
    fetchTransactions();
    
    
    
  }, []);

  // 日付をフォーマットする関数（YYYY-MM-DD → 日本語表記 + 曜日）
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const formatted = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
      return formatted; // 例: 2025年4月22日(火)
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return dateString;
    }
  };
  const handleTransaction = async (type: 'income' | 'expense') => {
    const newAmount = parseFloat(amount);
    if (!amount || isNaN(newAmount)) return;
  
    const formattedDate = formatDate(transactionDate.toISOString());
  
    const newTransaction = {
      id: Date.now(),
      type,
      amount: newAmount,
      description: description || (type === 'income' ? '入金' : '出金'),
      date: transactionDate.toISOString().split('T')[0], // 日付のみ (YYYY-MM-DD)
      formatteddate: formattedDate, // formatteddate に統一
    };
  
    // Supabase用のデータ（カラム名をDBに合わせる）
    const supabaseInsertData = {
      ...newTransaction,
      formatteddate: formattedDate, // DBのカラム名に合わせる
    };
  
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([supabaseInsertData]);
  
      if (error) throw error;
  
      console.log('取引が保存されました:', data);
  
      setTransactions(prev => [newTransaction, ...prev]);
      setBalance(prev =>
        type === 'income' ? prev + newAmount : prev - newAmount
      );
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('取引データの保存中にエラーが発生しました:', error);
    }
  };
  
  

  const handleReset = async () => {
    if (window.confirm('全てのデータをリセットしてもよろしいですか？')) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .neq('id', 0);  // 適当な条件で全件削除
        
        if (error) throw error;
        
        setBalance(0);
        setTransactions([]);
      } catch (error) {
        console.error('データのリセット中にエラーが発生しました:', error);
      }
    }
  };

  // テーマを切り替える関数
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };
  console.log('formattedDate:', formatDate(transactionDate.toISOString()));
  const handleLoadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        if (!json) {
          console.error('ファイルの読み込みに失敗しました。内容が空です。');
          return;
        }
  
        const loadedTransactions: Transaction[] = JSON.parse(json);
        console.log('読み込んだ取引データ:', loadedTransactions);
  
        // `formattedDate` を適切に設定
        const formattedTransactions = loadedTransactions.map((t) => ({
          ...t,
          formattedDate: t.formattedDate || formatDate(t.date), // 日付がなければフォーマット
        }));
  
        // Supabaseに挿入
        const { data, error } = await supabase
          .from('transactions')
          .insert(formattedTransactions);
  
        if (error) {
          console.error('データの挿入中にエラーが発生しました:', error);
          alert('データの保存に失敗しました');
          return;
        }
  
        console.log('取引データがデータベースに保存されました:', data);
  
        // 取引データを状態に反映
        setTransactions(formattedTransactions); // フォーマット済みデータを使用
        const total = formattedTransactions.reduce((sum, t) => {
          return t.type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);
        setBalance(total);
  
      } catch (err) {
        console.error('ファイル読み込みエラー:', err);
        alert('ファイルの形式が正しくありません。');
      }
    };
  
    reader.onerror = (err) => {
      console.error('FileReaderエラー:', err);
      alert('ファイルの読み込み中にエラーが発生しました。');
    };
  
    reader.readAsText(file);
  };
  
    
  
  
  const handleSaveToFile = () => {
    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.json';
    a.click();
  
    URL.revokeObjectURL(url);
  };
  

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} min-h-screen`}>
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
                  dateFormat="yyyy/MM/dd (eee)" 
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
                <Plus className="w-5 h-5" />
                収入
              </button>
              <button
                onClick={() => handleTransaction('expense')}
                className="flex-1 bg-red-500 text-white p-2 rounded flex items-center justify-center gap-2"
              >
                <Minus className="w-5 h-5" />
                支出
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={handleReset}
                className="text-red-600 p-2 hover:bg-red-100 rounded"
              >
                データをリセット
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 取引カードの表示 */}
<div className="space-y-4 mt-6">
  {transactions.length === 0 ? (
    <p className="text-center text-gray-400">取引がまだありません</p>
  ) : (
    transactions.map((t) => (
      <Card key={t.id} className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardHeader>
          <CardTitle>{t.description}</CardTitle>
          <p className="text-sm text-gray-500">{t.formattedDate || formatDate(t.date)}</p>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
            {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}円
          </p>
        </CardContent>
      </Card>
    ))
  )}
</div>
<div className="flex gap-4 justify-center mt-6">
  <button
    onClick={handleSaveToFile}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
  >
    JSONで保存
  </button>

  <label className="bg-yellow-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-yellow-600">
    JSON読み込み
    <input
      type="file"
      accept=".json"
      onChange={handleLoadFromFile}
      className="hidden"
    />
  </label>
</div>

    </div>
  );
};

export default MoneyManager;
