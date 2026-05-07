import { FaChevronRight } from "react-icons/fa6";
import { IoHome } from "react-icons/io5";
import { useNavigate } from "react-router";

const PageHeader = ({ title, path }: { title: string; path?: string }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#E6F1FF] flex justify-between items-center px-4 py-1.5 rounded-md drop-shadow-xs shadow-inherit ">
      <h3 className="font-semibold text-brand text-2xl">{title}</h3>
      <div className="flex justify-between items-center gap-1.5 bg-primary/40 px-5 py-3 rounded-4xl text-white">
        <IoHome size={18} className="shrink-0" /> <span>Home</span>{" "}
        <FaChevronRight size={10}/>{" "}
        <h3 onClick={() => path && navigate(path)} className="text-slate-800">{title}</h3>
      </div>
    </div>
  );
};

export default PageHeader;
