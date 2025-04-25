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

interface ConfirmDialogProps {
  onSubmit: () => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function ConfirmDialog({
  onSubmit: action,
  open,
  setOpen,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  children,
}: ConfirmDialogProps) {
  const handleClick = () => {
    action();
    setOpen?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={handleClick} size="sm">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
