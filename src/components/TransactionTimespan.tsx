import React, { useState } from 'react';
import { Expense } from '../types/expense';
import { parse, format, differenceInDays, addDays, isValid } from 'date-fns';
import TransactionTooltip from './TransactionTooltip';
import { CategoryColorMap } from '../types/categoryColorMap';
import { Accordion } from 'react-bootstrap';

interface TransactionTimespanProps {
  expenses: Expense[];
  categoryColorMap: CategoryColorMap;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const TransactionTimespan: React.FC<TransactionTimespanProps> = ({ expenses, categoryColorMap, isExpanded, setIsExpanded }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (expenses.length === 0) return null;

  const NUMBER_OF_MARKERS = 50; // Adjust this value to change the number of markers

  const parseDateSafely = (dateString: string) => {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : new Date();
  };

  const dates = expenses.map(expense => parseDateSafely(expense.Date));
  const startDate = new Date(Math.min(...dates.map(date => date.getTime())));
  const endDate = new Date(Math.max(...dates.map(date => date.getTime())));

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  const daysDifference = differenceInDays(endDate, startDate);
  const markerInterval = Math.max(1, Math.floor(daysDifference / NUMBER_OF_MARKERS));

  // Modify the expensesByDate to include all transactions
  const expensesByDate = expenses.reduce((acc, expense) => {
    const date = parseDateSafely(expense.Date);
    const dateString = format(date, 'yyyy-MM-dd');
    if (!acc[dateString]) {
      acc[dateString] = { total: 0, transactions: [] };
    }
    acc[dateString].total += expense.DebitAmount;
    acc[dateString].transactions.push(expense);
    return acc;
  }, {} as Record<string, { total: number; transactions: Expense[] }>);

  // Find the maximum daily expense for scaling
  const maxDailyExpense = Math.max(...Object.values(expensesByDate).map(day => day.total));

  // Generate the timeline markers
  const timelineMarkers = Array.from({ length: NUMBER_OF_MARKERS }, (_, index) => {
    const currentDate = addDays(startDate, index * markerInterval);
    const dateString = format(currentDate, 'yyyy-MM-dd');
    const dayData = expensesByDate[dateString] || { total: 0, transactions: [] };
    const height = (dayData.total / maxDailyExpense) * 100;
    return (
      <div
        key={dateString}
        className="w-1.5 bg-blue-400 hover:bg-blue-600 transition-all duration-200 cursor-pointer"
        style={{
          height: `${Math.max(4, height * 2.5)}%`, // Increase the scaling factor
          opacity: dayData.total > 0 ? Math.max(0.3, 0.5 + (height / 100)) : 0.1,
        }}
        onClick={() => setSelectedDate(dateString)}
        title={`${formatDate(currentDate)}: $${dayData.total.toFixed(2)}`}
      />
    );
  });

  return (
    <Accordion activeKey={isExpanded ? '0' : ''}>
      <Accordion.Item eventKey="0">
        <Accordion.Header onClick={() => setIsExpanded(!isExpanded)}>
          Transaction Timeline
        </Accordion.Header>
        <Accordion.Body>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-800">{formatDate(startDate)}</p>
            </div>
            <div className="flex-grow mx-4 relative custom-scrollbar">
              <div className="h-12 bg-blue-100 rounded-full overflow-hidden flex items-end justify-between px-2">
                {timelineMarkers}
              </div>
              {selectedDate && (
                <TransactionTooltip
                  transactions={expensesByDate[selectedDate].transactions}
                  date={selectedDate}
                  onClose={() => setSelectedDate(null)}
                  categoryColorMap={categoryColorMap}
                />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">End Date</p>
              <p className="text-lg font-semibold text-gray-800">{formatDate(endDate)}</p>
            </div>
          </div>
          <p className="text-center mt-4 text-gray-600">
            {daysDifference} days
          </p>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default TransactionTimespan;