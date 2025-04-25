import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

interface DialogWrapperProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  trigger?: ReactNode;
  footer?: ReactNode;
  onSubmit?: () => void;
  submitText?: string;
  submitVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  showCancel?: boolean;
  cancelText?: string;
  isWide?: boolean;
  preventClickOutside?: boolean;
  className?: string;
}

export default function DialogWrapper({
  open: controlledOpen,
  setOpen: controlledSetOpen,
  title,
  description,
  children,
  trigger,
  footer,
  onSubmit,
  submitText = "Confirm",
  submitVariant = "default",
  isWide = false,
  className,
  preventClickOutside = false,
}: DialogWrapperProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const setOpenState = controlledSetOpen ?? setLocalOpen;

  const handleSubmit = () => {
    onSubmit?.();
    setOpenState(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpenState}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "flex flex-col max-h-[80vh] gap-2",
          isWide && "max-w-[600px]",
          className
        )}
        onPointerDownOutside={(e) => {
          if (preventClickOutside) {
            e.preventDefault();
          }
        }}
      >
        {(title || description) && (
          <DialogHeader className="p-1">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div className="grow flex min-h-0">
          <ScrollArea className="w-full [&>*]:p-1">{children}</ScrollArea>
        </div>

        {(footer || onSubmit) && (
          <DialogFooter className="p-1">
            {footer || (
              <>
                {onSubmit && (
                  <Button
                    variant={submitVariant}
                    onClick={handleSubmit}
                    size="sm"
                  >
                    {submitText}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
