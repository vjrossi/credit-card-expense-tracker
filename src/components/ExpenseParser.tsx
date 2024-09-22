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

  // Group transactions by narrative only
  expenses.forEach(expense => {
    const key = expense.Narrative;
    if (!transactionMap[key]) {
      transactionMap[key] = [];
    }
    transactionMap[key].push(expense);
  });

  const recurringTransactions: Set<string> = new Set();

  Object.entries(transactionMap).forEach(([key, transactions]) => {
    if (transactions.length >= 2) {
      // Sort transactions by date
      transactions.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

      // Check for regular intervals
      const intervals: number[] = [];
      for (let i = 1; i < transactions.length; i++) {
        const daysDiff = differenceInDays(
          new Date(transactions[i].Date),
          new Date(transactions[i-1].Date)
        );
        intervals.push(daysDiff);
      }

      // Check if intervals are consistent with monthly billing (allowing for more flexibility)
      const isMonthly = intervals.every(interval => 
        (interval >= 20 && interval <= 40) || // Normal monthly interval with more flexibility
        (interval >= 1 && interval <= 10) || // Same month or very close months
        (interval >= 50 && interval <= 70) // Skipped a month due to same-month occurrences
      );

      // Check for similar amounts (allowing 25% variation)
      const amounts = transactions.map(t => t.DebitAmount);
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const hasSimilarAmounts = amounts.every(amount => 
        Math.abs(amount - averageAmount) <= averageAmount * 0.25
      );

      // Mark as recurring if it's monthly or has at least 3 occurrences with similar amounts
      if (isMonthly || (transactions.length >= 3 && hasSimilarAmounts)) {
        recurringTransactions.add(key);
      }
    }
  });

  // Mark recurring transactions
  return expenses.map(expense => ({
    ...expense,
    IsRecurring: recurringTransactions.has(expense.Narrative)
  }));
};

export default ExpenseParser;