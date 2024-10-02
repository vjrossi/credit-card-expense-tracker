import React, { useState, useRef, useEffect } from 'react';
import { Expense } from '../types/expense';
import { Accordion, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { format } from 'date-fns';
import { FaInfoCircle } from 'react-icons/fa';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0);
  const transactionRefs = useRef<Record<string, (HTMLDivElement | null)[]>>({});

  useEffect(() => {
    if (selectedCategory && isExpanded) {
      const categoryTransactions = transactionRefs.current[selectedCategory];
      if (categoryTransactions && categoryTransactions[selectedCategoryIndex]) {
        categoryTransactions[selectedCategoryIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedCategory, selectedCategoryIndex, isExpanded]);

  if (count === 0) return null;

  const groupedTransactions = recurringTransactions.reduce((acc, transaction) => {
    if (!acc[transaction.Narrative]) {
      acc[transaction.Narrative] = [];
    }
    acc[transaction.Narrative].push(transaction);
    return acc;
  }, {} as Record<string, Expense[]>);

  const categorySummary = Object.values(groupedTransactions).reduce((acc, transactions) => {
    const category = transactions[0].Category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCategoryClick = (category: string) => {
    setIsExpanded(true);
    if (category === selectedCategory) {
      setSelectedCategoryIndex((prevIndex) => (prevIndex + 1) % categorySummary[category]);
    } else {
      setSelectedCategory(category);
      setSelectedCategoryIndex(0);
    }
  };

  return (
    <Accordion activeKey={isExpanded ? '0' : ''}>
      <Accordion.Item eventKey="0">
        <Accordion.Header onClick={() => setIsExpanded(!isExpanded)}>
          <div>
            <div className="d-flex align-items-center">
              <span>Recurring Transactions Detected</span>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="recurring-transactions-info">
                    Click a category button to go to its transactions.
                    Click again to go to the next group, if any.
                  </Tooltip>
                }
              >
                <span className="ms-2 text-muted">
                  <FaInfoCircle size="0.8em" />
                </span>
              </OverlayTrigger>
            </div>
            <div className="d-flex flex-wrap gap-1 mt-2">
              {Object.entries(categorySummary).map(([category, count]) => (
                <span
                  key={category}
                  className="text-xs font-medium px-2 py-1 rounded-full inline-block cursor-pointer"
                  style={{
                    backgroundColor: categoryColorMap[category] || '#808080',
                    color: 'white'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick(category);
                  }}
                >
                  {category} {count > 1 ? `(x${count})` : ''}
                </span>
              ))}
            </div>
          </div>
        </Accordion.Header>
        <Accordion.Body>
          <div className="mt-4 max-h-60 overflow-y-auto custom-scrollbar">
            {Object.entries(groupedTransactions).map(([narrative, transactions]) => {
              const category = transactions[0].Category;
              if (!transactionRefs.current[category]) {
                transactionRefs.current[category] = [];
              }
              return (
                <div 
                  key={narrative} 
                  className="mb-3 last:mb-0"
                  ref={(el) => {
                    if (el) transactionRefs.current[category].push(el);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full inline-block mr-2"
                      style={{
                        backgroundColor: categoryColorMap[category] || '#808080',
                        color: 'white'
                      }}
                    >
                      {category}
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
                          <td className="py-1 px-1">{format(new Date(transaction.Date), 'dd-MM-yyyy')}</td>
                          <td className="py-1 px-1">${transaction.DebitAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default RecurringTransactionNotification;