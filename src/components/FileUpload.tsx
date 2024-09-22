import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  onFileContentChange: (content: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileContentChange }) => {
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
    <div className="mb-4">
      <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
        Upload CSV File
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
    </div>
  );
};

export default FileUpload;