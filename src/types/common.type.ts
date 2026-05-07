import type { ReactNode } from "react";

export type TCommonProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};
export const ROLE = {
  ADMIN: "admin",
} as const;

export type TUserRole = (typeof ROLE)[keyof typeof ROLE];

export type TUniObject<T = object> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
} & T;

export type TArgs = { name: string; value: string }[] | undefined;


