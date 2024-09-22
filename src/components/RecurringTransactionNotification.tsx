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

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold">Recurring Transactions Detected</p>
          <p>We've identified {count} recurring transaction{count !== 1 ? 's' : ''}.</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4 max-h-60 overflow-y-auto">
          {Object.entries(groupedTransactions).map(([narrative, transactions]) => (
            <div key={narrative} className="mb-4 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{narrative}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-200">
                    <th className="py-2 px-4 text-left">Date</th>
                    <th className="py-2 px-4 text-right">Amount</th>
                    <th className="py-2 px-4 text-center">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="border-b border-yellow-100 last:border-b-0">
                      <td className="py-2 px-4">{format(new Date(transaction.Date), 'MMM d, yyyy')}</td>
                      <td className="py-2 px-4 text-right">${transaction.DebitAmount.toFixed(2)}</td>
                      <td className="py-2 px-4 text-center">
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded-full inline-block"
                          style={{ 
                            backgroundColor: categoryColorMap[transaction.Category],
                            color: 'white'
                          }}
                        >
                          {transaction.Category}
                        </span>
                      </td>
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