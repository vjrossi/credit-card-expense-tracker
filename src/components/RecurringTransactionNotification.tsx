import React, { useState } from 'react';
import { Expense } from '../types/expense';
import { format } from 'date-fns';

interface RecurringTransactionNotificationProps {
  count: number;
  recurringTransactions: Expense[];
  categoryColorMap: Record<string, string>;
}

const RecurringTransactionNotification: React.FC<RecurringTransactionNotificationProps> = ({ count, recurringTransactions, categoryColorMap }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (count === 0) return null;

  const groupedTransactions = recurringTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.Narrative]) {
      acc[transaction.Narrative] = [];
    }
    acc[transaction.Narrative].push(transaction);
    return acc;
  }, {} as Record<string, Expense[]>);

  const recurringGroupCount = Object.keys(groupedTransactions).length;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded-lg shadow-md" role="alert">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <p className="font-bold text-lg">Recurring Transactions Detected</p>
          <p>We've identified {recurringGroupCount} recurring transaction{recurringGroupCount !== 1 ? 's' : ''}.</p>
        </div>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isExpanded && (
        <div className="mt-4 max-h-60 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedTransactions).map(([narrative, transactions]) => (
            <div key={narrative} className="mb-3 last:mb-0">
              <div className="flex items-center mb-2">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full inline-block mr-2"
                  style={{
                    backgroundColor: categoryColorMap[transactions[0].Category] || '#808080',
                    color: 'white'
                  }}
                >
                  {transactions[0].Category}
                </span>
                <h3 className="my-0 font-semibold text-gray-700 text-base">{narrative}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-200">
                    <th className="py-1 px-1">Date</th>
                    <th className="py-1 px-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="border-b border-yellow-100 last:border-b-0">
                      <td className="py-1 px-1">{transaction.Date}</td>
                      <td className="py-1 px-1">${transaction.DebitAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionNotification;