import React, { ChangeEvent, useState, DragEvent } from 'react';
import { Form, Accordion, OverlayTrigger, Tooltip, Button, Modal } from 'react-bootstrap';
import { FaInfoCircle } from 'react-icons/fa';
import { AccountType } from '../types/AccountType';

interface FileUploadProps {
  onFileContentChange: (content: string, accountType: AccountType) => void;
  ignoreZeroTransactions: boolean;
  onIgnoreZeroTransactionsChange: (ignore: boolean) => void;
  isFileUploaded: boolean;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  onImportDummyData: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileContentChange,
  ignoreZeroTransactions,
  onIgnoreZeroTransactionsChange,
  isExpanded,
  setIsExpanded,
  onImportDummyData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        setShowModal(true);
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
        setFileContent(content);
        setShowModal(true);
      };
      reader.readAsText(file);
    }
  };

  const handleAccountTypeSelection = (accountType: AccountType) => {
    if (fileContent) {
      onFileContentChange(fileContent, accountType);
      setIsExpanded(false);
    }
    setShowModal(false);
  };

  return (
    <>
      <Accordion activeKey={isExpanded ? '0' : ''}>
        <Accordion.Item eventKey="0">
          <Accordion.Header onClick={() => setIsExpanded(!isExpanded)}>
            Upload Your Statement
          </Accordion.Header>
          <Accordion.Body>
            <p className="text-muted mb-4">
              To use this expense tracker, please export a transaction list or statement from your bank in QIF format. Most banks offer this option in their online banking portal.
            </p>
            <Form.Check
              type="switch"
              id="ignore-zero-transactions"
              label="Ignore $0 transactions"
              checked={ignoreZeroTransactions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onIgnoreZeroTransactionsChange(e.target.checked)}
              className="mb-3"
            />
            <label
              htmlFor="file-upload"
              className={`d-flex flex-column align-items-center justify-content-center p-5 border border-2 rounded ${isDragging ? 'border-primary bg-light' : 'border-secondary'
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
                <p className="text-muted small d-flex align-items-center justify-content-center">
                  <span>QIF file only</span>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="qif-info-tooltip">
                        QIF (Quicken Interchange Format) file exported from your bank
                      </Tooltip>
                    }
                  >
                    <span className="ms-2">
                      <FaInfoCircle size="0.8em" />
                    </span>
                  </OverlayTrigger>
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".qif"
                onChange={handleFileChange}
                className="d-none"
              />
            </label>
            <Button
              variant="secondary"
              onClick={onImportDummyData}
              className="mt-3"
            >
              Use Sample Data
            </Button>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Account Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Is this a credit/debit card account or a bank account (savings, loan offset)?</p>
          <Button variant="primary" onClick={() => handleAccountTypeSelection(AccountType.DEBIT)}>
            Credit/Debit Card Account
          </Button>
          <Button variant="secondary" className="ml-2" onClick={() => handleAccountTypeSelection(AccountType.BANK)}>
            Bank Account
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default FileUpload;
