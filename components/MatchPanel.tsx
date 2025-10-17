import React from 'react';

interface MatchSettings {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface MatchPanelProps {
  settings: MatchSettings;
  onChange: (settings: MatchSettings) => void;
}

const MatchPanel: React.FC<MatchPanelProps> = ({ settings, onChange }) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...settings,
      [e.target.name]: parseInt(e.target.value, 10),
    });
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-gray-400">
        Adjust properties of the selected prop to better match the scene.
      </p>
      
      <div className="space-y-3">
        {/* Brightness Slider */}
        <div className="space-y-1">
          <label htmlFor="brightness" className="text-sm font-medium text-gray-300 flex justify-between">
            <span>Brightness</span>
            <span>{settings.brightness}%</span>
          </label>
          <input
            id="brightness"
            name="brightness"
            type="range"
            min="0"
            max="200"
            value={settings.brightness}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1">
          <label htmlFor="contrast" className="text-sm font-medium text-gray-300 flex justify-between">
            <span>Contrast</span>
            <span>{settings.contrast}%</span>
          </label>
          <input
            id="contrast"
            name="contrast"
            type="range"
            min="0"
            max="200"
            value={settings.contrast}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Saturation Slider */}
        <div className="space-y-1">
          <label htmlFor="saturation" className="text-sm font-medium text-gray-300 flex justify-between">
            <span>Saturation</span>
            <span>{settings.saturation}%</span>
          </label>
          <input
            id="saturation"
            name="saturation"
            type="range"
            min="0"
            max="200"
            value={settings.saturation}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default MatchPanel;
