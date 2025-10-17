import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
  onError: (message: string) => void;
  error: string | null;
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const UploadZone: React.FC<UploadZoneProps> = ({ onFileUpload, onError, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File) => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      onError(`Invalid file format. Please upload JPG, PNG, or WEBP.`);
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError(`File is too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return false;
    }
    return true;
  }, [onError]);

  const handleFile = useCallback((file: File | undefined) => {
    if (file && validateFile(file)) {
      onFileUpload(file);
    }
  }, [validateFile, onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

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
    const file = e.target.files?.[0];
    handleFile(file);
    // Reset file input to allow uploading the same file again
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
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
        className={`w-full h-32 flex flex-col items-center justify-center p-4 border-2 border-dashed ${borderStyle} rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-200`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FORMATS.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-center text-gray-400">
          <UploadIcon className="mx-auto h-8 w-8 text-gray-500" />
          <p className="mt-2 text-sm">
            <span className="font-semibold text-blue-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs">JPG, PNG, WEBP (max {MAX_SIZE_MB}MB)</p>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
};

export default UploadZone;