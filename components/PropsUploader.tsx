import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';

interface PropsUploaderProps {
  onUpload: (files: File[]) => void;
  onError: (message: string | null) => void;
  error: string | null;
  isProcessing: boolean;
}

const ACCEPTED_FORMATS = ['image/png', 'image/webp'];

const PropsUploader: React.FC<PropsUploaderProps> = ({ onUpload, onError, error, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFiles = useCallback((files: FileList) => {
    onError(null);
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_FORMATS.includes(file.type)) {
        onError(`Invalid format: ${file.name}. Only PNG and WEBP are accepted.`);
        return; // Stop on first error
      }
      validFiles.push(file);
    }
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  }, [onUpload, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      validateAndHandleFiles(e.dataTransfer.files);
    }
  }, [validateAndHandleFiles]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      validateAndHandleFiles(e.target.files);
    }
    e.target.value = ''; // Reset to allow re-uploading the same file
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const borderStyle = isDragging 
    ? 'border-blue-500' 
    : error ? 'border-red-500' : 'border-gray-600';

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragEvents}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative w-full h-24 flex flex-col items-center justify-center p-4 border-2 border-dashed ${borderStyle} rounded-lg ${isProcessing ? 'cursor-wait bg-gray-700' : 'cursor-pointer bg-gray-800 hover:bg-gray-700'} transition-colors duration-200`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileChange}
          className="hidden"
          multiple
          disabled={isProcessing}
        />
        {isProcessing ? (
           <div className="text-center text-gray-300">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-sm">Processing props...</p>
           </div>
        ) : (
          <div className="text-center text-gray-400">
            <UploadIcon className="mx-auto h-6 w-6 text-gray-500" />
            <p className="mt-2 text-sm">
              <span className="font-semibold text-blue-400">Add props</span> or drag & drop
            </p>
            <p className="text-xs">PNG, WEBP with transparency</p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default PropsUploader;
