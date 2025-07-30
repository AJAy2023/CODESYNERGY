import React from "react";

const Toolbar = ({ color, setColor, size, setSize, clearCanvas }) => {
  const colors = ["black", "red", "blue", "green", "orange", "purple"];
  const sizes = [2, 4, 6, 8, 10];

  return (
    <div className="bg-zinc-900 text-white p-3 rounded shadow flex flex-wrap gap-4 items-center justify-between w-full">
      {/* Color Picker */}
      <div className="flex items-center gap-2">
        <label className="text-sm">Color:</label>
        {colors.map((clr) => (
          <button
            key={clr}
            onClick={() => setColor(clr)}
            className={`w-6 h-6 rounded-full border-2 ${
              clr === color ? "border-white" : "border-zinc-600"
            }`}
            style={{ backgroundColor: clr }}
          />
        ))}
      </div>

      {/* Pen Size Picker */}
      <div className="flex items-center gap-2">
        <label className="text-sm">Size:</label>
        <select
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="bg-zinc-800 px-2 py-1 rounded border border-zinc-600 text-white"
        >
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearCanvas}
        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm"
      >
        Clear Canvas
      </button>
    </div>
  );
};

export default Toolbar;
