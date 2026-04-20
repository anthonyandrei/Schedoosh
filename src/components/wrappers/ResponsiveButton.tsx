import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "../ui/button";

interface ResponsiveButtonProps extends ButtonProps {
  icon: LucideIcon;
  className?: string;
  hasOutline?: boolean;
}
export default function ResponsiveButton({
  icon: Icon,
  className,
  children,
  hasOutline = false,
  ...props
}: ResponsiveButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "w-auto justify-start gap-2 px-4 py-2 xl:w-10 xl:justify-center xl:border-solid xl:px-0 xl:py-0",
        !hasOutline && "border-none",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-5 shrink-0" suppressHydrationWarning />}
      <span className="visible xl:hidden">{children}</span>
    </Button>
  );
}
