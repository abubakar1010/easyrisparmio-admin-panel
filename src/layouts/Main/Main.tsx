import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import Header from "./Header";
import Sidebar from "./Sidebar";

const Main = () => {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-playground">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label={t("sidebar.close_navigation")}
          className="fixed inset-0 z-[14] bg-black/45 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-h-screen pl-0 md:pl-[250px] 2xl:pl-[280px]">
        <Header onMobileMenuClick={() => setMobileNavOpen(true)} />
        <main className="px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Main;
