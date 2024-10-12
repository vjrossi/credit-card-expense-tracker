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
    // console.log('[ExpenseParser] list:', list);
    return list.some(item => lowercaseNarrative.includes(item.toLowerCase()));
  };

  // Log the narrative for debugging
  console.log(`[ExpenseParser] Categorizing narrative: ${narrative}`);

  if (matchCategory(GROCERY_STORES)) {
    console.log(`[ExpenseParser] Categorized as Groceries`);
    return 'Groceries';
  }
  if (matchCategory(INSURANCE_COMPANIES)) {
    console.log(`[ExpenseParser] Categorized as Insurance`);
    return 'Insurance';
  }
  if (matchCategory(UTILITIES)) {
    console.log(`[ExpenseParser] Categorized as Utilities`);
    return 'Utilities';
  }
  if (matchCategory(DIGITAL_ENTERTAINMENT)) {
    console.log(`[ExpenseParser] Categorized as Digital Entertainment`);
    return 'Digital Entertainment';
  }
  if (matchCategory(INTERNET_SERVICE_PROVIDERS)) {
    console.log(`[ExpenseParser] Categorized as Online Services`);
    return 'Online Services';
  }
  if (matchCategory(FAST_FOOD_RESTAURANTS)) {
    console.log(`[ExpenseParser] Categorized as Eating Out`);
    return 'Eating Out';
  }
  if (matchCategory(OTHER_GOODS)) {
    console.log(`[ExpenseParser] Categorized as Other Goods`);
    return 'Other Goods';
  }

  // Additional generic checks
  if (lowercaseNarrative.includes('grocery') || lowercaseNarrative.includes('supermarket')) {
    console.log(`[ExpenseParser] Categorized as Groceries (generic)`);
    return 'Groceries';
  }
  if (lowercaseNarrative.includes('insurance')) {
    console.log(`[ExpenseParser] Categorized as Insurance (generic)`);
    return 'Insurance';
  }
  if (lowercaseNarrative.includes('utility') || lowercaseNarrative.includes('energy') || lowercaseNarrative.includes('water') || lowercaseNarrative.includes('gas')) {
    console.log(`[ExpenseParser] Categorized as Utilities (generic)`);
    return 'Utilities';
  }
  if (lowercaseNarrative.includes('entertainment') || lowercaseNarrative.includes('streaming') || lowercaseNarrative.includes('subscription')) {
    console.log(`[ExpenseParser] Categorized as Digital Entertainment (generic)`);
    return 'Digital Entertainment';
  }
  if (lowercaseNarrative.includes('internet') || lowercaseNarrative.includes('broadband') || lowercaseNarrative.includes('mobile')) {
    console.log(`[ExpenseParser] Categorized as Online Services (generic)`);
    return 'Online Services';
  }
  if (lowercaseNarrative.includes('restaurant') || lowercaseNarrative.includes('cafe') || lowercaseNarrative.includes('food')) {
    console.log(`[ExpenseParser] Categorized as Eating Out (generic)`);
    return 'Eating Out';
  }
  if (lowercaseNarrative.includes('shopping') || lowercaseNarrative.includes('store') || lowercaseNarrative.includes('retail')) {
    console.log(`[ExpenseParser] Categorized as Other Goods (generic)`);
    return 'Other Goods';
  }

  console.log(`[ExpenseParser] Categorized as Other`);
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
      case 'M':  // Changed from 'P' to 'M' for QIF format
        currentExpense.Narrative = value;
        break;
      case 'L':  // Added case for 'L' type (category in QIF)
        currentExpense.Category = value;
        break;
      case '^':
        if (currentExpense.Date && (currentExpense.DebitAmount !== undefined || currentExpense.CreditAmount !== undefined)) {
          const debitAmount = currentExpense.DebitAmount || 0;
          const creditAmount = currentExpense.CreditAmount || 0;
          const isZeroTransaction = (debitAmount === 0 && creditAmount === 0);
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
          } else {
          }
        } else {
        }
        currentExpense = {};
        break;
    }
  }

  console.log(`[ExpenseParser] Parsing complete. Total expenses parsed: ${expenses.length}`);
  return expenses;
};

const parseDate = (dateString: string): string => {
  const parsedDate = parse(dateString, "dd/MM/yyyy", new Date());
  if (isValid(parsedDate)) {
    const formattedDate = format(parsedDate, 'yyyy-MM-dd');
    console.log(`[ExpenseParser] Parsed date string "${dateString}" to "${formattedDate}"`);
    return formattedDate;
  } else {
    console.warn(`Invalid date string: "${dateString}"`);
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