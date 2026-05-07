
import Home from "../app/Home";
import Notification from "../app/Notification";
import type { DashboardItem } from "../types/sidebar.type";
import { ROLE } from "../types/common.type";
import { LuMonitorCog, LuSettings, LuUsers } from "react-icons/lu";
import { RiShieldUserLine } from "react-icons/ri";
import Settings from "../app/Settings/Settings";
import ClientManagement from "../app/ClientManagement";

export const dashboardItems: DashboardItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LuMonitorCog,
    element: <Home />,
    role: [ROLE.ADMIN],
  },
  {
    path: "notifications",
    element: <Notification />,
  },
  // {
  //   name: "Verify Request",
  //   path: "verification",
  //   icon: PiUserSwitchFill,
  //   role: [ROLE.ADMIN],
  //   children: [
  //     {
  //       name: "Doctor",
  //       path: "verification/doctor",
  //       icon: RiUserShared2Line,
  //       element: <RequestedLilst />,
  //       role: [ROLE.ADMIN],
  //     },
  //     {
  //       name: "Nurse",
  //       path: "verification/nurse",
  //       icon: RiUserShared2Line,
  //       element: <RequestedLilst />,
  //       role: [ROLE.ADMIN],
  //     },
  //     {
  //       name: "Patient",
  //       path: "verification/patient",
  //       icon: RiUserShared2Line,
  //       element: <RequestedLilst />,
  //       role: [ROLE.ADMIN],
  //     },
  //     {
  //       name: "Pharmacy",
  //       path: "verification/pharmacy",
  //       icon: RiUserShared2Line,
  //       element: <RequestedLilst />,
  //       role: [ROLE.ADMIN],
  //     },
  //   ],
  // },
  {
    name: "Client Management",
    path: "client-list",
    icon: LuUsers,
    role: [ROLE.ADMIN],
    element: <ClientManagement />,
  },
  // {
  //   name: "Requests",
  //   path: "requests",
  //   icon: IoFingerPrint,
  //   role: [ROLE.COMPANY, ROLE.BRANCH, ROLE.INSPECTOR],
  //   children: [
  //     {
  //       name: "Leave",
  //       path: "requests/leaves",
  //       icon: FcLeave,
  //       element: <LeaveRequest />,
  //       role: [ROLE.COMPANY, ROLE.BRANCH, ROLE.INSPECTOR],
  //     },
  //     {
  //       name: "Attendance",
  //       path: "requests/attendances",
  //       icon: MdOutlineManageHistory,
  //       element: <AttendanceRequest />,
  //       role: [ROLE.COMPANY, ROLE.BRANCH, ROLE.INSPECTOR],
  //     },
  //   ],
  // },
  // {
  //   name: "Subscriptions",
  //   path: "subscriptions",
  //   icon: FaRegChessQueen,
  //   role: [ROLE.ADMIN, ROLE.COMPANY],
  //   element: <Subscriptions />,
  // },
  // {
  //   path: "subscriptions/:id",
  //   element: <SubscriptionPurchase />,
  // },

  // settings
  {
    name: "Settings",
    path: "settings",
    icon: LuSettings,
    role: Object.values(ROLE),
    children: [
      {
        name: "Profile",
        path: "settings/prifile",
        icon: RiShieldUserLine,
        role: Object.values(ROLE),
        element: <Settings />,
      },
      // {
      //   name: "Terms & Services",
      //   icon: FaServicestack,
      //   path: "settings/terms-conditions",
      //   role: Object.values(ROLE),
      //   element: <TermsConditions />,
      // },

      // {
      //   name: "Privacy Policy",
      //   icon: MdOutlineSecurityUpdateWarning,
      //   path: "settings/privacy-policy",
      //   role: Object.values(ROLE),
      //   element: <PrivacyPolicy />,
      // },
      // {
      //   name: "About Us",
      //   icon: BiMessageSquareDetail,
      //   path: "settings/about-us",
      //   role: Object.values(ROLE),
      //   element: <AboutUs />,
      // },
    ],
  },
];
