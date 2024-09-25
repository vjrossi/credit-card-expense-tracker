import React, { ChangeEvent, useState, DragEvent } from 'react';
import { Form } from 'react-bootstrap';

interface FileUploadProps {
  onFileContentChange: (content: string) => void;
  ignoreZeroTransactions: boolean;
  onIgnoreZeroTransactionsChange: (ignore: boolean) => void;
  isFileUploaded: boolean;
  setIsUploadSectionExpanded: (isExpanded: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileContentChange, ignoreZeroTransactions, onIgnoreZeroTransactionsChange, isFileUploaded, setIsUploadSectionExpanded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContentChange(content);
        setIsUploadSectionExpanded(false);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileContentChange(content);
        setIsUploadSectionExpanded(false);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <Form.Check
        type="switch"
        id="ignore-zero-transactions"
        label="Ignore zero transactions"
        checked={ignoreZeroTransactions}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onIgnoreZeroTransactionsChange(e.target.checked)}
        className="mb-3"
      />
      <label
        htmlFor="file-upload"
        className={`d-flex flex-column align-items-center justify-content-center p-5 border border-2 rounded ${
          isDragging ? 'border-primary bg-light' : 'border-secondary'
        } bg-light`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <i className="bi bi-cloud-upload fs-1 mb-3"></i>
          <p className="mb-2">
            <span className="fw-bold">Click to upload</span> or drag and drop
          </p>
          <p className="text-muted small">CSV file only</p>
        </div>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="d-none"
        />
      </label>
    </div>
  );
};

export default FileUpload;