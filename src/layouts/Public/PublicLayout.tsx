import { Outlet, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";

const navLinks = [
  { slug: "about-us", labelKey: "aboutUs" },
  { slug: "privacy-policy", labelKey: "privacyPolicy" },
  { slug: "terms-conditions", labelKey: "termsConditions" },
  { slug: "business-terms-conditions", labelKey: "businessTerms" },
] as const;

const navLabels: Record<string, Record<string, string>> = {
  en: {
    aboutUs: "About Us",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    businessTerms: "Business Terms",
  },
  it: {
    aboutUs: "Chi Siamo",
    privacyPolicy: "Informativa Privacy",
    termsConditions: "Termini e Condizioni",
    businessTerms: "Termini Business",
  },
};

const PublicLayout = () => {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("it") ? "it" : "en";
  const labels = navLabels[lang] || navLabels.en;
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
                alt="EasyRisparmio"
                className="h-8 sm:h-9 w-auto"
              />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#7061ED] to-[#5B4FCF] bg-clip-text text-transparent group-hover:from-[#5B4FCF] group-hover:to-[#7061ED] transition-all">
                EasyRisparmio
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
                    {labels[labelKey]}
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
                  alt="EasyRisparmio"
                  className="h-7 w-auto brightness-0 invert opacity-90"
                />
                <span className="text-lg font-bold text-white">
                  EasyRisparmio
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {lang === "it"
                  ? "La piattaforma italiana per il confronto e il cambio di fornitore energetico."
                  : "The Italian platform for energy supplier comparison and switching."}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {lang === "it" ? "Link Utili" : "Quick Links"}
              </h4>
              <ul className="space-y-2">
                {navLinks.map(({ slug, labelKey }) => (
                  <li key={slug}>
                    <Link
                      to={`/pages/${slug}`}
                      className="text-sm text-gray-400 hover:text-white no-underline transition-colors"
                    >
                      {labels[labelKey]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                {lang === "it" ? "Contatti" : "Contact"}
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>info@easyresparmio.it</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>&copy; {currentYear} EasyRisparmio S.r.l. {lang === "it" ? "Tutti i diritti riservati." : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
