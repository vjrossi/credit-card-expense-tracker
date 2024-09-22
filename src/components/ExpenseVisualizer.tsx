import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Expense } from '../types/expense';
import { CategoryColorMap } from '../types/categoryColorMap'; // Fixed import casing

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseVisualizerProps {
  expenses: Expense[];
  setCategoryColorMap: React.Dispatch<React.SetStateAction<CategoryColorMap>>;
}

const ExpenseVisualizer: React.FC<ExpenseVisualizerProps> = ({ expenses, setCategoryColorMap }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoriesWithExpenses = expenses.reduce((acc, expense) => {
    const amount = expense.DebitAmount || 0;
    if (!acc[expense.Category]) {
      acc[expense.Category] = { total: 0, expenses: [] };
    }
    acc[expense.Category].total += amount;
    acc[expense.Category].expenses.push(expense);
    return acc;
  }, {} as Record<string, { total: number; expenses: Expense[] }>);

  const categories = Object.keys(categoriesWithExpenses);
  const totals = categories.map(cat => categoriesWithExpenses[cat].total);

  console.log('Categories:', categories);
  console.log('Totals:', totals);

  const categoryColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
  ];

  const categoryColorMap = categories.reduce((acc, category, index) => {
    acc[category] = categoryColors[index % categoryColors.length];
    return acc;
  }, {} as Record<string, string>);

  const data = {
    labels: categories,
    datasets: [
      {
        data: totals,
        backgroundColor: categories.map(cat => categoryColorMap[cat]),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
      legend: {
        position: 'top' as const,
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const categoryIndex = elements[0].index;
        const newCategory = categories[categoryIndex];
        console.log('Clicked category:', newCategory);
        setSelectedCategory(newCategory);
      }
    },
  };

  useEffect(() => {
    console.log('Selected category:', selectedCategory);
    if (selectedCategory) {
      console.log('Transactions:', categoriesWithExpenses[selectedCategory].expenses);
    }
  }, [selectedCategory, categoriesWithExpenses]);

  useEffect(() => {
    setCategoryColorMap(categoryColorMap);
  }, [categoryColorMap, setCategoryColorMap]);

  const groupRecurringTransactions = (expenses: Expense[]): Record<string, Expense[]> => {
    return expenses
      .filter(expense => expense.IsRecurring)
      .reduce((acc, expense) => {
        if (!acc[expense.Narrative]) {
          acc[expense.Narrative] = [];
        }
        acc[expense.Narrative].push(expense);
        return acc;
      }, {} as Record<string, Expense[]>);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row justify-between gap-8">
        <div className="w-full lg:w-1/2">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Expenses by Category</h2>
          <div className="aspect-square">
            <Pie data={data} options={options} />
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            {selectedCategory ? `${selectedCategory} Transactions` : 'Transactions by Category'}
          </h2>
          <div className="border border-gray-300 rounded-lg p-4 h-96 flex flex-col">
            {selectedCategory ? (
              <>
                <div className="overflow-y-auto flex-grow pr-4">
                  <table className="w-full text-sm">
                    <tbody>
                      {categoriesWithExpenses[selectedCategory].expenses.map((expense, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0">
                          <td className="py-2 font-medium text-gray-600">{expense.Date}</td>
                          <td className="py-2 truncate max-w-[200px] text-gray-700">{expense.Narrative}</td>
                          <td className="py-2 text-right font-medium text-gray-800">${expense.DebitAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center mt-4">Click on a category in the pie chart to see transactions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseVisualizer;