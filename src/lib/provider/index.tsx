
import { Provider } from "react-redux";
import { store } from "../../redux/store";
import type { TCommonProps } from "../../types/common.type";
import { mainTheme } from "../antTheme";
import { ConfigProvider } from "antd";

const MainProvider = ({ children }: TCommonProps) => {
  return (
    <Provider store={store}>
      <ConfigProvider theme={mainTheme}>
        {children}
      </ConfigProvider>
    </Provider>
  );
};

export default MainProvider;
