/* eslint-disable @typescript-eslint/no-explicit-any */
import type {  TUniObject } from "../types/common.type";

const debouncedSetter = debounce(
  (
    setter: React.Dispatch<React.SetStateAction<TUniObject>>,
    value: string,
    name: string
  ) => {
    setter((c) => ({ ...c, page: 1, [name || "search"]: value }));
  },
  500
);

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
) {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const debounceSearch = ({
  setter,
  newValue,
  name,
}: {
  setter: React.Dispatch<React.SetStateAction<TUniObject>>;
  newValue: string;
  name: string;
}) => {
  debouncedSetter(setter, newValue, name); // Execute the debounced function
};
