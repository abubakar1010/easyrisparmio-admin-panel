import { getLocale } from "../../utils/format";
import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Button } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useAppSelector } from "../../redux/hooks";
import { IoNotificationsOutline } from "react-icons/io5";
import { FiMenu } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";
import {
  useGetUnreadCountQuery,
  useGetNotificationsQuery,
  useMarkAsReadMutation,
} from "../../redux/features/Notifications/notificationApi";
import { useTranslation } from "react-i18next";
import { currentLanguage } from "../../i18n";
import { getNotificationRoute } from "../../lib/helpers/notificationRoute";
import { useWebPush } from "../../lib/webPush";

// FCM web push delivers in about a second, so with permission granted the
// poll is only a safety net for a push that never lands. Without it — the
// admin declined the prompt, or the browser cannot do push at all — polling
// is the whole channel, so it stays brisk.
const PUSH_FALLBACK_POLL_MS = 120_000;
const POLL_ONLY_MS = 30_000;

type HeaderProps = {
  onMobileMenuClick?: () => void;
};

const Header = ({ onMobileMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);
  const { user } = useAppSelector((state) => state.auth);
  const [notificationPopup, setNotificationPopup] = useState(false);
  // Registering here rather than in Main keeps the state next to the bell,
  // which is where it is both shown and acted on.
  const { status: pushStatus, enable: enablePush } = useWebPush();
  const pollMs =
    pushStatus === "granted" ? PUSH_FALLBACK_POLL_MS : POLL_ONLY_MS;
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: pollMs,
  });
  const unreadCount = unreadData?.count || 0;
  const { data: notificationsData } = useGetNotificationsQuery(
    { page: 1, limit: 5 },
    { pollingInterval: pollMs },
  );
  const [markAsRead] = useMarkAsReadMutation();
  const recentNotifications = notificationsData?.data || [];
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLanguage() === "it" ? "en" : "it");
  };

  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : "Admin";

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`
    : "AD";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !(notificationRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setNotificationPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    setNotificationPopup(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-[13] w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="relative flex h-16 w-full items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 xl:px-8">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
          {onMobileMenuClick ? (
            <button
              type="button"
              aria-label={t("audit.open_navigation_menu")}
              className="md:hidden shrink-0 rounded-xl p-2 text-brand hover:bg-slate-100 border border-slate-200 transition-colors"
              onClick={onMobileMenuClick}
            >
              <FiMenu className="w-5 h-5" />
            </button>
          ) : null}
          <BrandLightningMark size="sm" decorative className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-500 sm:text-[15px]">
              {t("header.welcome")}{" "}
              <span className="font-semibold text-brand">{user?.firstName || fullName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleLanguage}
            className="flex h-10 min-w-10 items-center justify-center rounded-xl px-2.5 text-xs font-bold tracking-wide text-slate-600 hover:bg-slate-100 hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            type="button"
            title={t("settings.language")}
          >
            {currentLanguage() === "it" ? "EN" : "IT"}
          </button>
          <button
            onClick={() => setNotificationPopup(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            aria-label={t("header.notifications")}
            type="button"
            aria-expanded={notificationPopup}
            aria-haspopup="true"
          >
            <Badge count={unreadCount} size="small" offset={[-1, 3]}>
              <IoNotificationsOutline className="h-[22px] w-[22px] text-current" />
            </Badge>
          </button>
          <div className="ml-1 flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:ml-2 sm:pl-4">
            <Avatar
              size={36}
              src={user?.avatar || undefined}
              className="shrink-0 bg-primary/10 text-primary font-semibold"
            >
              {initials}
            </Avatar>
            <div className="min-w-0 text-left hidden min-[380px]:block">
              <h4 className="text-sm font-semibold text-brand truncate max-w-[120px] sm:max-w-[200px] leading-tight">
                {fullName}
              </h4>
              <span className="text-xs text-slate-500">{t("header.admin")}</span>
            </div>
          </div>
        </div>
        {!!notificationPopup && (
          <div
            ref={notificationRef}
            className="absolute z-20 top-[calc(100%+12px)] right-4 sm:right-8 max-w-[400px] w-[min(100vw-2rem,400px)] rounded-2xl border border-cborder/40 bg-white px-3 py-4 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.15)] divide-y divide-cborder/30 motion-safe:animate-[header-pop_0.22s_cubic-bezier(0.3,0,0,1)]"
          >
            <div className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-800">{t("header.notifications")}</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              {pushStatus === "default" && (
                <button
                  type="button"
                  onClick={() => void enablePush()}
                  className="w-full mb-3 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  {t("header.enable_push")}
                </button>
              )}
              {pushStatus === "denied" && (
                <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {t("header.push_blocked")}
                </p>
              )}
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">{t("notifications.no_notifications")}</p>
              ) : (
                <div className="space-y-1">
                  {recentNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 ${!item.isRead ? "bg-indigo-50/50" : ""}`}
                      onClick={() => {
                        if (!item.isRead) markAsRead(item.id);
                        // Land on the record the notification is about; fall
                        // back to the list when it carries no entity.
                        navigate(getNotificationRoute(item) ?? "/notifications");
                      }}
                    >
                      <p className={`text-sm truncate ${!item.isRead ? "font-bold text-slate-800" : "font-normal text-slate-600"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.body.length > 60 ? `${item.body.slice(0, 60)}...` : item.body}
                      </p>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {new Date(item.createdAt).toLocaleString(getLocale())}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-fit mx-auto mt-2 pt-3">
              <Button
                onClick={() => navigate("/notifications")}
                size="middle"
                type="primary"
                className="w-40 rounded-xl shadow-sm"
              >
                {t("header.see_more")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
