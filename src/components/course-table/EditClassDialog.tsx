import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Class } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import ClassForm from "../../app/(dashboard)/_components/ClassForm";

interface EditClassDialogProps {
  data: Class;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function EditClassDialog({
  data,
  open,
  setOpen,
}: EditClassDialogProps) {
  const editClass = useGlobalStore((state) => state.editClass);

  const onSubmit = (values: Class) => {
    editClass(data.course, data.code, values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[600px] max-h-[80%] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Class Details</DialogTitle>
          <DialogDescription>
            Edit the details of the class manually here.
          </DialogDescription>
        </DialogHeader>
        <ClassForm
          onSubmit={onSubmit}
          courseCode={data.course}
          defaultValues={data}
        />
      </DialogContent>
    </Dialog>
  );
}
