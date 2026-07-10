import { Provider } from "react-redux";
import { store } from "../../redux/store";
import type { TCommonProps } from "../../types/common.type";
import { mainTheme } from "../antTheme";
import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import itIT from "antd/locale/it_IT";
import enUS from "antd/locale/en_US";

const antLocales: Record<string, typeof enUS> = {
  en: enUS,
  it: itIT,
};

const MainProvider = ({ children }: TCommonProps) => {
  const { i18n } = useTranslation();
  const antLocale = antLocales[i18n.language] || enUS;

  return (
    <Provider store={store}>
      <ConfigProvider theme={mainTheme} locale={antLocale}>
        {children}
      </ConfigProvider>
    </Provider>
  );
};

export default MainProvider;
