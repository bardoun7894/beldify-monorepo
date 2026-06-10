import React from 'react';

interface ColorListProps {
  colors: string[];
}

const ColorList: React.FC<ColorListProps> = ({ colors }) => {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color, index) => (
        <div
          key={index}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-700"
          title={color}
        >
          <span
            className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {color}
        </div>
      ))}
    </div>
  );
};

export default ColorList;
