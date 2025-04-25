import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipContentProps, TooltipProps } from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

interface TooltipWrapperProps extends TooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: TooltipContentProps["side"];
}

export default function TooltipWrapper({
  children,
  content,
  side = "top",
  ...props
}: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
