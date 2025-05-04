import { useState } from "react";
import { CheckSquare, Square } from "react-icons";

function YourComponent() {
  const [mode, setMode] = useState(null); // null -> chưa chọn, "auto" -> Automatic play, "manual" -> Manual input

  return (
    <div className="flex flex-col items-start space-y-2">
      <label className="flex items-center space-x-2 cursor-pointer">
        <div
          onClick={() => setMode(mode === "auto" ? null : "auto")} // Nếu đã chọn "auto" thì bỏ chọn
          className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded"
        >
          {mode === "auto" ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <span className="select-none">Automatic play</span>
      </label>

      <label className="flex items-center space-x-2 cursor-pointer">
        <div
          onClick={() => setMode(mode === "manual" ? null : "manual")} // Nếu đã chọn "manual" thì bỏ chọn
          className="w-5 h-5 flex items-center justify-center border border-gray-400 rounded"
        >
          {mode === "manual" ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <span className="select-none">Manual input</span>
      </label>
    </div>
  );
}
