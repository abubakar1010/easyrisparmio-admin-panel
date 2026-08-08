import { useParams } from "react-router";
import { Spin, Result } from "antd";
import { useGetPublicStaticPageQuery } from "../../redux/features/StaticPages/staticPagesApi";
import { useTranslation } from "react-i18next";

const slugIcons: Record<string, string> = {
  "privacy-policy": "shield",
  "terms-conditions": "file-text",
  "about-us": "info",
};

const PublicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith("it") ? "it" : "en";

  const { data, isLoading, isError } = useGetPublicStaticPageQuery(
    { slug: slug!, locale },
    { skip: !slug }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Result
        status="404"
        title="404"
        subTitle={
          locale === "it"
            ? "Pagina non trovata."
            : "The page you're looking for doesn't exist."
        }
      />
    );
  }

  const icon = slugIcons[slug || ""] || "file-text";

  return (
    <article className="public-page-article">
      {/* Page header */}
      <div className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#7061ED]/10 flex items-center justify-center flex-shrink-0">
            {icon === "shield" && (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7061ED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            {icon === "file-text" && (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7061ED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {icon === "info" && (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7061ED]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {data.title}
          </h1>
        </div>
        <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#7061ED] to-[#5B4FCF]" />
        <p className="mt-3 text-xs text-gray-400">
          {locale === "it" ? "Ultimo aggiornamento" : "Last updated"}:{" "}
          {new Date(data.updatedAt).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Page content */}
      <div
        className="public-page-content"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </article>
  );
};

export default PublicPage;
