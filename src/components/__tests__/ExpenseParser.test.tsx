import { Expense } from '../../types/expense';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Import the function we want to test
import { identifyRecurringTransactions } from '../ExpenseParser';

describe('identifyRecurringTransactions', () => {
  let testExpenses: Expense[];

  beforeAll(() => {
    // Read the CSV file
    const csvFilePath = path.join(__dirname, 'recurring_transactions_test.csv');
    const csvFile = fs.readFileSync(csvFilePath, 'utf8');

    // Parse the CSV data
    const parsedData = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    // Convert the parsed data to Expense objects
    testExpenses = parsedData.data.map((row: any) => ({
      Date: row.Date,
      Narrative: row.Narrative,
      DebitAmount: parseFloat(row['Debit Amount']),
      CreditAmount: parseFloat(row['Credit Amount']),
      Category: row.Category,
      IsRecurring: false,
    }));
    console.log('testExpenses count', testExpenses.length);
  });

  test('correctly identifies recurring transactions', () => {
    const result = identifyRecurringTransactions(testExpenses);
    // console.log('Result:', result);
    console.log('result length:', result.length);
    

    // Check if the function identified any recurring transactions
    const recurringTransactions = result.filter(expense => expense.IsRecurring);
    console.log('recurringTransactions count', recurringTransactions.length);
    expect(recurringTransactions.length).toBe(193);

  });

  test('handles empty input', () => {
    const result = identifyRecurringTransactions([]);
    expect(result).toEqual([]);
  });

  test('handles single transaction', () => {
    const singleTransaction: Expense = {
      Date: '2023-01-01',
      Narrative: 'Single Transaction',
      DebitAmount: 100,
      CreditAmount: 0,
      Category: 'Other',
      IsRecurring: false,
    };
    const result = identifyRecurringTransactions([singleTransaction]);
    expect(result).toEqual([singleTransaction]);
  });
});