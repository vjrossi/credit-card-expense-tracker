import React, { useState, useMemo, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Expense } from '../types/expense';
import { CategoryColorMap } from '../types/categoryColorMap';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Add this import
import { format } from 'date-fns'; // Add this import

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpenseVisualizerProps {
  expenses: Expense[];
  setCategoryColorMap: React.Dispatch<React.SetStateAction<CategoryColorMap>>;
}

const categoryColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
];

const ExpenseVisualizer: React.FC<ExpenseVisualizerProps> = ({ expenses, setCategoryColorMap }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAllCategories, setSearchAllCategories] = useState(false);

  const categoriesWithExpenses = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const amount = expense.DebitAmount || 0;
      if (!acc[expense.Category]) {
        acc[expense.Category] = { total: 0, expenses: [] };
      }
      acc[expense.Category].total += amount;
      acc[expense.Category].expenses.push(expense);
      return acc;
    }, {} as Record<string, { total: number; expenses: Expense[] }>);
  }, [expenses]);

  const categories = useMemo(() => Object.keys(categoriesWithExpenses), [categoriesWithExpenses]);
  const totals = useMemo(() => categories.map(cat => categoriesWithExpenses[cat].total), [categories, categoriesWithExpenses]);

  const memoizedCategoryColorMap = useMemo(() => {
    return categories.reduce((acc, category, index) => {
      acc[category] = categoryColors[index % categoryColors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  useEffect(() => {
    setCategoryColorMap(memoizedCategoryColorMap);
  }, [memoizedCategoryColorMap, setCategoryColorMap]);

  const filteredExpenses = useMemo(() => {
    let expensesToSearch = searchAllCategories ? expenses : (selectedCategory ? categoriesWithExpenses[selectedCategory].expenses : []);

    return expensesToSearch.filter(expense => {
      if (!searchQuery) return true;

      const lowercaseQuery = searchQuery.toLowerCase();
      return expense.Narrative.toLowerCase().includes(lowercaseQuery) ||
        expense.Date.includes(searchQuery) ||
        expense.DebitAmount.toString().includes(searchQuery);
    });
  }, [expenses, selectedCategory, categoriesWithExpenses, searchQuery, searchAllCategories]);

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.Date).getTime() - new Date(a.Date).getTime();
          break;
        case 'amount':
          comparison = b.DebitAmount - a.DebitAmount;
          break;
        case 'description':
          comparison = a.Narrative.localeCompare(b.Narrative);
          break;
      }
      // For description, we don't need to invert the comparison for ascending order
      return sortBy === 'description'
        ? (sortDirection === 'asc' ? comparison : comparison * -1)
        : (sortDirection === 'asc' ? comparison * -1 : comparison);
    });
  }, [filteredExpenses, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const data = {
    labels: categories,
    datasets: [
      {
        data: totals,
        backgroundColor: categories.map(cat => memoizedCategoryColorMap[cat]),
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
        setSelectedCategory(newCategory);
      }
    },
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-8">
      <div className="w-full lg:w-1/2">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Expenses by Category</h2>
        <div className="h-96 flex items-center justify-center">
          <div className="w-[90%] h-[90%]">
            <Pie data={data} options={options} />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {searchAllCategories ? 'All Transactions' : (selectedCategory ? `${selectedCategory} Transactions` : 'Transactions by Category')}
        </h2>
        <div className="border border-gray-300 rounded-lg p-4 h-96 flex flex-col">
          {selectedCategory ? (
            <>
              <div className="mb-3 flex flex-col">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by keyword, date, or amount..."
                    className="border border-gray-300 rounded px-2 py-1 flex-grow"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <input
                    type="checkbox"
                    id="searchAllCategories"
                    checked={searchAllCategories}
                    onChange={(e) => setSearchAllCategories(e.target.checked)}
                  />
                  <label htmlFor="searchAllCategories" className="text-sm text-gray-700">
                    Search all categories
                  </label>
                </div>
              </div>
              <div className="mb-4 flex items-center">
                <label htmlFor="sort" className="text-gray-700 mr-2">Order by:</label>
                <select
                  id="sort"
                  className="border border-gray-300 rounded px-4 py-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'description')}
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="description">Description</option>
                </select>
                <button
                  onClick={toggleSortDirection}
                  className="p-2 rounded hover:bg-gray-100"
                  aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortDirection === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
                </button>
              </div>
              <div className="overflow-y-auto flex-grow pr-4 custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 text-left font-medium text-gray-800">Date</th>
                      <th className="py-2 text-left font-medium text-gray-800">Description</th>
                      <th className="py-2 text-right font-medium text-gray-800">Debit</th>
                      <th className="py-2 text-right font-medium text-gray-800">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedExpenses.map((expense, index) => (
                      <tr key={index} className="border-b border-gray-200 last:border-b-0">
                        <td className="py-2 font-medium text-gray-800">
                          {format(new Date(expense.Date), 'dd-MMM-yyyy')}
                        </td>
                        <td className="py-2 truncate max-w-[200px] text-gray-800">{expense.Narrative}</td>
                        <td className="py-2 text-right font-medium text-red-600">
                          {expense.DebitAmount > 0 ? `$${expense.DebitAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 text-right font-medium text-green-600">
                          {expense.CreditAmount > 0 ? `$${expense.CreditAmount.toFixed(2)}` : '-'}
                        </td>
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
  );
};

export default ExpenseVisualizer;
