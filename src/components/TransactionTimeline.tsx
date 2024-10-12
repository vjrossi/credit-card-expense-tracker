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
    // Filter out $0 amounts and separate credits and debits
    const nonZeroTransactions = expenses.filter(expense => expense.DebitAmount > 0 || expense.CreditAmount > 0);

    if (nonZeroTransactions.length === 0) return { markerTransactions: [], startDate: new Date(), endDate: new Date(), maxAmount: 0 };

    // Sort all non-zero transactions by date
    const sortedTransactions = [...nonZeroTransactions].sort((a, b) => 
      parseDateSafely(a.Date).getTime() - parseDateSafely(b.Date).getTime()
    );

    const dates = sortedTransactions.map(transaction => parseDateSafely(transaction.Date));
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const maxAmount = Math.max(...sortedTransactions.map(transaction => Math.max(transaction.DebitAmount, transaction.CreditAmount)));

    // Include all transactions over $500
    const markerTransactions = sortedTransactions.filter(transaction => 
      transaction.DebitAmount > LARGE_TRANSACTION_THRESHOLD || transaction.CreditAmount > LARGE_TRANSACTION_THRESHOLD
    );

    // Function to find the nearest non-zero transaction to a given date
    const findNearestTransaction = (targetDate: Date) => {
      return sortedTransactions.reduce((nearest, current) => {
        const currentDate = parseDateSafely(current.Date);
        const nearestDate = parseDateSafely(nearest.Date);
        return Math.abs(differenceInDays(currentDate, targetDate)) < Math.abs(differenceInDays(nearestDate, targetDate))
          ? current
          : nearest;
      });
    };

    // Fill gaps
    let lastMarkerDate = startDate;
    for (let i = 0; i < sortedTransactions.length; i++) {
      const currentTransaction = sortedTransactions[i];
      const currentDate = parseDateSafely(currentTransaction.Date);
      const daysSinceLastMarker = differenceInDays(currentDate, lastMarkerDate);

      if (daysSinceLastMarker >= MAX_GAP_DAYS) {
        const midpointDate = addDays(lastMarkerDate, Math.floor(daysSinceLastMarker / 2));
        const nearestTransaction = findNearestTransaction(midpointDate);
        if (!markerTransactions.includes(nearestTransaction)) {
          markerTransactions.push(nearestTransaction);
          lastMarkerDate = parseDateSafely(nearestTransaction.Date);
        }
      }

      if (currentTransaction.DebitAmount > LARGE_TRANSACTION_THRESHOLD || currentTransaction.CreditAmount > LARGE_TRANSACTION_THRESHOLD) {
        lastMarkerDate = currentDate;
      }
    }

    // If we have less than NUMBER_OF_MARKERS, add more evenly distributed
    while (markerTransactions.length < NUMBER_OF_MARKERS) {
      const idealGap = differenceInDays(endDate, startDate) / (markerTransactions.length + 1);
      const idealDate = addDays(startDate, Math.floor(idealGap));
      const nearestTransaction = findNearestTransaction(idealDate);
      if (!markerTransactions.includes(nearestTransaction)) {
        markerTransactions.push(nearestTransaction);
      } else {
        break; // Avoid infinite loop if we can't add more unique transactions
      }
    }

    // Sort marker transactions by date
    markerTransactions.sort((a, b) => parseDateSafely(a.Date).getTime() - parseDateSafely(b.Date).getTime());

    const maxDebitAmount = Math.max(0, ...sortedTransactions.map(transaction => transaction.DebitAmount));
    const maxCreditAmount = Math.max(0, ...sortedTransactions.map(transaction => transaction.CreditAmount));

    return { markerTransactions, startDate, endDate, maxDebitAmount, maxCreditAmount };
  }, [expenses]);

  if (!timelineData.markerTransactions.length) return null;

  const { markerTransactions, startDate, endDate, maxDebitAmount, maxCreditAmount } = timelineData;

  const formatDate = (date: Date) => {
    return format(date, 'dd-MM-yyyy');
  };

  const daysDifference = differenceInDays(endDate, startDate);

  const timelineMarkers = markerTransactions.map((transaction, index) => {
    const date = parseDateSafely(transaction.Date);
    const position = (differenceInDays(date, startDate) / daysDifference) * 100;
    const isDebit = transaction.DebitAmount > 0;
    const amount = isDebit ? transaction.DebitAmount : transaction.CreditAmount;
    const safeRelevantMaxAmount = (isDebit ? maxDebitAmount : maxCreditAmount) || 1;
    const heightPercentage = (amount / safeRelevantMaxAmount) * 50; // 50% is half the timeline height

    return (
      <div
        key={`${transaction.Date}-${index}`}
        className={`absolute w-1.5 transition-all duration-200 cursor-pointer ${
          isDebit ? 'bg-red-400 hover:bg-red-600' : 'bg-green-400 hover:bg-green-600'
        }`}
        style={{
          left: `${position}%`,
          height: `${Math.max(4, heightPercentage)}%`,
          bottom: isDebit ? 'auto' : '0',
          top: isDebit ? '0' : 'auto',
        }}
        onClick={() => setSelectedDate(transaction.Date)}
        title={`${formatDate(date)}: ${isDebit ? 'Debit' : 'Credit'} $${amount.toFixed(2)}`}
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
              <div className="h-32 bg-gray-100 rounded-full overflow-hidden relative">
                {timelineMarkers}
              </div>
              {selectedDate && (
                <TransactionTooltip
                  transactions={expenses.filter(e => e.Date === selectedDate && (e.DebitAmount > LARGE_TRANSACTION_THRESHOLD || e.CreditAmount > LARGE_TRANSACTION_THRESHOLD))}
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

export default TransactionTimeline;
