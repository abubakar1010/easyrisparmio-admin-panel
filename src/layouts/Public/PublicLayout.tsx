import i18n from "../../i18n";
import { Outlet, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

// The page names share the admin's keys, so the public site follows the same catalogue.
const navLinks = [
  { slug: "about-us", labelKey: "audit.slug_about_us" },
  { slug: "privacy-policy", labelKey: "audit.slug_privacy_policy" },
  { slug: "terms-conditions", labelKey: "audit.slug_terms_conditions" },
] as const;

const PublicLayout = () => {
  const { pathname } = useLocation();
  useTranslation(); // re-render when the language changes
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Logo */}
            <Link
              to="/pages/about-us"
              className="flex items-center gap-2.5 no-underline group"
            >
              <img
                src="/statics/logo.svg"
                alt="VYZI"
                className="h-8 sm:h-9 w-auto"
              />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#7061ED] to-[#5B4FCF] bg-clip-text text-transparent group-hover:from-[#5B4FCF] group-hover:to-[#7061ED] transition-all">
                VYZI
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map(({ slug, labelKey }) => {
                const isActive = pathname === `/pages/${slug}`;
                return (
                  <Link
                    key={slug}
                    to={`/pages/${slug}`}
                    className={`
                      px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium no-underline transition-all duration-200
                      ${
                        isActive
                          ? "bg-[#7061ED]/10 text-[#7061ED]"
                          : "text-gray-600 hover:text-[#7061ED] hover:bg-gray-100/80"
                      }
                    `}
                  >
                    {i18n.t(labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img
                  src="/statics/logo.svg"
                  alt="VYZI"
                  className="h-7 w-auto brightness-0 invert opacity-90"
                />
                <span className="text-lg font-bold text-white">
                  VYZI
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {i18n.t("audit.public_tagline")}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {i18n.t("audit.public_quick_links")}
              </h4>
              <ul className="space-y-2">
                {navLinks.map(({ slug, labelKey }) => (
                  <li key={slug}>
                    <Link
                      to={`/pages/${slug}`}
                      className="text-sm text-gray-400 hover:text-white no-underline transition-colors"
                    >
                      {i18n.t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {i18n.t("audit.public_contact")}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>supporto@vyzi.app</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>&copy; {currentYear} VYZI S.r.l. {i18n.t("audit.public_rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
