import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { parsePhoneNumberFromString, AsYouType, type CountryCode } from "libphonenumber-js";
import { countries, findCountryByCode, type Country } from "../../constants/countries";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function PhoneInput({
  value,
  onChange,
  defaultCountry = "IT",
  disabled = false,
  placeholder,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () => findCountryByCode(defaultCountry) ?? countries[0]
  );
  const [nationalNumber, setNationalNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Parse incoming E.164 value once on mount or when value changes externally
  useEffect(() => {
    if (!value) {
      if (initializedRef.current) return;
      initializedRef.current = true;
      return;
    }
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      const country = findCountryByCode(parsed.country ?? defaultCountry);
      if (country) setSelectedCountry(country);
      setNationalNumber(parsed.nationalNumber);
    } else {
      // Try to extract national number from raw value
      const cleaned = value.replace(/\s+/g, "");
      if (cleaned.startsWith(selectedCountry.dialCode)) {
        setNationalNumber(cleaned.slice(selectedCountry.dialCode.length));
      } else if (cleaned.startsWith("+")) {
        setNationalNumber(cleaned);
      } else {
        setNationalNumber(cleaned);
      }
    }
    initializedRef.current = true;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit E.164 value whenever country or national number changes
  const emitValue = useCallback(
    (country: Country, national: string) => {
      if (!onChange) return;
      const digits = national.replace(/[^\d]/g, "");
      if (!digits) {
        onChange("");
        return;
      }
      // Try to format as E.164
      const formatter = new AsYouType(country.code as CountryCode);
      formatter.input(digits);
      const number = formatter.getNumber();
      if (number) {
        onChange(number.format("E.164"));
      } else {
        onChange(`${country.dialCode}${digits}`);
      }
    },
    [onChange]
  );

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearch("");
    emitValue(country, nationalNumber);
    phoneInputRef.current?.focus();
  };

  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNationalNumber(val);
    emitValue(selectedCountry, val);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [dropdownOpen]);

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center rounded-lg border transition-colors ${
          focused ? "border-[#7061ED] ring-1 ring-[#7061ED]/20" : "border-slate-200"
        } ${disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
      >
        {/* Country selector trigger */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 pl-3 pr-2 py-0 h-[42px] border-r border-slate-200 hover:bg-slate-50 transition-colors rounded-l-lg shrink-0 disabled:hover:bg-transparent"
        >
          <span className="text-lg leading-none">{selectedCountry.flag}</span>
          <span className="text-sm text-slate-700 font-medium">{selectedCountry.dialCode}</span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Phone number input */}
        <input
          ref={phoneInputRef}
          type="tel"
          disabled={disabled}
          value={nationalNumber}
          onChange={handleNationalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? "Phone number"}
          className="flex-1 h-[42px] px-3 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400 disabled:cursor-not-allowed rounded-r-lg"
        />
      </div>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-[#7061ED] focus:ring-1 focus:ring-[#7061ED]/20 placeholder:text-slate-400"
            />
          </div>

          {/* Country list */}
          <ul className="max-h-[220px] overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">No countries found</li>
            ) : (
              filteredCountries.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                      country.code === selectedCountry.code ? "bg-[#7061ED]/5" : ""
                    }`}
                  >
                    <span className="text-lg leading-none">{country.flag}</span>
                    <span className="text-sm text-slate-700 flex-1">{country.name}</span>
                    <span className="text-sm text-slate-400">{country.dialCode}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Ant Design Form.Item validation rule helper
export const phoneValidationRule = (message: string) => ({
  validator: (_: unknown, value: string) => {
    if (!value) return Promise.resolve();
    const parsed = parsePhoneNumberFromString(value);
    return parsed?.isValid() ? Promise.resolve() : Promise.reject(new Error(message));
  },
});
