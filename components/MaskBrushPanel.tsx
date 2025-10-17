import React from 'react';

interface MaskBrushPanelProps {
  brushSize: number;
  setBrushSize: (size: number) => void;
  isErasing: boolean;
  setIsErasing: (erasing: boolean) => void;
}

const MaskBrushPanel: React.FC<MaskBrushPanelProps> = ({
  brushSize,
  setBrushSize,
  isErasing,
  setIsErasing,
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label htmlFor="brush-size" className="text-sm font-medium text-gray-300">
          Brush Size: {brushSize}px
        </label>
        <input
          id="brush-size"
          type="range"
          min="5"
          max="100"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-300">Mode</span>
        <div className="flex rounded-md bg-gray-700">
          <button
            onClick={() => setIsErasing(false)}
            className={`px-3 py-1 text-sm rounded-l-md transition-colors ${
              !isErasing ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Draw
          </button>
          <button
            onClick={() => setIsErasing(true)}
            className={`px-3 py-1 text-sm rounded-r-md transition-colors ${
              isErasing ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Erase
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaskBrushPanel;
