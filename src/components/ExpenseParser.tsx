import React, { useEffect } from 'react';
import Papa from 'papaparse';
import { Expense } from '../types/expense';
import { parse, differenceInDays, isValid } from 'date-fns';

interface ExpenseParserProps {
  fileContent: string;
  onParsedExpenses: (expenses: Expense[], recurringCount: number) => void;
  ignoreZeroTransactions: boolean;
}

const GROCERY_STORES = [
  'woolworths', 'coles', 'aldi', 'iga', 'foodworks', 'harris farm', 'costco',
  'spar', 'foodland', 'drakes', 'romeo\'s', 'supabarn', 'leo\'s fine food',
  'ritchies', 'fresh provisions', 'farmer jack\'s', 'spudshed',
  '7-eleven', 'night owl', 'nrma food', 'bp shop', 'caltex woolworths',
  'coles express', 'metro', 'uchoose', 'friendly grocer',
  'supa iga', 'xpress', 'nqr', 'cheap as chips', 'save more',
  'wray organic', 'flannery\'s', 'the source bulk foods', 'goodies and grains',
  'lettuce deliver', 'fruitezy', 'fresh st market', 'fresh pantry', 'fresh choice',
  'foodary', 'ezy mart', 'quickstop', 'on the run', 'otr', 'starmart',
  'ampol foodary', 'united petroleum'
];

const INSURANCE_COMPANIES = [
  'allianz', 'aami', 'bupa', 'medibank', 'nib', 'qbe', 'suncorp', 'youi',
  'budget direct', 'hcf', 'ahm', 'apia', 'cgu', 'gio', 'racv', 'racq', 'rac',
  'nrma insurance', 'real insurance', 'woolworths insurance', 'coles insurance',
  'australia post insurance', 'virgin money insurance', 'comminsure',
  'hbf', 'hif', 'frank health insurance', 'gmhba', 'defence health',
  'teachers health', 'nurses & midwives health', 'westfund', 'peoplecare',
  'australian unity', 'cbhs', 'rt health', 'navy health', 'police health',
  'emergency services health', 'doctors\' health fund', 'onemedifund',
  'health care insurance', 'health partners', 'latrobe health services',
  'mildura health fund', 'phoenix health fund', 'qantas insurance',
  'st.luke\'s health', 'transport health', 'uni-health insurance',
  'westpac insurance', 'anz insurance', 'nab insurance', 'ing insurance',
  'bendigo bank insurance', 'bank of melbourne insurance', 'bank sa insurance',
  'st.george insurance', 'insurance australia group', 'zurich australia',
  'hollard insurance', 'auto & general insurance', 'progressive insurance',
  'insurance', 'life insurance', 'health insurance', 'car insurance',
  'home insurance', 'contents insurance', 'travel insurance', 'pet insurance',
  'landlord insurance', 'business insurance', 'income protection'
];

const UTILITIES = [
  // Electricity and Gas Retailers
  'origin energy', 'agl', 'energyaustralia', 'alinta energy', 'red energy',
  'simply energy', 'powershop', 'momentum energy', 'lumo energy', 'dodo power & gas',
  'click energy', 'powerdirect', 'diamond energy', 'sumo', 'tango energy',
  'people energy', 'globird energy', 'nectr', 'mojo power', 'energy locals',
  'elysian energy', 'pooled energy', 'qenergy', 'reamenergy', 'actewagl',
  'aurora energy',

  // Water Utilities
  'sydney water', 'melbourne water', 'south east water', 'yarra valley water',
  'western water', 'hunter water', 'sa water', 'water corporation', 'taswater',
  'icon water', 'power and water corporation',

  // Electricity Distributors
  'ergon energy', 'energex', 'western power', 'ausnet services', 'citipower',
  'powercor', 'united energy', 'jemena', 'essential energy', 'endeavour energy',
  'ausgrid', 'evoenergy', 'tasnetworks', 'powerwater', 'horizon power',

  // Gas Distributors
  'multinet gas', 'australian gas networks', 'jemena gas', 'atco gas australia',
  'tas gas networks', 'evoenergy gas',

  // LPG Providers
  'elgas', 'kleenheat', 'origin lpg', 'supagas',

  // Waste Management Companies
  'cleanaway', 'veolia', 'suez', 'remondis', 'jj richards', 'solo resource recovery',
  'sita', 'visy', 'bingo industries', 'toxfree', 'resourceco', 'repurpose it',
  'city circle group', 'alex fraser group', 'polytrade recycling', 'iq renew',
  'skm recycling', 'visy recycling', 'cleanaway recycling'
];

const DIGITAL_ENTERTAINMENT = [
  'netflix', 'stan', 'binge', 'kayo', 'disney+', 'amazon prime',
  'apple tv+', 'britbox', 'hayu', 'paramount+', 'shudder', 'acorn tv',
  'youtube premium', 'curiositystream', 'docplay', 'iwonder',
  'mubi', 'quickflix', 'foxtel now', 'fetch tv', 'telstra tv',
  'optus sport', 'spotify', 'apple music', 'tidal', 'youtube music',
  'deezer', 'soundcloud', 'audible', 'kindle unlimited', 'scribd',
  'playstation plus', 'xbox game pass', 'nintendo switch online',
  'google stadia', 'nvidia geforce now', 'ea play', 'uplay+',
  'crunchyroll', 'animelab', 'funimation', 'twitch',
  'neon', 'vimeo on demand', 'google play movies', 'microsoft movies & tv',
  'abc iview', 'sbs on demand', '7plus', '9now', '10 play'
];

const INTERNET_SERVICE_PROVIDERS = [
  'telstra', 'optus', 'tpg', 'iinet', 'aussie broadband', 'vodafone', 'dodo',
  'belong', 'tangerine', 'mate', 'exetel', 'superloop', 'spintel', 'internode',
  'ipstar', 'skymesh', 'activ8me', 'harbour isp', 'leaptel', 'southern phone',
  'ant communications', 'nbn', 'national broadband network', 'starlink',
  'foxtel broadband', 'amaysim', 'kogan internet', 'aldi mobile', 'boost mobile',
  'lebara', 'lycamobile', 'woolworths mobile', 'coles mobile', 'bendigo telco',
  'commander', 'aussie broadband', 'future broadband', 'tangerine telecom',
  'moose mobile', 'numobile', 'circles.life', 'felix mobile', 'gomo'
];

const RECURRING_CONFIG = {
  MIN_OCCURRENCES: 2,
  MAX_INTERVAL_DAYS: 40,
  AMOUNT_VARIATION_PERCENTAGE: 25,
  MIN_TOTAL_SPAN_DAYS: 20
};

const categorizeExpense = (narrative: string): string => {
  const lowercaseNarrative = narrative.toLowerCase().replace(/\s+/g, '');

  const matchCategory = (category: string[], list: string[]): boolean => {
    return list.some(item => {
      const processedItem = item.toLowerCase().replace(/\s+/g, '');
      return lowercaseNarrative.includes(processedItem);
    });
  };

  if (matchCategory(['grocery', 'supermarket'], GROCERY_STORES)) return 'Groceries';
  if (matchCategory(['insurance'], INSURANCE_COMPANIES)) return 'Insurance';
  if (matchCategory(['utility', 'energy', 'water', 'gas'], UTILITIES)) return 'Utilities';
  if (matchCategory(['entertainment', 'streaming', 'subscription'], DIGITAL_ENTERTAINMENT)) return 'Digital Entertainment';
  if (matchCategory(['internet', 'broadband', 'mobile'], INTERNET_SERVICE_PROVIDERS)) return 'Online Services';

  if (lowercaseNarrative.includes('amazon')) return 'Shopping';
  if (lowercaseNarrative.includes('paypal')) return 'Online Services';

  return 'Other';
};

const ExpenseParser: React.FC<ExpenseParserProps> = ({ fileContent, onParsedExpenses, ignoreZeroTransactions }) => {
  useEffect(() => {
    if (fileContent) {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data
            .map((row: any) => {
              const dateString = row.Date || '';
              const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
              const debitAmount = parseFloat(row['Debit Amount'] || '0');

              if (ignoreZeroTransactions && debitAmount === 0) {
                return null;
              }

              const expense: Expense = {
                Date: isValid(parsedDate) ? parsedDate.toISOString().split('T')[0] : '',
                Narrative: row.Narrative || '',
                DebitAmount: debitAmount,
                CreditAmount: parseFloat(row['Credit Amount'] || '0'),
                Category: categorizeExpense(row.Narrative || ''),
                IsRecurring: false,
              };
              return expense;
            })
            .filter((expense): expense is Expense => expense !== null);
          // Flag recurring transactions
          const dataWithRecurring = identifyRecurringTransactions(parsedData);
          // Count recurring transactions
          const recurringCount = dataWithRecurring.filter(expense => expense.IsRecurring).length;
          onParsedExpenses(dataWithRecurring, recurringCount);
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
        },
      });
    }
  }, [fileContent, onParsedExpenses, ignoreZeroTransactions]);

  return null; // Remove the rendering of parsed expenses
};

export const identifyRecurringTransactions = (expenses: Expense[]): Expense[] => {
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
          new Date(transactions[i - 1].Date)
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