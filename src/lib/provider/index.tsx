import { Provider } from "react-redux";
import { store } from "../../redux/store";
import type { TCommonProps } from "../../types/common.type";
import { mainTheme } from "../antTheme";
import { App, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import itIT from "antd/locale/it_IT";
import enUS from "antd/locale/en_US";
import { normalizeLanguage } from "../../i18n";

const antLocales: Record<"it" | "en", typeof itIT> = {
  it: itIT,
  en: enUS,
};

const MainProvider = ({ children }: TCommonProps) => {
  const { i18n } = useTranslation();
  const antLocale = antLocales[normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)];

  return (
    <Provider store={store}>
      <ConfigProvider theme={mainTheme} locale={antLocale}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </Provider>
  );
};

export default MainProvider;
