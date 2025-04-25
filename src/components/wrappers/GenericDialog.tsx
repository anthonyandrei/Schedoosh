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
import { ReactNode, useState } from "react";

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
      <DialogContent>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        {children}

        {(footer || onSubmit) && (
          <DialogFooter>
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
