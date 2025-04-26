import { Button } from "@/components/ui/button";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { UserSchedule } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { CopyPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CopyToManualButtonProps {
  activeSchedule: UserSchedule;
}
export default function CopyToManualButton({
  activeSchedule,
}: CopyToManualButtonProps) {
  const router = useRouter();
  const setManualSchedule = useGlobalStore((state) => state.setManualSchedule);
  const handleOnClick = () => {
    setManualSchedule(activeSchedule);
    toast.success("Copied Schedule to Manual!");
    router.push("/manual");
  };

  return (
    <DialogWrapper
      onSubmit={handleOnClick}
      title="Copy to Smart Manual"
      description="Copying over will remove the current manual schedule. Are you sure?"
      trigger={
        <Button variant="outline">
          <CopyPlus className="size-4 mr-2" /> Copy to Manual
        </Button>
      }
    ></DialogWrapper>
  );
}
