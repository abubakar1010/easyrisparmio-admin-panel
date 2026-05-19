import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, Button } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useAppSelector } from "../../redux/hooks";
import { IoNotificationsOutline } from "react-icons/io5";
import { FiMenu } from "react-icons/fi";
import { BrandLightningMark } from "../../components/ui/BrandLightningMark";

type HeaderProps = {
  onMobileMenuClick?: () => void;
};

const Header = ({ onMobileMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notificationRef = useRef(null);
  const { user } = useAppSelector((state) => state.auth);
  const [notificationPopup, setNotificationPopup] = useState(false);
  // const { total, notification } = useSelector((state) => state.notification);
  // const { data } = useAdminNotificationBadgeQuery(undefined, {
  //   refetchOnMountOrArgChange: true,
  // });
  useEffect(() => {
    // notification popup
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
    <header className="sticky top-0 z-10 w-full border-b border-cborder/50 bg-white/75 backdrop-blur-xl backdrop-saturate-150 shadow-[0_4px_32px_-12px_rgba(15,23,42,0.08)] transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.3,0,0,1)]">
      <div className="w-full flex justify-between items-center gap-2 sm:gap-4 px-3 sm:px-6 md:px-8 py-3 sm:py-3.5 relative max-w-[1920px] mx-auto">
        <div className="min-w-0 flex items-start gap-2 sm:gap-3 flex-1">
          {onMobileMenuClick ? (
            <button
              type="button"
              aria-label="Open navigation menu"
              className="md:hidden shrink-0 mt-0.5 rounded-xl p-2 text-brand hover:bg-playground/80 border border-cborder/40 transition-colors"
              onClick={onMobileMenuClick}
            >
              <FiMenu className="w-5 h-5" />
            </button>
          ) : null}
          <BrandLightningMark size="sm" decorative className="mt-0.5 shrink-0 lg:hidden" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-medium text-brand tracking-[-0.01em]">
              Welcome,{user?.name ? ` ${user.name}` : "Admin"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 md:gap-5 items-center shrink-0">
          <button
            onClick={() => setNotificationPopup(true)}
            className="relative flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
            type="button"
            aria-expanded={notificationPopup}
            aria-haspopup="true"
          >
            <Badge dot color="#ef4444" offset={[-2, 4]}>
              <IoNotificationsOutline className="cursor-pointer text-[#6366f1] w-7 h-7 sm:w-8 sm:h-8 transition-colors hover:text-[#4f46e5]" />
            </Badge>
          </button>
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-cborder/50">
            <Avatar
              size={40}
              className="shrink-0 bg-[#e0eaff] text-[#3a4a7a] font-semibold"
            >
              AD
            </Avatar>
            <div className="min-w-0 text-left hidden min-[380px]:block">
              <h4 className="text-sm font-semibold text-brand truncate max-w-[120px] sm:max-w-[200px] leading-tight">
                {user?.name || "Admin User"}
              </h4>
              <span className="text-xs text-owngray">Superadmin</span>
            </div>
          </div>
        </div>
        {!!notificationPopup && (
          <div
            ref={notificationRef}
            className="absolute top-[calc(100%+12px)] right-4 sm:right-8 max-w-[400px] w-[min(100vw-2rem,400px)] rounded-2xl border border-cborder/40 bg-white/95 backdrop-blur-md px-3 py-4 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.15)] divide-y divide-cborder/30 motion-safe:animate-[header-pop_0.22s_cubic-bezier(0.3,0,0,1)]"
          >
            <div>
              {/* {data?.data?.latestNotifications.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-4 px-[14px] py-2 cursor-pointer hover:bg-gray-100 transition-all"
              >
                <IoIosNotificationsOutline
                  // style={{ cursor: "pointer" }}
                  className={`border border-white min-w-[40px] min-h-[40px] rounded-lg p-1.5 shadow-sm bg-[#B2DAC4] text-info group-hover:bg-[#b3dfc7]`}
                />
                <div className="">
                  <h6 className="line-clamp-1">{item.msg}</h6>
                  <small className="text-[11px] text-gray-500">
                    {compareByCTime(item.createdAt)}
                  </small>
                </div>
              </div>
            ))} */}
            </div>
            <div className="w-fit mx-auto mt-4">
              <Button
                onClick={() => navigate("/notifications")}
                style={{ background: "#34D399", color: "white" }}
                size="middle"
                type="primary"
                className="w-40 rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                See More
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
