export const logToDevPage = (message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message };
    
    const storedLogs = localStorage.getItem('devLogs');
    const logs = storedLogs ? JSON.parse(storedLogs) : [];
    logs.push(logEntry);
    
    localStorage.setItem('devLogs', JSON.stringify(logs.slice(-100))); // Keep only the last 100 logs
  };