
import Home from "../app/Home";
import Notification from "../app/Notification";
import ActivityHistory from "../app/ActivityHistory";
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
  LuMessageCircle,
  LuBuilding2,
  LuCircleHelp,
  LuBookOpen,
} from "react-icons/lu";
import Settings from "../app/Settings/Settings";
import ClientManagement from "../app/ClientManagement";
import CaseManagement from "../app/CaseManagement";
import BillRequestDetailView from "../app/CaseManagement/BillRequestDetailView";
import CaseRedirect from "../app/CaseManagement/CaseRedirect";
import MeterReading from "../app/MetterReading";
import MeterDetails from "../app/MetterReading/MeterDetails";
import OCRBills from "../app/OCR";
import Suppliers from "../app/Suppliers";
import SupplierDetails from "../app/Suppliers/SupplierDetails";
import OffersMarket from "../app/OffersMarket";
import OfferDetailsPage from "../app/OffersMarket/OfferDetailsPage";
import Agreements from "../app/Agreements";
import AgreementDetailsView from "../app/Agreements/AgreementDetailsView";
import Referrals from "../app/Referrals";
import SupportTicket from "../app/SupportTicket";
import TicketDetailsView from "../app/SupportTicket/TicketDetailsView";
import SupportTopics from "../app/SupportTopics";
import FAQManagement from "../app/FAQManagement";
import StaticPages from "../app/StaticPages";

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
  {
    path: "activity-history",
    element: <ActivityHistory />,
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
    // Notifications and activity logs about a case only carry its caseId; this
    // resolves the case to its bill and forwards to the detail view below.
    path: "case-management/case/:caseId",
    element: <CaseRedirect />,
  },
  {
    path: "case-management/:billId",
    element: <BillRequestDetailView />,
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
    path: "suppliers/:supplierId",
    element: <SupplierDetails />,
  },
  {
    name: "Offers / Market",
    path: "offers-market",
    icon: LuTag,
    role: [ROLE.ADMIN],
    element: <OffersMarket />,
  },
  {
    path: "offers-market/:offerId",
    element: <OfferDetailsPage />,
  },
  {
    name: "Agreement Section",
    path: "agreements",
    icon: LuClipboardCheck,
    role: [ROLE.ADMIN],
    element: <Agreements />,
  },
  {
    path: "agreements/:agreementId",
    element: <AgreementDetailsView />,
  },
  {
    name: "Referrals",
    path: "referrals",
    icon: LuGift,
    role: [ROLE.ADMIN],
    element: <Referrals />,
  },
  {
    name: "Support",
    path: "support-ticket",
    icon: LuMessageCircle,
    role: [ROLE.ADMIN],
    element: <SupportTicket />,
  },
  {
    path: "support-ticket/:ticketId",
    element: <TicketDetailsView />,
  },
  {
    name: "Support Topics",
    path: "support-topics",
    icon: LuTag,
    role: [ROLE.ADMIN],
    element: <SupportTopics />,
  },
  {
    name: "FAQ Management",
    path: "faq-management",
    icon: LuCircleHelp,
    role: [ROLE.ADMIN],
    element: <FAQManagement />,
  },
  {
    name: "Static Pages",
    path: "static-pages",
    icon: LuBookOpen,
    role: [ROLE.ADMIN],
    element: <StaticPages />,
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
