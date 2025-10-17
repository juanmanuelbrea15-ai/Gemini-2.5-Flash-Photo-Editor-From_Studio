import React from 'react';
import { Prop } from '../types';
import { TrashIcon } from './Icons';

interface PropCardProps {
  prop: Prop;
  isActive: boolean;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleBg: (id: string) => void;
}

const PropCard: React.FC<PropCardProps> = ({ prop, isActive, onDelete, onSelect, onToggleBg }) => {
  return (
    <div className={`relative group border-2 rounded-lg overflow-hidden transition-all ${isActive ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'}`}>
      <div className="aspect-square checkerboard flex items-center justify-center p-2">
        <img src={prop.src} alt="Prop thumbnail" className="max-w-full max-h-full object-contain" />
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button 
          onClick={() => onSelect(prop.id)}
          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-full"
        >
          Use
        </button>
        <button 
            onClick={() => onToggleBg(prop.id)}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-full"
        >
            Toggle BG
        </button>
      </div>
       <button 
          onClick={() => onDelete(prop.id)}
          className="absolute top-1 right-1 h-6 w-6 p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Delete prop"
        >
          <TrashIcon className="w-full h-full"/>
      </button>
    </div>
  );
};


interface PropsListProps {
  props: Prop[];
  activePropId: string | null;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleBg: (id: string) => void;
}

const PropsList: React.FC<PropsListProps> = ({ props, activePropId, onDelete, onSelect, onToggleBg }) => {
  if (props.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        <p>Your uploaded props will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {props.map(prop => (
        <PropCard
          key={prop.id}
          prop={prop}
          isActive={prop.id === activePropId}
          onDelete={onDelete}
          onSelect={onSelect}
          onToggleBg={onToggleBg}
        />
      ))}
    </div>
  );
};

export default PropsList;
