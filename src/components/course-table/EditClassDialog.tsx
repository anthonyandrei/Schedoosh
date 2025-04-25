import DialogWrapper from "@/components/wrappers/GenericDialog";
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
    <DialogWrapper
      open={open}
      setOpen={setOpen}
      isWide
      title="Edit Class Details"
      description="Edit the details of the class manually here."
    >
      <ClassForm
        onSubmit={onSubmit}
        courseCode={data.course}
        defaultValues={data}
      />
    </DialogWrapper>
  );
}
