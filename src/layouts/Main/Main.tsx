import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Main = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-playground/35">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-[14] bg-black/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-h-screen pl-0 md:pl-[250px] 2xl:pl-[280px]">
        <Header onMobileMenuClick={() => setMobileNavOpen(true)} />
        <div className="p-3 sm:p-4 md:p-6 max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Main;
