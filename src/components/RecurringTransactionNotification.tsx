import React, { useState } from 'react';
import { Expense } from '../types/expense';
import { Accordion } from 'react-bootstrap';

interface RecurringTransactionNotificationProps {
  count: number;
  recurringTransactions: Expense[];
  categoryColorMap: Record<string, string>;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const RecurringTransactionNotification: React.FC<RecurringTransactionNotificationProps> = ({ 
  count, 
  recurringTransactions, 
  categoryColorMap,
  isExpanded,
  setIsExpanded
}) => {
  if (count === 0) return null;

  const groupedTransactions = recurringTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.Narrative]) {
      acc[transaction.Narrative] = [];
    }
    acc[transaction.Narrative].push(transaction);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <Accordion activeKey={isExpanded ? '0' : ''}>
      <Accordion.Item eventKey="0">
        <Accordion.Header onClick={() => setIsExpanded(!isExpanded)}>
          Recurring Transactions Detected
        </Accordion.Header>
        <Accordion.Body>
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
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default RecurringTransactionNotification;