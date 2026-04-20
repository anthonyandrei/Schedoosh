import { useDroppable } from "@dnd-kit/core";
import { Plus, PlusSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { CourseGroup } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";

interface CreateGroupDialogProps {
  onCreateGroup: (groupName: string) => void;
  existingGroups: CourseGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}

export default function CreateGroupDialog({
  onCreateGroup,
  existingGroups,
  open,
  onOpenChange,
  activeId,
  setActiveId,
}: CreateGroupDialogProps) {
  const moveCourseToGroup = useGlobalStore((state) => state.moveCourseToGroup);

  const { setNodeRef, isOver } = useDroppable({
    id: "create-group",
  });
  const [groupName, setGroupName] = useState("");

  const handleCreateGroup = (e: React.FormEvent) => {
    const trimmed = groupName.trim();
    e.preventDefault();

    const reservedNames = ["Ungrouped", "Disabled"];

    if (!trimmed) {
      toast.error("Group name cannot be empty!", {
        description: "Please enter a valid group name.",
      });
      return;
    }

    if (
      reservedNames.includes(trimmed) ||
      existingGroups.some((group) => group.name === trimmed)
    ) {
      toast.error("Group name is not allowed or already exists!", {
        description: "Please choose a unique and valid name.",
      });
      return;
    }

    onCreateGroup(trimmed);

    if (activeId) {
      moveCourseToGroup(trimmed, activeId);
      setActiveId(null);
    }

    setGroupName("");
    onOpenChange(false);
  };

  return (
    <DialogWrapper
      trigger={
        <div
          className={cn(
            "flex h-[300px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-primary/30 border-dashed p-4 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary",
            isOver && "animate-border-pulse border-primary"
          )}
          ref={setNodeRef}
        >
          <PlusSquare className="size-8" strokeWidth={1.75} />
          <span className="w-44 text-center">
            Drag or Click here to Create New Group
          </span>
        </div>
      }
      title="Create New Group"
      description="Add a new group to organize your courses."
      open={open}
      setOpen={onOpenChange}
    >
      <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
        <Input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name"
          autoComplete="off"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setGroupName("");
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit">
            <Plus className="mr-2 size-4" />
            Create
          </Button>
        </div>
      </form>
    </DialogWrapper>
  );
}
