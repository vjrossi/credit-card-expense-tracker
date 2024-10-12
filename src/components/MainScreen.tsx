import React, { useState, useCallback, useEffect } from 'react';
import { Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import FileUpload from './FileUpload';
import ExpenseParser from './ExpenseParser';
import ExpenseVisualizer from './ExpenseVisualizer';
import { Expense } from '../types/expense';
import TransactionTimespan from './TransactionTimespan';
import { CategoryColorMap } from '../types/categoryColorMap';
import RecurringTransactionNotification from './RecurringTransactionNotification';
import DevPage from './DevPage';
import { logToDevPage } from '../utils/logger';
import { DUMMY_QIF_DATA } from '../constants/dummyData';
import { AccountType } from '../types/AccountType';
import BalanceChart from './BalanceChart';

const MainScreen: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryColorMap, setCategoryColorMap] = useState<CategoryColorMap>({});
  const [recurringCount, setRecurringCount] = useState<number>(0);
  const [recurringTransactions, setRecurringTransactions] = useState<Expense[]>([]);
  const [showDevPage, setShowDevPage] = useState<boolean>(false);
  const [ignoreZeroTransactions, setIgnoreZeroTransactions] = useState<boolean>(true);
  const [isFileUploaded, setIsFileUploaded] = useState<boolean>(false);
  const [isFileUploadExpanded, setIsFileUploadExpanded] = useState(true);
  const [showUploadAlert, setShowUploadAlert] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecurringTransactionsExpanded, setIsRecurringTransactionsExpanded] = useState(false);
  const [isTransactionTimespanExpanded, setIsTransactionTimespanExpanded] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [finalBalance, setFinalBalance] = useState<number | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [showResetButton, setShowResetButton] = useState<boolean>(false);
  const [savedBalance, setSavedBalance] = useState<{ balance: number; date: string } | null>(null);

  const clearDevLogs = useCallback(() => {
    localStorage.removeItem('devLogs');
    setShowDevPage(false);
  }, []);

  const handleParsedExpenses = useCallback((parsedExpenses: Expense[], recurringCount: number) => {
    setErrorMessage(null);
    logToDevPage(`Received ${parsedExpenses.length} parsed expenses with ${recurringCount} recurring transactions`);
    setExpenses(parsedExpenses);
    setRecurringCount(recurringCount);
    setRecurringTransactions(parsedExpenses.filter(expense => expense.IsRecurring));
    setShowUploadAlert(true);
    setFinalBalance(null);
    
    const savedBalanceString = localStorage.getItem('savedBalance');
    if (savedBalanceString) {
      const saved = JSON.parse(savedBalanceString);
      setSavedBalance(saved);
      
      if (parsedExpenses.length > 0 && parsedExpenses[parsedExpenses.length - 1].Date === saved.date) {
        setBalanceInput(saved.balance.toString());
      } else {
        setBalanceInput('');
      }
    } else {
      setBalanceInput('');
      setSavedBalance(null);
    }
  }, []);

  const handleParseError = useCallback((error: string) => {
    setErrorMessage(error);
    setExpenses([]);
    setRecurringCount(0);
    setRecurringTransactions([]);
  }, []);

  const handleFileContentChange = useCallback((content: string, newAccountType: AccountType) => {
    setFileContent(content);
    setAccountType(newAccountType);
    setIsFileUploaded(true);
    setShowUploadAlert(true);
    setErrorMessage(null);
    setShowResetButton(true);
    setFinalBalance(null);
    setBalanceInput('');
    setSavedBalance(null);
  }, []);

  const handleImportDummyData = useCallback(() => {
    handleFileContentChange(DUMMY_QIF_DATA, AccountType.BANK);
  }, [handleFileContentChange]);

  const handleBalanceSubmit = () => {
    const parsedBalance = parseFloat(balanceInput);
    if (!isNaN(parsedBalance) && parsedBalance > 0) {
      setFinalBalance(parsedBalance);
      
      const lastTransactionDate = expenses[expenses.length - 1]?.Date;
      if (lastTransactionDate) {
        const newSavedBalance = { balance: parsedBalance, date: lastTransactionDate };
        setSavedBalance(newSavedBalance);
        localStorage.setItem('savedBalance', JSON.stringify(newSavedBalance));
      }
    } else {
      console.error('Invalid balance input');
      // Optionally, you could set an error state here to display to the user
      // setBalanceError('Please enter a valid positive number');
    }
  };

  const handleReset = useCallback(() => {
    setFileContent('');
    setExpenses([]);
    setCategoryColorMap({});
    setRecurringCount(0);
    setRecurringTransactions([]);
    setIgnoreZeroTransactions(true);
    setIsFileUploaded(false);
    setIsFileUploadExpanded(true);
    setShowUploadAlert(false);
    setErrorMessage(null);
    setIsRecurringTransactionsExpanded(false);
    setIsTransactionTimespanExpanded(false);
    setAccountType(null);
    setFinalBalance(null);
    setBalanceInput('');
    setShowResetButton(false);
  }, []);

  // Add this useEffect to handle the alert timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showUploadAlert) {
      timeoutId = setTimeout(() => {
        setShowUploadAlert(false);
      }, 10000); // 10 seconds
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showUploadAlert]);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      <header className="bg-primary text-white shadow-sm">
        <div className="container py-4 px-3 d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0 d-flex align-items-center">
            ZZZQuick Transaction Analyser
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip id="category-info-tooltip">
                  Note: The built-in categories are weighted towards Australian stores and businesses, but many will apply elsewhere.
                </Tooltip>
              }
            >
              <span className="ms-2">
                <FaInfoCircle />
              </span>
            </OverlayTrigger>
          </h1>
          {showResetButton && (
            <button
              onClick={handleReset}
              className="btn btn-outline-light"
            >
              Start Over
            </button>
          )}
        </div>
      </header>
      <main className="flex-grow-1 container pt-5">
        {showDevPage && <DevPage onClearLogs={clearDevLogs} />}
        <FileUpload
          onFileContentChange={handleFileContentChange}
          ignoreZeroTransactions={ignoreZeroTransactions}
          onIgnoreZeroTransactionsChange={setIgnoreZeroTransactions}
          isFileUploaded={isFileUploaded}
          isExpanded={isFileUploadExpanded}
          setIsExpanded={setIsFileUploadExpanded}
          onImportDummyData={handleImportDummyData}
        />
        {showUploadAlert && !errorMessage && (
          <Alert variant="success" onClose={() => setShowUploadAlert(false)} dismissible className="mt-2">
            File uploaded and parsed successfully! You can upload a new file if needed.
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="danger" className="mt-3">
            {errorMessage}
          </Alert>
        )}
        <ExpenseParser
          fileContent={fileContent}
          accountType={accountType}
          onParsedExpenses={handleParsedExpenses}
          onParseError={handleParseError}
          ignoreZeroTransactions={ignoreZeroTransactions}
        />
        {expenses.length > 0 && (
          <>
            <RecurringTransactionNotification
              count={recurringCount}
              recurringTransactions={recurringTransactions}
              categoryColorMap={categoryColorMap}
              isExpanded={isRecurringTransactionsExpanded}
              setIsExpanded={setIsRecurringTransactionsExpanded}
            />
            <TransactionTimespan
              expenses={expenses}
              categoryColorMap={categoryColorMap}
              isExpanded={isTransactionTimespanExpanded}
              setIsExpanded={setIsTransactionTimespanExpanded}
            />
            <div className="bg-white shadow-sm rounded p-4">
              <ExpenseVisualizer expenses={expenses} setCategoryColorMap={setCategoryColorMap} />
            </div>
            {accountType === AccountType.BANK && expenses.length > 0 && (
              <div className="mt-4 bg-white shadow-sm rounded p-4">
                {finalBalance === null && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Enter Final Balance</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Please enter your account balance as of the last transaction date ({expenses[expenses.length - 1].Date}).
                    </p>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded px-2 py-1 mr-2"
                        placeholder="Enter final balance"
                        value={balanceInput}
                        onChange={(e) => setBalanceInput(e.target.value)}
                      />
                      <button
                        className="bg-blue-500 text-white px-4 py-1 rounded"
                        onClick={handleBalanceSubmit}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                {finalBalance !== null && (
                  <BalanceChart expenses={expenses} finalBalance={finalBalance} />
                )}
              </div>
            )}
          </>
        )}
      </main>
      <footer className="bg-dark text-white py-3">
        <div className="container text-center">
          <p className="mb-0">&copy; 2024 Valentino Rossi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainScreen;
