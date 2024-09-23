import React, { useState, useEffect } from 'react';
import { logToDevPage } from '../utils/logger';

interface LogEntry {
  timestamp: string;
  message: string;
}

interface DevPageProps {
  onClearLogs: () => void;
}

const DevPage: React.FC<DevPageProps> = ({ onClearLogs }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('devLogs');
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      setLogs([]);
    }
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('devLogs');
    setLogs([]);
    logToDevPage('Logs cleared');
    onClearLogs();
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => `${log.timestamp}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      logToDevPage('Logs copied to clipboard');
    }, (err) => {
      console.error('Could not copy logs: ', err);
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">Dev Logs</h2>
        <div>
          <button
            onClick={copyLogsToClipboard}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            disabled={logs.length === 0}
          >
            Copy to Clipboard
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            disabled={logs.length === 0}
          >
            Clear Logs
          </button>
        </div>
      </div>
      {logs.length === 0 ? (
        <p className="text-gray-600 text-center">No logs available.</p>
      ) : (
        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-2">
              <span className="font-mono text-sm text-gray-500">{log.timestamp}</span>
              <span className="ml-2">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevPage;