import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ExpenseParser from './components/ExpenseParser';
import ExpenseVisualizer from './components/ExpenseVisualizer';
import { Expense } from './types/expense';
import TransactionTimespan from './components/TransactionTimespan';
import { CategoryColorMap } from './types/categoryColorMap';
import RecurringTransactionNotification from './components/RecurringTransactionNotification';
import DevPage from './components/DevPage';
import { logToDevPage } from './utils/logger';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryColorMap, setCategoryColorMap] = useState<CategoryColorMap>({});
  const [recurringCount, setRecurringCount] = useState<number>(0);
  const [recurringTransactions, setRecurringTransactions] = useState<Expense[]>([]);
  const [showDevPage, setShowDevPage] = useState<boolean>(false);
  const [hasLogs, setHasLogs] = useState<boolean>(false);
  const [ignoreZeroTransactions, setIgnoreZeroTransactions] = useState<boolean>(false);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);

  const clearDevLogs = useCallback(() => {
    localStorage.removeItem('devLogs');
    setHasLogs(false);
    setShowDevPage(false);
  }, []);

  useEffect(() => {
    const storedLogs = localStorage.getItem('devLogs');
    setHasLogs(!!storedLogs);
  }, []);

  const handleParsedExpenses = useCallback((parsedExpenses: Expense[], recurringCount: number) => {
    logToDevPage(`Received ${parsedExpenses.length} parsed expenses with ${recurringCount} recurring transactions`);
    setExpenses(parsedExpenses);
    setRecurringCount(recurringCount);
    setRecurringTransactions(parsedExpenses.filter(expense => expense.IsRecurring));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Credit Card Expense Tracker</h1>
          <button
            onClick={() => setShowDevPage(!showDevPage)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {showDevPage ? 'Hide Dev Page' : 'Show Dev Page'}
          </button>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-6 py-8">
        {showDevPage && <DevPage onClearLogs={clearDevLogs} />}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 transition-all duration-300 hover:shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload Your Statement</h2>
          <p className="text-gray-600 mb-4">
            To use this expense tracker, please export a transaction list or statement from your bank in CSV format. Most banks offer this option in their online banking portal.
          </p>
          <FileUpload
            onFileContentChange={(content) => {
              setFileContent(content);
              setIsFileUploaded(true);
            }}
            ignoreZeroTransactions={ignoreZeroTransactions}
            onIgnoreZeroTransactionsChange={setIgnoreZeroTransactions}
            isFileUploaded={isFileUploaded}
          />        </div>
        <ExpenseParser fileContent={fileContent} onParsedExpenses={handleParsedExpenses} ignoreZeroTransactions={ignoreZeroTransactions} />
        {expenses.length > 0 && (
          <>
            <RecurringTransactionNotification
              count={recurringCount}
              recurringTransactions={recurringTransactions}
              categoryColorMap={categoryColorMap}
            />
            <TransactionTimespan expenses={expenses} categoryColorMap={categoryColorMap} />
            <div className="bg-white shadow-md rounded-lg p-6 transition-all duration-300 hover:shadow-lg">
              <ExpenseVisualizer expenses={expenses} setCategoryColorMap={setCategoryColorMap} />
            </div>
          </>
        )}
      </main>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 Credit Card Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
