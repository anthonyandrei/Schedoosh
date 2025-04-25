import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/wrappers/ConfirmDialog";
import { UserSchedule } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { CopyPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CopyToManualButtonProps {
  activeSchedule: UserSchedule;
}
export default function CopyToManualButton({
  activeSchedule,
}: CopyToManualButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const setManualSchedule = useGlobalStore((state) => state.setManualSchedule);
  const handleOnClick = () => {
    setManualSchedule(activeSchedule);
    toast.success("Copied Schedule to Manual!");
    router.push("/manual");
  };

  return (
    <ConfirmDialog
      onSubmit={handleOnClick}
      title="Copy to Smart Manual"
      description="Copying over will remove the current manual schedule. Are you sure?"
      open={open}
      setOpen={setOpen}
    >
      <Button variant="outline">
        <CopyPlus className="size-4 mr-2" /> Copy to Manual
      </Button>
    </ConfirmDialog>
  );
}
