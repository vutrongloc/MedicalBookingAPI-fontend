import { useRef, useEffect, useCallback } from "react";

export default function SearchBar({ placeholder = "Tìm kiếm...", value, onChange, onClear }) {
  const debounceRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange?.(val);
    }, 300);
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onClear?.();
  };

  return (
    <div className="search-bar">
      <span className="search-bar-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        defaultValue={value}
        onChange={handleChange}
      />
      {value && (
        <button className="search-bar-clear" onClick={handleClear} aria-label="Xóa tìm kiếm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}
