import { ReactNode, useEffect, useState } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import useBetterMediaQuery from "@/hooks/useBetterMediaQuery";
import { cn } from "@/lib/utils";

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

  const isMobile = useBetterMediaQuery("(max-width: 720px)");

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit?.();
    setOpenState(false);
  };

  useEffect(() => {
    console.log("isMobile", isMobile);
  }, [isMobile]);

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setOpenState}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent
          className={className}
          onPointerDownOutside={(e) => {
            if (preventClickOutside) {
              e.preventDefault();
            }
          }}
        >
          {(title || description) && (
            <DrawerHeader className="pt-4 text-left">
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </DrawerHeader>
          )}
          {children && (
            <div className="flex min-h-0 grow px-4">
              <ScrollArea className="w-full [&>*]:p-1">{children}</ScrollArea>
            </div>
          )}

          {(footer || onSubmit) && (
            <DrawerFooter className="p-4 pt-0">
              {footer ||
                (onSubmit && (
                  <Button
                    variant={submitVariant}
                    onClick={handleSubmit}
                    size="sm"
                    type="button"
                  >
                    {submitText}
                  </Button>
                ))}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpenState}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "flex max-h-[80vh] flex-col gap-2",
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
        {children && (
          <div className="flex min-h-0 grow">
            <ScrollArea className="w-full [&>*]:p-1">{children}</ScrollArea>
          </div>
        )}

        {(footer || onSubmit) && (
          <DialogFooter className="p-1">
            {footer ||
              (onSubmit && (
                <Button
                  variant={submitVariant}
                  onClick={handleSubmit}
                  size="sm"
                  type="button"
                >
                  {submitText}
                </Button>
              ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
