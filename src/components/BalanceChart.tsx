import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Expense } from '../types/expense';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface BalanceChartProps {
  expenses: Expense[];
  finalBalance: number;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ expenses, finalBalance }) => {
  const balanceData = useMemo(() => {
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    let balance = finalBalance;
    const data = sortedExpenses.map(expense => {
      const prevBalance = balance;
      balance += expense.DebitAmount;
      balance -= expense.CreditAmount;
      return { date: expense.Date, balance: prevBalance };
    });
    return data.reverse();
  }, [expenses, finalBalance]);

  const chartData = {
    labels: balanceData.map(item => item.date),
    datasets: [
      {
        label: 'Balance',
        data: balanceData.map(item => item.balance),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Account Balance Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default BalanceChart;
