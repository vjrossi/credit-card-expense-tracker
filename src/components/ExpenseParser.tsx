import React, { useEffect } from 'react';
import { Expense } from '../types/expense';
import { parse, differenceInDays, isValid, format } from 'date-fns';
import { GROCERY_STORES, INSURANCE_COMPANIES, UTILITIES, DIGITAL_ENTERTAINMENT, INTERNET_SERVICE_PROVIDERS, FAST_FOOD_RESTAURANTS, OTHER_GOODS } from '../constants/expenseCategories';
import { AccountType } from '../types/AccountType';

interface ExpenseParserProps {
  fileContent: string;
  accountType: AccountType | null;
  onParsedExpenses: (expenses: Expense[], recurringCount: number) => void;
  onParseError: (error: string) => void;
  ignoreZeroTransactions: boolean;
}

const categorizeExpense = (narrative: string): string => {
  const lowercaseNarrative = narrative.toLowerCase();

  const matchCategory = (list: string[]): boolean => {
    return list.some(item => lowercaseNarrative.includes(item.toLowerCase()));
  };

  const categories = [
    { list: GROCERY_STORES, label: 'Groceries' },
    { list: INSURANCE_COMPANIES, label: 'Insurance' },
    { list: UTILITIES, label: 'Utilities' },
    { list: DIGITAL_ENTERTAINMENT, label: 'Digital Entertainment' },
    { list: INTERNET_SERVICE_PROVIDERS, label: 'Online Services' },
    { list: FAST_FOOD_RESTAURANTS, label: 'Eating Out' },
    { list: OTHER_GOODS, label: 'Other Goods' }
  ];

  for (const { list, label } of categories) {
    if (matchCategory(list)) {
      return label;
    }
  }

  // Additional generic checks
  const genericChecks = [
    { keywords: ['grocery', 'supermarket'], label: 'Groceries' },
    { keywords: ['insurance'], label: 'Insurance' },
    { keywords: ['utility', 'energy', 'water', 'gas'], label: 'Utilities' },
    { keywords: ['entertainment', 'streaming', 'subscription'], label: 'Digital Entertainment' },
    { keywords: ['internet', 'broadband', 'mobile'], label: 'Online Services' },
    { keywords: ['restaurant', 'cafe', 'food'], label: 'Eating Out' },
    { keywords: ['shopping', 'store', 'retail'], label: 'Other Goods' }
  ];

  for (const { keywords, label } of genericChecks) {
    if (keywords.some(keyword => lowercaseNarrative.includes(keyword))) {
      return label;
    }
  }

  return 'Other';
};

const ExpenseParser: React.FC<ExpenseParserProps> = ({ fileContent, accountType, onParsedExpenses, onParseError, ignoreZeroTransactions }) => {
  useEffect(() => {
    if (fileContent && accountType) {
      try {
        const parsedExpenses = parseQIF(fileContent, ignoreZeroTransactions, accountType);
        const dataWithRecurring = identifyRecurringTransactions(parsedExpenses);
        const recurringCount = dataWithRecurring.filter(expense => expense.IsRecurring).length;
        onParsedExpenses(dataWithRecurring, recurringCount);
      } catch (error) {
        onParseError("Error reading the file. It must be in QIF format.");
      }
    }
  }, [fileContent, accountType, onParsedExpenses, onParseError, ignoreZeroTransactions]);

  return null;
};

const parseQIF = (content: string, ignoreZeroTransactions: boolean, accountType: AccountType | null): Expense[] => {
  const lines = content.split('\n');
  const expenses: Expense[] = [];
  let currentExpense: Partial<Expense> = {};

  for (const line of lines) {
    const type = line[0];
    const value = line.slice(1).trim();

    switch (type) {
      case 'D':
        currentExpense.Date = parseDate(value);
        break;
      case 'T':
        const amount = parseFloat(value);
        if (amount < 0) {
          currentExpense.DebitAmount = Math.abs(amount);
          currentExpense.CreditAmount = 0;
        } else {
          currentExpense.DebitAmount = 0;
          currentExpense.CreditAmount = amount;
        }
        break;
      case 'M':
        currentExpense.Narrative = value;
        break;
      case 'L':
        currentExpense.Category = value;
        break;
      case '^':
        if (currentExpense.Date && (currentExpense.DebitAmount !== undefined || currentExpense.CreditAmount !== undefined)) {
          const debitAmount = currentExpense.DebitAmount || 0;
          const creditAmount = currentExpense.CreditAmount || 0;
          const isZeroTransaction = Math.abs(debitAmount - creditAmount) < 0.001; // Use a small threshold for floating-point comparison

          if (!(ignoreZeroTransactions && isZeroTransaction)) {
            const expense: Expense = {
              Date: currentExpense.Date,
              Narrative: currentExpense.Narrative || '',
              DebitAmount: debitAmount,
              CreditAmount: creditAmount,
              Category: categorizeExpense(currentExpense.Narrative || ''),
              IsRecurring: false,
            };
            expenses.push(expense);
          }
        }
        currentExpense = {};
        break;
    }
  }

  return expenses;
};

const parseDate = (dateString: string): string => {
  const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
  if (isValid(parsedDate)) {
    const formattedDate = format(parsedDate, 'yyyy-MM-dd');
    return formattedDate;
  } else {
    return '';
  }
};

export const identifyRecurringTransactions = (expenses: Expense[]): Expense[] => {
  const recurringThreshold = 25; // days
  const narrativeMap: { [key: string]: Expense[] } = {};

  // Group expenses by narrative
  expenses.forEach(expense => {
    if (!narrativeMap[expense.Narrative]) {
      narrativeMap[expense.Narrative] = [];
    }
    narrativeMap[expense.Narrative].push(expense);
  });

  // Identify recurring transactions
  Object.values(narrativeMap).forEach(group => {
    if (group.length > 1) {
      group.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

      for (let i = 1; i < group.length; i++) {
        const daysDifference = differenceInDays(new Date(group[i].Date), new Date(group[i - 1].Date));
        if (daysDifference >= recurringThreshold && daysDifference <= recurringThreshold + 5) {
          group[i].IsRecurring = true;
          group[i - 1].IsRecurring = true;
        }
      }
    }
  });

  return expenses;
};

export default ExpenseParser;
