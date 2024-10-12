import React, { useState, useMemo } from 'react';
import { Expense } from '../types/expense';
import { parse, format, differenceInDays, isValid, addDays, eachMonthOfInterval, isSameMonth } from 'date-fns';
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

  const LARGE_TRANSACTION_THRESHOLD = 200; // $200
  const NUMBER_OF_MARKERS = 100;

  const parseDateSafely = (dateString: string) => {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    return isValid(parsedDate) ? parsedDate : new Date();
  };

  const timelineData = useMemo(() => {
    // Filter out $0 amounts and separate credits and debits
    const nonZeroTransactions = expenses.filter(expense => expense.DebitAmount > 0 || expense.CreditAmount > 0);

    if (nonZeroTransactions.length === 0) return { markerTransactions: [], startDate: new Date(), endDate: new Date(), maxDebitAmount: 0, maxCreditAmount: 0 };

    // Sort all non-zero transactions by date
    const sortedTransactions = [...nonZeroTransactions].sort((a, b) => 
      parseDateSafely(a.Date).getTime() - parseDateSafely(b.Date).getTime()
    );

    const dates = sortedTransactions.map(transaction => parseDateSafely(transaction.Date));
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Function to find the nearest transaction to a given date
    const findNearestTransaction = (targetDate: Date) => {
      return sortedTransactions.reduce((nearest, current) => {
        const currentDate = parseDateSafely(current.Date);
        const nearestDate = parseDateSafely(nearest.Date);
        return Math.abs(differenceInDays(currentDate, targetDate)) < Math.abs(differenceInDays(nearestDate, targetDate))
          ? current
          : nearest;
      });
    };

    // Select markers based on NUMBER_OF_MARKERS
    const markerTransactions = [];
    const interval = (sortedTransactions.length - 1) / (NUMBER_OF_MARKERS - 1);
    for (let i = 0; i < NUMBER_OF_MARKERS; i++) {
      const index = Math.round(i * interval);
      markerTransactions.push(sortedTransactions[index]);
    }

    const maxDebitAmount = Math.max(0, ...sortedTransactions.map(transaction => transaction.DebitAmount));
    const maxCreditAmount = Math.max(0, ...sortedTransactions.map(transaction => transaction.CreditAmount));

    return { markerTransactions, startDate, endDate, maxDebitAmount, maxCreditAmount };
  }, [expenses, NUMBER_OF_MARKERS]);

  const { markerTransactions, startDate, endDate, maxDebitAmount, maxCreditAmount } = timelineData;

  const formatDate = (date: Date) => {
    return format(date, 'dd-MM-yyyy');
  };

  const daysDifference = differenceInDays(endDate, startDate);

  // Generate date markers
  const dateMarkers = useMemo(() => {
    if (!startDate || !endDate) return [];
    return eachMonthOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  if (!timelineData.markerTransactions.length) return null;

  const timelineMarkers = markerTransactions.map((transaction, index) => {
    const date = parseDateSafely(transaction.Date);
    const position = Math.max(0, Math.min(100, (differenceInDays(date, startDate) / daysDifference) * 100));
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

  const dateMarkerElements = dateMarkers.map((date, index) => {
    const position = Math.max(0, Math.min(100, (differenceInDays(date, startDate) / daysDifference) * 100));
    return (
      <div
        key={`date-marker-${index}`}
        className="absolute text-xs text-gray-500"
        style={{
          left: `${position}%`,
          bottom: '-25px',
          transform: 'translateX(-50%)',
        }}
      >
        {format(date, 'MMM')} {/* Always show month abbreviation */}
      </div>
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
              <div className="h-32 bg-gray-100 overflow-visible relative mb-8">
                {timelineMarkers}
                {dateMarkerElements}
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
