import { unstableSetRender } from "antd";
import { createRoot, type Root } from "react-dom/client";

/**
 * Lets antd v5's static methods render under React 19.
 *
 * `message.error()`, `Modal.confirm()` and `notification.*` mount their own
 * React tree. antd 5 does that through `ReactDOM.render`, which React 19
 * removed, so without this every static call fails silently: an edit the API
 * refuses shows no error, a delete never asks for confirmation. This is the
 * hook antd documents for React 19 (https://u.ant.design/v5-for-19) — the same
 * code `@ant-design/v5-patch-for-react-19` ships, without the extra package.
 *
 * Must be imported before anything calls a static method; main.tsx does so first.
 */
type ContainerWithRoot = (Element | DocumentFragment) & { _reactRoot?: Root };

unstableSetRender((node, container) => {
  const host = container as ContainerWithRoot;
  host._reactRoot ||= createRoot(container);
  const root = host._reactRoot;
  root.render(node);
  return async () => {
    // Unmounting synchronously while React is rendering logs a warning.
    await new Promise((resolve) => setTimeout(resolve, 0));
    root.unmount();
  };
});
