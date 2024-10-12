import React, { useState, useMemo } from 'react';
import { Expense } from '../types/expense';
import { parse, format, differenceInDays, isValid, addDays } from 'date-fns';
import TransactionTooltip from './TransactionTooltip';
import { CategoryColorMap } from '../types/categoryColorMap';
import { Accordion } from 'react-bootstrap';

interface TransactionTimelineProps {
  expenses: Expense[];
  categoryColorMap: CategoryColorMap;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
}

const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ expenses, categoryColorMap, isExpanded, setIsExpanded }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const LARGE_TRANSACTION_THRESHOLD = 500; // $500
  const NUMBER_OF_MARKERS = 50;
  const MAX_GAP_DAYS = 7; // Maximum allowed gap between markers in days

  const parseDateSafely = (dateString: string) => {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : new Date();
  };

  const timelineData = useMemo(() => {
    // Filter out $0 amounts
    const nonZeroExpenses = expenses.filter(expense => expense.DebitAmount > 0);

    if (nonZeroExpenses.length === 0) return { markerExpenses: [], startDate: new Date(), endDate: new Date(), maxExpense: 0 };

    // Sort all non-zero expenses by date
    const sortedExpenses = [...nonZeroExpenses].sort((a, b) => 
      parseDateSafely(a.Date).getTime() - parseDateSafely(b.Date).getTime()
    );

    const dates = sortedExpenses.map(expense => parseDateSafely(expense.Date));
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const maxExpense = Math.max(...sortedExpenses.map(expense => expense.DebitAmount));

    // Include all transactions over $500
    const markerExpenses = sortedExpenses.filter(expense => expense.DebitAmount > LARGE_TRANSACTION_THRESHOLD);

    // Function to find the nearest non-zero transaction to a given date
    const findNearestTransaction = (targetDate: Date) => {
      return sortedExpenses.reduce((nearest, current) => {
        const currentDate = parseDateSafely(current.Date);
        const nearestDate = parseDateSafely(nearest.Date);
        return Math.abs(differenceInDays(currentDate, targetDate)) < Math.abs(differenceInDays(nearestDate, targetDate))
          ? current
          : nearest;
      });
    };

    // Fill gaps
    let lastMarkerDate = startDate;
    for (let i = 0; i < sortedExpenses.length; i++) {
      const currentExpense = sortedExpenses[i];
      const currentDate = parseDateSafely(currentExpense.Date);
      const daysSinceLastMarker = differenceInDays(currentDate, lastMarkerDate);

      if (daysSinceLastMarker >= MAX_GAP_DAYS) {
        const midpointDate = addDays(lastMarkerDate, Math.floor(daysSinceLastMarker / 2));
        const nearestExpense = findNearestTransaction(midpointDate);
        if (!markerExpenses.includes(nearestExpense)) {
          markerExpenses.push(nearestExpense);
          lastMarkerDate = parseDateSafely(nearestExpense.Date);
        }
      }

      if (currentExpense.DebitAmount > LARGE_TRANSACTION_THRESHOLD) {
        lastMarkerDate = currentDate;
      }
    }

    // If we have less than NUMBER_OF_MARKERS, add more evenly distributed
    while (markerExpenses.length < NUMBER_OF_MARKERS) {
      const idealGap = differenceInDays(endDate, startDate) / (markerExpenses.length + 1);
      const idealDate = addDays(startDate, Math.floor(idealGap));
      const nearestExpense = findNearestTransaction(idealDate);
      if (!markerExpenses.includes(nearestExpense)) {
        markerExpenses.push(nearestExpense);
      } else {
        break; // Avoid infinite loop if we can't add more unique transactions
      }
    }

    // Sort marker expenses by date
    markerExpenses.sort((a, b) => parseDateSafely(a.Date).getTime() - parseDateSafely(b.Date).getTime());

    return { markerExpenses, startDate, endDate, maxExpense };
  }, [expenses]);

  if (timelineData.markerExpenses.length === 0) return null;

  const { markerExpenses, startDate, endDate, maxExpense } = timelineData;

  const formatDate = (date: Date) => {
    return format(date, 'dd-MM-yyyy');
  };

  const daysDifference = differenceInDays(endDate, startDate);

  const timelineMarkers = markerExpenses.map((expense, index) => {
    const date = parseDateSafely(expense.Date);
    const position = (differenceInDays(date, startDate) / daysDifference) * 100;
    const height = (expense.DebitAmount / maxExpense) * 100;

    return (
      <div
        key={`${expense.Date}-${index}`}
        className="absolute bottom-0 w-1.5 bg-blue-400 hover:bg-blue-600 transition-all duration-200 cursor-pointer"
        style={{
          left: `${position}%`,
          height: `${Math.max(4, height)}%`,
        }}
        onClick={() => setSelectedDate(expense.Date)}
        title={`${formatDate(date)}: $${expense.DebitAmount.toFixed(2)}`}
      />
    );
  });

  return (
    <Accordion activeKey={isExpanded ? '0' : ''}>
      <Accordion.Item eventKey="0">
        <Accordion.Header onClick={() => setIsExpanded(!isExpanded)}>
          Transaction Timeline (Expenses over $500)
        </Accordion.Header>
        <Accordion.Body>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-800">{formatDate(startDate)}</p>
            </div>
            <div className="flex-grow mx-4 relative custom-scrollbar">
              <div className="h-32 bg-blue-100 rounded-full overflow-hidden relative">
                {timelineMarkers}
              </div>
              {selectedDate && (
                <TransactionTooltip
                  transactions={expenses.filter(e => e.Date === selectedDate && e.DebitAmount > LARGE_TRANSACTION_THRESHOLD)}
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
            {daysDifference} days, showing {markerExpenses.length} transactions over $500
          </p>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default TransactionTimeline;
