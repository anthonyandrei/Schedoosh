"use client";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/wrappers/ConfirmDialog";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Bomb } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ErrorPage({ error, reset }: ErrorProps) {
  const resetAllSlices = useGlobalStore((state) => state.resetAllSlices);

  return (
    <div className="w-full h-full flex items-center justify-center flex-col gap-4">
      <Bomb className="size-40 text-muted-foreground" />
      <h2 className="font-bold text-3xl">Whoops, something went wrong!</h2>
      <p className="w-[700px] text-center">
        {`Looks like an error occurred while trying to access the page. Try again,
        if it still doesn't work, please hit "Clear Data" and send a screenshot
        of this page to the developer.`}
      </p>
      <div className="py-2 px-4 rounded-lg bg-destructive/10 text-destructive-foreground border border-destructive/20">
        <code className="">Error: {error.message}</code>
      </div>
      <div className="inline-flex gap-4">
        <ConfirmDialog
          onSubmit={() => {
            resetAllSlices();
            reset();
          }}
          title="Are you sure?"
          description="This will clear all data (excluding ID & schedule filters). This action cannot be undone."
        >
          <Button variant="destructive">Clear ALL Data</Button>
        </ConfirmDialog>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
