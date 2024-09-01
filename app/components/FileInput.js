import React from "react";

export default function FileInput({ name, onChange, multiple = false }) {
  return (
    <input
      type="file"
      name={name}
      onChange={onChange}
      accept="image/*"
      multiple={multiple}
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
  );
}
