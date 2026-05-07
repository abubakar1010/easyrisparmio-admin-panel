import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import type { TUserRole } from "./common.type";

export type TLinkItem = {
  name: string;
  path?: string;
  rootPath?: string;
  icon: IconType;
  children?: TLinkItem[];
};

export type DashboardItem = {
  name?: string;
  path: string;
  element?: ReactNode;
  icon?: IconType;
  role?: TUserRole[];
  children?: DashboardItem[];
};

export type TRouteElement = {
  path: string;
  element: ReactNode;
};
