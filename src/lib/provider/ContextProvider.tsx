// "use client";

// import { io, Socket } from "socket.io-client";
// import {
//   createContext,
//   ReactNode,
//   useContext,
//   useEffect,
//   useState,
// } from "react";
// import { useAppSelector } from "../../redux/hooks";


// type ContextProviderProps = {
//   children: ReactNode;
// };
// type ContextProps = {
//   socket: null | Socket;
//   //   socket: null | string;
// };

// const apiUrl = "process.env.NEXT_PUBLIC_SOCKET_URL";

// const AppContext = createContext<ContextProps | null>(null);

// const ContextProvider = ({ children }: ContextProviderProps) => {
//   const { token } = useAppSelector((state) => state.auth);
//   const [socket, setSocket] = useState<Socket | null>(null);
//   useEffect(() => {
//     if (!token) return;
//     const socketData = io(`${apiUrl}`, {
//       transports: ["websocket"],
//     });
//     if (!socketData.connected) {
//       socketData.on("connect", () => {
//         setSocket(socketData);
//       });
//     }
//     // socketData.on("connect_error", (error) => {
//     //   console.log("Connection error", error);
//     // });
//     return () => {
//       socketData.disconnect();
//     };
//   }, [token]);

//   return (
//     <AppContext.Provider value={{ socket }}>{children}</AppContext.Provider>
//   );
// };
// const useAppContext = () => {
//   const context = useContext(AppContext);
//   if (!context) {
//     throw new Error("useAppContext must be used within a ContextProvider");
//   }
//   return context;
// };

// export { useAppContext };

// export default ContextProvider;
