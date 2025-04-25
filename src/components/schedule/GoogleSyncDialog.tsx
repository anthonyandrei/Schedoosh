"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import useGoogleCalendar from "@/hooks/useGoogleCalendar";
import { Loader2 } from "lucide-react";

interface GoogleSyncProps {
  hookProps: Omit<ReturnType<typeof useGoogleCalendar>, "handleClick">;
}

export default function GoogleSyncDialog({ hookProps }: GoogleSyncProps) {
  const {
    calendars,
    open,
    setOpen,
    selectedCalendar,
    setSelectedCalendar,
    handleExport,
    importing,
  } = hookProps;

  return (
    <DialogWrapper
      open={open}
      setOpen={setOpen}
      title="Select a Calendar"
      description="The calendar is where the schedule will be exported to."
      footer={
        <Button
          onClick={handleExport}
          variant="outline"
          disabled={!selectedCalendar || importing}
        >
          {importing && <Loader2 className="size-4 animate-spin mr-2" />}
          {importing ? "Importing..." : "Import"}
        </Button>
      }
    >
      <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
        <SelectTrigger>
          <SelectValue placeholder="Select a calendar" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {calendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </DialogWrapper>
  );
}
