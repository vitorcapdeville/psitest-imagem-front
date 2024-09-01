import React from 'react';

export default function ThresholdSlider({ value, onChange }) {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="threshold" className="text-sm font-semibold">
        Threshold: {value}
      </label>
      <input
        type="range"
        id="threshold"
        name="threshold"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  );
}