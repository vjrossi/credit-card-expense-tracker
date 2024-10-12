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
  const chartData = useMemo(() => {
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    let balance = finalBalance;
    const data = sortedExpenses.map(expense => {
      const prevBalance = balance;
      balance += expense.DebitAmount;
      balance -= expense.CreditAmount;
      return { date: expense.Date, balance: prevBalance };
    });
    const reversedData = data.reverse();

    const labels = reversedData.map(item => item.date);
    const dailyNetChanges = labels.reduce((acc: Record<string, number>, date: string) => {
      acc[date] = sortedExpenses
        .filter(e => e.Date === date)
        .reduce((sum, e) => sum + e.CreditAmount - e.DebitAmount, 0); // Inverted calculation here
      return acc;
    }, {});

    // Calculate trendline
    const xValues = reversedData.map((_, index) => index);
    const yValues = reversedData.map(item => item.balance);
    const { slope, intercept } = calculateLinearRegression(xValues, yValues);
    const trendlineData = xValues.map(x => slope * x + intercept);

    // Adjust trendline to start from the first actual balance point
    const firstBalance = reversedData[0].balance;
    const trendlineOffset = firstBalance - trendlineData[0];
    const adjustedTrendlineData = trendlineData.map(value => value + trendlineOffset);

    return {
      labels,
      datasets: [
        {
          label: 'Balance',
          data: reversedData.map(item => item.balance),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
        {
          label: 'Trendline',
          data: adjustedTrendlineData,
          borderColor: 'rgba(255, 99, 132, 0.8)',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
      dailyNetChanges,
    };
  }, [expenses, finalBalance]);

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
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const index = context.dataIndex;
            const date = chartData.labels[index];
            const netChange = chartData.dailyNetChanges[date];
            const netChangeFormatted = netChange.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            });
            return [
              `${label}: ${value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
              `Change: ${netChangeFormatted}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          }
        }
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

// Helper function to calculate linear regression
function calculateLinearRegression(xValues: number[], yValues: number[]) {
  const n = xValues.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xValues[i];
    sumY += yValues[i];
    sumXY += xValues[i] * yValues[i];
    sumXX += xValues[i] * xValues[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default BalanceChart;
