import React from 'react';

interface RestoreBrushPanelProps {
    brushSize: number;
    setBrushSize: (size: number) => void;
    isRestoring: boolean;
    setIsRestoring: (restoring: boolean) => void;
    onRestoreAll: () => void;
}

const RestoreBrushPanel: React.FC<RestoreBrushPanelProps> = ({ 
    brushSize, 
    setBrushSize, 
    isRestoring,
    setIsRestoring,
    onRestoreAll
}) => {
    return (
        <div className="p-4 space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
                Paint over areas to restore them to the original uploaded image.
            </p>
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Brush Size: <span className="text-blue-400">{brushSize}px</span>
                </label>
                <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                <input 
                    type="checkbox"
                    id="restore-mode"
                    checked={isRestoring}
                    onChange={(e) => setIsRestoring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="restore-mode" className="text-sm text-gray-200 cursor-pointer select-none">
                    Enable Restore Mode
                </label>
            </div>

            <button
                onClick={onRestoreAll}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-sm transition-colors"
            >
                Restore Entire Image
            </button>
        </div>
    );
};

export default RestoreBrushPanel;