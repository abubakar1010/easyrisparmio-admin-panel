import { FaArrowLeft } from "react-icons/fa6";
import { useNavigate } from "react-router";
import { cn } from "../../utils/cn";
import type { IconType } from "react-icons";
import { createElement } from "react";

const CompHeading = ({
  title,
  backPath,
  hideIcon,
  className,
  backIcon,
}: {
  title: string;
  backPath?: string;
  hideIcon?: boolean;
  className?: string;
  backIcon?: IconType;
}) => {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[24px] font-medium",
        className
      )}
    >
      {!hideIcon && (
        <button
          className="outline-none pr-2 cursor-pointer"
          onClick={() => (backPath ? navigate(backPath) : navigate(-1))}
        >
          {createElement(backIcon || FaArrowLeft, { size: 20 })}
        </button>
      )}
      <h1>{title}</h1>
    </div>
  );
};

export default CompHeading;
