import { Button } from "@/components/ui/button";
import { Class } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Plus } from "lucide-react";
import { useState } from "react";
import ClassForm from "../../app/(dashboard)/_components/ClassForm";
import DialogWrapper from "../wrappers/GenericDialog";

interface AddCustomClassProps {
  courseCode: string;
}

export default function AddCustomClass({ courseCode }: AddCustomClassProps) {
  const [open, setOpen] = useState(false);
  const addClassToCourse = useGlobalStore((state) => state.addClassToCourse);

  const onSubmit = (values: Class) => {
    addClassToCourse(courseCode, values);
    setOpen(false);
  };

  return (
    <DialogWrapper
      open={open}
      setOpen={setOpen}
      title="Add Custom Class"
      description="For classes/schedules that aren't found in MLS."
      trigger={
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-2" />
          Add Class
        </Button>
      }
      isWide
    >
      <ClassForm onSubmit={onSubmit} courseCode={courseCode} />
    </DialogWrapper>
  );
}
