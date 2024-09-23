import React, { useState } from 'react';
import { Expense } from '../types/expense';
import { format } from 'date-fns';

interface RecurringTransactionNotificationProps {
  count: number;
  recurringTransactions: Expense[];
  categoryColorMap: Record<string, string>;
}

const RecurringTransactionNotification: React.FC<RecurringTransactionNotificationProps> = ({ count, recurringTransactions, categoryColorMap }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  if (count === 0) return null;

  const groupedTransactions = recurringTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.Narrative]) {
      acc[transaction.Narrative] = [];
    }
    acc[transaction.Narrative].push(transaction);
    return acc;
  }, {} as Record<string, Expense[]>);

  const recurringGroupCount = Object.keys(groupedTransactions).length;

  const toggleGroup = (narrative: string) => {
    setExpandedGroups(prev => 
      prev.includes(narrative) 
        ? prev.filter(group => group !== narrative)
        : [...prev, narrative]
    );
  };

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="font-bold">Recurring Transactions Detected</p>
          <p>We've identified {recurringGroupCount} recurring transaction{recurringGroupCount !== 1 ? 's' : ''}.</p>
        </div>
      </div>
      <div className="mt-4 max-h-60 overflow-y-auto">
        {Object.entries(groupedTransactions).map(([narrative, transactions]) => (
          <div key={narrative} className="mb-4 last:mb-0">
            <button 
              onClick={() => toggleGroup(narrative)}
              className="w-full text-left font-semibold text-gray-700 mb-2 flex justify-between items-center"
            >
              <span>{narrative}</span>
              <span>{expandedGroups.includes(narrative) ? '▼' : '▶'}</span>
            </button>
            {expandedGroups.includes(narrative) && (
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
                            backgroundColor: categoryColorMap[transaction.Category] || '#808080',
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringTransactionNotification;