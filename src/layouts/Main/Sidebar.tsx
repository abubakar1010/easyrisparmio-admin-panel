import { NavLink, useLocation, useNavigate } from "react-router";
import { createElement, useState } from "react";
import Swal from "sweetalert2";
import { FiLogOut, FiX } from "react-icons/fi";
import { MdOutlineArrowRight } from "react-icons/md";
import { LuLayoutDashboard } from "react-icons/lu";
import { routeLinkGenerators } from "../../lib/helpers/generateLink";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { logout } from "../../redux/features/Auth/authSlice";
import { usePostLogoutMutation } from "../../redux/features/Auth/authApi";
import type { TUserRole } from "../../types/common.type";
import { cn } from "../../utils/cn";
import { dashboardItems } from "../../constants/router.constants";
type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useAppSelector((state) => state.auth);
  const [postLogout] = usePostLogoutMutation();
  const [openNome, setOpenNome] = useState<{ name: string | null }>({
    name: null,
  });
  const handleLogOut = () => {
    Swal.fire({
      text: "Are you sure you want to logout?",
      showCancelButton: true,
      confirmButtonText: "     Logout     ",
      cancelButtonText: "Cancel",
      showConfirmButton: true,
      confirmButtonColor: "#DC2626",
      reverseButtons: true,
    }).then(async (res) => {
      if (res.isConfirmed) {
        if (refreshToken) {
          try {
            await postLogout({ refreshToken }).unwrap();
          } catch {
            // Server-side revocation failed — still clear local state
          }
        }
        dispatch(logout());
        navigate("/auth/sign-in");
      }
    });
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-[15] h-screen min-h-0 w-[min(280px,88vw)] md:w-[250px] 2xl:w-[280px]",
        "transition-transform duration-300 ease-[cubic-bezier(0.3,0,0,1)] will-change-transform",
        "max-md:-translate-x-full max-md:shadow-[8px_0_40px_-8px_rgba(15,23,42,0.18)]",
        mobileOpen && "max-md:translate-x-0"
      )}
    >
      <div className="flex h-full min-h-0 w-full flex-col bg-gradient-to-b from-white via-playground/40 to-playground/70 border-r border-cborder/55 shadow-[6px_0_40px_-20px_rgba(15,23,42,0.12)]">
        <div className="flex md:hidden shrink-0 items-center justify-end px-3 pt-3 pb-1">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => onMobileClose?.()}
            className="rounded-xl p-2 text-brand hover:bg-primary/10 transition-colors"
          >
            <FiX className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="shrink-0 flex items-center gap-2.5 px-5 pt-4 pb-5 md:pt-5 md:pb-6 border-b border-cborder/40">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef0ff] text-[#6366f1]">
            <LuLayoutDashboard size={18} />
          </span>
          <span className="text-lg font-bold text-[#6366f1] tracking-tight">
            Admin Portal
          </span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-1 px-2.5 py-1 scroll-py-2 [scrollbar-width:thin] [scrollbar-color:oklch(0.68_0_0)_transparent]">
            {routeLinkGenerators(dashboardItems, user?.role as TUserRole).map(
              ({ name, icon, path, children, rootPath }, indx) =>
                children?.length ? (
                  <li key={indx} className="overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenNome((c) => ({
                          name: c?.name === name ? null : name,
                        }));
                      }}
                      className={cn(
                        "hover:text-primary hover:bg-primary/5 outline-none text-[#373643] w-full pl-5 pr-4 py-3 flex items-center justify-between gap-3 2xl:text-lg rounded-xl group transition-colors duration-200 ease-[cubic-bezier(0.3,0,0,1)]",
                        {
                          "text-primary bg-primary/5":
                            name !== openNome?.name &&
                            location.pathname.includes(rootPath as string) &&
                            openNome.name,
                          "text-primary":
                            name === openNome?.name ||
                            (location.pathname.includes(rootPath as string) &&
                              !openNome.name),
                        }
                      )}
                    >
                      <div className="flex items-center justify-start gap-2.5">
                        <div>{createElement(icon, { size: "20" })}</div>
                        <span>{name}</span>
                      </div>
                      <MdOutlineArrowRight
                        className={cn(
                          "text-slate-500 group-hover:text-[#373643] cursor-pointer transition-transform duration-300 ease-[cubic-bezier(0.3,0,0,1)]",
                          {
                            "rotate-90 text-[#373643] group-hover:text-slate-500 cursor-auto":
                              name === openNome?.name ||
                              (location.pathname.includes(rootPath as string) &&
                                !openNome.name),
                          }
                        )}
                        size={20}
                      />
                    </button>
                    <div
                      className={cn("space-y-0.5 h-0 overflow-hidden", {
                        "h-fit pt-0.5":
                          name === openNome?.name ||
                          (location.pathname.includes(rootPath as string) &&
                            !openNome.name),
                      })}
                    >
                      {children?.map((child, inx) => (
                        <NavLink
                          key={inx}
                          to={child.path as string}
                          onClick={() => onMobileClose?.()}
                          className={({ isActive }) =>
                            cn(
                              "hover:text-primary hover:bg-primary/5 text-brand w-full pl-8 pr-4 py-2.5 flex items-center justify-start gap-2.5 text-sm 2xl:text-base rounded-lg transition-colors duration-200 ease-[cubic-bezier(0.3,0,0,1)]",
                              {
                                "text-primary bg-primary/10 relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-primary":
                                  isActive,
                              }
                            )
                          }
                        >
                          <div>{createElement(child.icon, { size: "15" })}</div>
                          <span> {child.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  </li>
                ) : (
                  <li
                    onClick={() => {
                      setOpenNome((c) => ({
                        name: c?.name === name ? null : name,
                      }));
                    }}
                    key={indx}
                  >
                    <NavLink
                      to={path as string}
                      onClick={() => onMobileClose?.()}
                      className={({ isActive }) =>
                        cn(
                          "w-full pl-4 pr-4 py-3 flex items-center justify-start gap-3 text-[15px] rounded-xl transition-colors duration-200 ease-[cubic-bezier(0.3,0,0,1)] text-[#373643] hover:bg-primary/5",
                          {
                            "!bg-[#6366f1] !text-white shadow-[0_8px_20px_-10px_rgba(99,102,241,0.6)]":
                              isActive,
                          }
                        )
                      }
                    >
                      <div>{createElement(icon, { size: "18" })}</div>
                      <span> {name}</span>
                    </NavLink>
                  </li>
                )
            )}
        </ul>
        <div className="shrink-0 px-2.5 pt-2 pb-4 border-t border-cborder/50 bg-gradient-to-t from-playground/50 to-transparent">
          <button
            onClick={handleLogOut}
            type="button"
            className="group w-full px-4 py-3 flex items-center justify-start gap-2.5 2xl:text-lg outline-none rounded-xl text-[#373643] cursor-pointer transition-colors duration-200 ease-[cubic-bezier(0.3,0,0,1)] hover:bg-red-50/90 active:bg-red-50"
          >
            <FiLogOut className="text-red-400 transition-transform duration-200 group-hover:-translate-x-0.5" size={18} />
            <span className="text-red-500 font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
