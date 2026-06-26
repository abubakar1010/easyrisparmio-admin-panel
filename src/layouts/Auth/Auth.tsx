import { Outlet } from "react-router";

const Auth = () => {
  return (
    <div className="min-h-[100dvh] max-w-[1536px] mx-auto w-full flex justify-center items-center px-3 py-5 sm:p-6 md:p-8 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="w-full bg-white rounded-xl sm:rounded-2xl md:shadow-xl flex flex-col md:flex-row overflow-hidden max-w-5xl mx-auto border border-gray-100 md:border-none min-h-0">
        <div className="hidden md:flex md:w-1/2 items-center justify-center p-6 lg:p-8">
          <img
            src="/statics/authentication.svg"
            alt=""
            className="max-w-full h-auto max-h-[min(52vh,420px)] object-contain pointer-events-none select-none"
            draggable={false}
          />
        </div>
        <div className="w-full md:w-1/2 md:border-l md:border-gray-200/30 p-5 sm:p-8 lg:p-14 flex flex-col justify-center min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Auth;
