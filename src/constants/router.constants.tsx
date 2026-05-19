
import Home from "../app/Home";
import Notification from "../app/Notification";
import type { DashboardItem } from "../types/sidebar.type";
import { ROLE } from "../types/common.type";
import {
  LuLayoutDashboard,
  LuSettings,
  LuUsers,
  LuZap,
  LuFileText,
  LuScanLine,
  LuTag,
  LuClipboardCheck,
  LuGift,
  LuCreditCard,
  LuMessageCircle,
  LuPercent,
  LuBuilding2,
  LuFileSpreadsheet,
  LuGitCompareArrows,
} from "react-icons/lu";
import Settings from "../app/Settings/Settings";
import ClientManagement from "../app/ClientManagement";
import CaseManagement from "../app/CaseManagement";
import CaseDetailsView from "../app/CaseManagement/CaseDetailsView";
import MeterReading from "../app/MetterReading";
import MeterDetails from "../app/MetterReading/MeterDetails";
import Comparator from "../app/Comparators";
import OCRBills from "../app/OCR";
import Suppliers from "../app/Suppliers";
import OffersMarket from "../app/OffersMarket";
import Agreements from "../app/Agreements";
import CSVReconciliation from "../app/CSVReconciliation";
import Referrals from "../app/Referrals";
import Payments from "../app/Payments";
import SupportTicket from "../app/SupportTicket";
import Commission from "../app/Commission";

export const dashboardItems: DashboardItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LuLayoutDashboard,
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
  {
    name: "Case Management",
    path: "case-management",
    icon: LuFileText,
    role: [ROLE.ADMIN],
    element: <CaseManagement />,
  },
  {
    path: "case-management/:caseId",
    element: <CaseDetailsView />,
  },
  {
    name: "Utilities / Services",
    path: "meter-reading",
    icon: LuZap,
    role: [ROLE.ADMIN],
    element: <MeterReading />,
  },
  {
    path: "meter-reading/:meterId",
    element: <MeterDetails />,
  },
  {
    name: "Comparator",
    path: "comparators",
    icon: LuGitCompareArrows,
    role: [ROLE.ADMIN],
    element: <Comparator />,
  },
  {
    name: "OCR",
    path: "ocr",
    icon: LuScanLine,
    role: [ROLE.ADMIN],
    element: <OCRBills />,
  },
  {
    name: "Suppliers",
    path: "suppliers",
    icon: LuBuilding2,
    role: [ROLE.ADMIN],
    element: <Suppliers />,
  },
  {
    name: "Offers / Market",
    path: "offers-market",
    icon: LuTag,
    role: [ROLE.ADMIN],
    element: <OffersMarket />,
  },
  {
    name: "Agreement Section",
    path: "agreements",
    icon: LuClipboardCheck,
    role: [ROLE.ADMIN],
    element: <Agreements />,
  },
  {
    name: "CSV Reconciliation",
    path: "csv-reconciliation",
    icon: LuFileSpreadsheet,
    role: [ROLE.ADMIN],
    element: <CSVReconciliation />,
  },
  {
    name: "Referrals",
    path: "referrals",
    icon: LuGift,
    role: [ROLE.ADMIN],
    element: <Referrals />,
  },
  {
    name: "Payments",
    path: "payments",
    icon: LuCreditCard,
    role: [ROLE.ADMIN],
    element: <Payments />,
  },
  {
    name: "Support",
    path: "support-ticket",
    icon: LuMessageCircle,
    role: [ROLE.ADMIN],
    element: <SupportTicket />,
  },
  {
    name: "Commission",
    path: "commission",
    icon: LuPercent,
    role: [ROLE.ADMIN],
    element: <Commission />,
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
    element: <Settings />,
  },
];
