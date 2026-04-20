import { Ellipsis } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { Class } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import Dropdown, { DropdownItem } from "../wrappers/Dropdown";
import EditClassDialog from "./EditClassDialog";

interface Props {
  data: Class;
}

export default function RowSettings({ data }: Props) {
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const deleteClass = useGlobalStore((state) => state.deleteClass);

  const items: DropdownItem[] = [
    {
      name: "Edit",
      onClick: () => setOpenEdit(true),
    },
    {
      name: "Delete",
      onClick: () => setOpenDelete(true),
    },
  ];

  const handleDelete = () => {
    deleteClass(data.course, data.code);
  };

  return (
    <div>
      <Dropdown items={items}>
        <Button size="icon" variant="ghost" className="size-8">
          <Ellipsis className="size-4" />
        </Button>
      </Dropdown>
      <EditClassDialog data={data} open={openEdit} setOpen={setOpenEdit} />
      <DialogWrapper
        onSubmit={handleDelete}
        open={openDelete}
        setOpen={setOpenDelete}
        title="Delete Class"
        description="Are you sure you want to delete this class? This action cannot be undone."
      />
    </div>
  );
}
