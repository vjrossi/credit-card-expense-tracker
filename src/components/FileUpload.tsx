import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  onFileContentChange: (content: string) => void;
  ignoreZeroTransactions: boolean;
  onIgnoreZeroTransactionsChange: (ignore: boolean) => void;
  isFileUploaded: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileContentChange, ignoreZeroTransactions, onIgnoreZeroTransactionsChange, isFileUploaded }) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContentChange(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex items-center justify-between w-full mb-4">
        <label htmlFor="ignore-zero-transactions" className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              id="ignore-zero-transactions"
              className="sr-only peer"
              checked={ignoreZeroTransactions}
              onChange={(e) => onIgnoreZeroTransactionsChange(e.target.checked)}
              disabled={isFileUploaded}
            />
            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-700 peer-disabled:text-gray-400">Ignore $0 transactions</span>
        </label>
      </div>
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500">CSV file only</p>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default FileUpload;