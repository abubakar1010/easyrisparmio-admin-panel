import { useTranslation } from "react-i18next";
import { Input } from "antd";
import { FiSearch } from "react-icons/fi";

export function HomeTopBar() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
      <Input
        size="large"
        placeholder={t("home.search_placeholder")}
        prefix={<FiSearch className="text-owngray" />}
        className="max-w-full lg:max-w-md rounded-lg border-gray-200"
        allowClear
      />
    </div>
  );
}
