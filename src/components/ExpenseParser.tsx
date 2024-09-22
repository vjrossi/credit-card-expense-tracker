import React, { useEffect } from 'react';
import Papa from 'papaparse';
import { Expense } from '../types/expense';
import { parse, differenceInDays, isValid } from 'date-fns';

interface ExpenseParserProps {
  fileContent: string;
  onParsedExpenses: (expenses: Expense[], recurringCount: number) => void;
}

const categorizeExpense = (narrative: string): string => {
  if (narrative.toLowerCase().includes('woolworths')) return 'Groceries';
  if (narrative.toLowerCase().includes('amazon')) return 'Shopping';
  if (narrative.toLowerCase().includes('paypal')) return 'Online Services';
  if (narrative.toLowerCase().includes('energy')) return 'Utilities';
  if (narrative.toLowerCase().includes('insurance')) return 'Insurance';
  // Add more categorization rules as needed
  return 'Other';
};

const ExpenseParser: React.FC<ExpenseParserProps> = ({ fileContent, onParsedExpenses }) => {
  useEffect(() => {
    if (fileContent) {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data.map((row: any) => {
            const dateString = row.Date || '';
            const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
            
            const expense: Expense = {
              Date: isValid(parsedDate) ? parsedDate.toISOString().split('T')[0] : '',
              Narrative: row.Narrative || '',
              DebitAmount: parseFloat(row['Debit Amount'] || '0'),
              CreditAmount: parseFloat(row['Credit Amount'] || '0'),
              Category: categorizeExpense(row.Narrative || ''),
              IsRecurring: false, // We'll set this to false initially
            };
            return expense;
          });

          const dataWithRecurring = identifyRecurringTransactions(parsedData);
          const recurringCount = dataWithRecurring.filter(expense => expense.IsRecurring).length;
          onParsedExpenses(dataWithRecurring, recurringCount);
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
        },
      });
    }
  }, [fileContent, onParsedExpenses]);

  return null; // Remove the rendering of parsed expenses
};

const identifyRecurringTransactions = (expenses: Expense[]): Expense[] => {
  const transactionMap: Record<string, Expense[]> = {};

  // Group transactions by narrative and amount
  expenses.forEach(expense => {
    const key = `${expense.Narrative}-${expense.DebitAmount.toFixed(2)}`;
    if (!transactionMap[key]) {
      transactionMap[key] = [];
    }
    transactionMap[key].push(expense);
  });

  // Identify recurring transactions
  const recurringTransactions: Set<string> = new Set();

  Object.entries(transactionMap).forEach(([key, transactions]) => {
    if (transactions.length > 1) {
      // Sort transactions by date
      transactions.sort((a, b) => parse(a.Date, 'yyyy-MM-dd', new Date()).getTime() - parse(b.Date, 'yyyy-MM-dd', new Date()).getTime());

      // Check for regular intervals
      const intervals: number[] = [];
      for (let i = 1; i < transactions.length; i++) {
        const daysDiff = differenceInDays(
          parse(transactions[i].Date, 'yyyy-MM-dd', new Date()),
          parse(transactions[i-1].Date, 'yyyy-MM-dd', new Date())
        );
        intervals.push(daysDiff);
      }

      // Check if intervals are consistent (allow for some variation)
      const isRegular = intervals.every(interval => 
        Math.abs(interval - intervals[0]) <= 5 || // Allow 5 days variation for monthly
        Math.abs(interval - intervals[0]) <= 10 // Allow 10 days variation for quarterly
      );

      if (isRegular) {
        recurringTransactions.add(key);
      }
    }
  });

  // Mark recurring transactions
  return expenses.map(expense => {
    const key = `${expense.Narrative}-${expense.DebitAmount.toFixed(2)}`;
    return { ...expense, IsRecurring: recurringTransactions.has(key) };
  });
};

export default ExpenseParser;