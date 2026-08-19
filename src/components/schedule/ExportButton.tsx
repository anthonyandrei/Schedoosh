"use client";

import { CalendarArrowDownIcon, CalendarSync, FileDown } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import useGoogleCalendar from "@/hooks/useGoogleCalendar";
import { createICalendar } from "@/lib/calendar";
import { Class } from "@/lib/definitions";
import Dropdown, { DropdownItem } from "../wrappers/Dropdown";
import GoogleSyncDialog from "./GoogleSyncDialog";

interface ExportButtonProps extends ButtonProps {
  classes: Class[];
}

export default function ExportButton({ classes, ...props }: ExportButtonProps) {
  const cal = createICalendar(classes);
  const { handleClick, ...hookProps } = useGoogleCalendar(classes);

  const handleDownload = () => {
    const icsData = cal.toString();
    const blob = new Blob([icsData], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedoosh_schedule.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dropdownItems: DropdownItem[] = [
    {
      name: ".ics file (iCalendar)",
      Icon: FileDown,
      onClick: handleDownload,
    },
    {
      name: "Google Calendar",
      Icon: CalendarSync,
      onClick: handleClick,
    },
  ];

  return (
    <div>
      <Dropdown items={dropdownItems} align="start" className="w-52">
        <Button
          onClick={handleDownload}
          className="w-full"
          variant="secondary"
          {...props}
        >
          <CalendarArrowDownIcon className="mr-2 size-4" />
          Export
        </Button>
      </Dropdown>
      <GoogleSyncDialog hookProps={hookProps} />
    </div>
  );
}
