'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Transaction } from '@/app/MoneyManager';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#4ade80', '#f87171']; // 緑：収入, 赤：支出

const MonthlySummary = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decoded: Transaction[] = JSON.parse(decodeURIComponent(data));
        setTransactions(decoded);

        const months = decoded
          .map((t) => typeof t.date === 'string' ? t.date.slice(0, 7) : null)
          .filter((m): m is string => m !== null);

        const uniqueMonths = Array.from(new Set(months));

        if (uniqueMonths.length > 0) {
          setSelectedMonth(uniqueMonths[0]);
        }
      } catch (e) {
        console.error('データの読み込みに失敗しました', e);
      }
    }
  }, [searchParams]);

  const getMonthlySummary = (transactions: Transaction[]) => {
    const summaryMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach(({ date, type, amount }) => {
      const monthKey = date.slice(0, 7);
      if (!summaryMap.has(monthKey)) {
        summaryMap.set(monthKey, { income: 0, expense: 0 });
      }
      const monthData = summaryMap.get(monthKey)!;
      if (type === 'income') {
        monthData.income += amount;
      } else {
        monthData.expense += amount;
      }
    });

    return Array.from(summaryMap.entries()).map(([month, { income, expense }]) => ({
      month,
      income,
      expense,
      balance: income - expense,
    }));
  };

  const getPieDataForMonth = (transactions: Transaction[], selectedMonth: string) => {
    const monthlyTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
    const income = monthlyTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return [
      { name: '収入', value: income },
      { name: '支出', value: expense },
    ];
  };

  const availableMonths = Array.from(new Set(transactions.map(t => t.date.slice(0, 7))));

  return (
    <div className="p-6">
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
      >
        ← 戻る
      </button>

      <h2 className="text-2xl font-bold text-center mb-6">月別収支</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={getMonthlySummary(transactions)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#4ade80" name="収入" />
          <Bar dataKey="expense" fill="#f87171" name="支出" />
          <Bar dataKey="balance" fill="#60a5fa" name="収支差額" />
        </BarChart>
      </ResponsiveContainer>

      {/* 月選択 */}
      {availableMonths.length > 0 && (
        <div className="mt-8 text-center">
          <label className="mr-2">月を選択:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 円グラフ */}
      {selectedMonth && (
        <div className="mt-8 flex justify-center">
          <PieChart width={400} height={300}>
            <Pie
              data={getPieDataForMonth(transactions, selectedMonth)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {getPieDataForMonth(transactions, selectedMonth).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}
    </div>
  );
};

// サスペンスでラップ
const MonthlySummaryWithSuspense = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <MonthlySummary />
  </Suspense>
);

export default MonthlySummaryWithSuspense;
