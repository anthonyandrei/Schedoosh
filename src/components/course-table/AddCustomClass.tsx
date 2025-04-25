import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Class } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Plus } from "lucide-react";
import { useState } from "react";
import ClassForm from "../../app/(dashboard)/_components/ClassForm";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-2" />
          Add Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[80%] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Custom Class</DialogTitle>
          <DialogDescription>
            {"For classes/schedules that aren't found in MLS."}
          </DialogDescription>
        </DialogHeader>
        <ClassForm onSubmit={onSubmit} courseCode={courseCode} />
      </DialogContent>
    </Dialog>
  );
}
