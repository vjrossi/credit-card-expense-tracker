import React from 'react';
import { Expense } from '../types/expense';
import { format } from 'date-fns';

interface TransactionTooltipProps {
  transactions: Expense[];
  date: string;
  onClose: () => void;
  categoryColorMap: Record<string, string>;
}

const TransactionTooltip: React.FC<TransactionTooltipProps> = ({ transactions, date, onClose, categoryColorMap }) => {
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 mb-2 z-10">
      <h3 className="text-lg font-semibold mb-2">{format(new Date(date), 'MMMM d, yyyy')}</h3>
      <ul className="max-h-60 overflow-y-auto">
        {transactions.map((transaction, index) => (
          <li key={index} className={`mb-2 pb-2 border-b border-gray-200 last:border-b-0 ${transaction.IsRecurring ? 'bg-yellow-100' : ''}`}>
            <p className="font-semibold text-gray-800">{transaction.Narrative}</p>
            <p className="text-sm text-gray-600">${transaction.DebitAmount.toFixed(2)}</p>
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full inline-block"
              style={{ 
                backgroundColor: categoryColorMap[transaction.Category],
                color: 'white'
              }}
            >
              {transaction.Category}
            </span>
            {transaction.IsRecurring && (
              <span className="text-xs font-medium px-2 py-1 rounded-full inline-block bg-yellow-500 text-white ml-2">
                Recurring
              </span>
            )}
          </li>
        ))}
      </ul>
      <button
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default TransactionTooltip;