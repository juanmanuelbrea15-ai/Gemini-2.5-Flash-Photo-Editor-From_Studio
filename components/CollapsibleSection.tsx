
import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  defaultOpen = false 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex justify-between items-center p-3 text-left font-medium text-sm text-gray-200 hover:bg-gray-700 focus:outline-none transition-colors"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[800px]' : 'max-h-0'
        }`}
      >
        <div className="border-t border-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;