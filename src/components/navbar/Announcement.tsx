"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { StepCard } from "./HelpDialog";

export default function Announcement() {
  const [open, setOpen] = useState(false);
  const {
    hasSeenAnnouncement,
    setHasSeenAnnouncement,
    _hasHydrated: hasHydrated,
  } = useGlobalStore(
    useShallow((state) => ({
      hasSeenAnnouncement: state.hasSeenAnnouncement,
      setHasSeenAnnouncement: state.setHasSeenAnnouncement,
      _hasHydrated: state._hasHydrated,
    }))
  );

  const title = "The Calendar & Manual Update!";
  const description = "I've added a lot of things! Check them out!";
  const patchDate = "April 19, 2025 (Part 3)";

  const updates = [
    {
      title: "New Smart Manual Mode",
      description:
        "A new mode has been added! Check it out in the Smart Manual tab. tl;dr: Google Calendar, but for your classes.",
    },
    {
      title: "Better UI and Image Design",
      description:
        "UI has been improved, along with the design of the Image Downloads. Check it out in Schedules & Saved!",
    },
    {
      title: "(Fixed) Export to Google Calendar or as .ics file",
      description:
        "You can now export your schedule to Google Calendar or as an .ics file! Click the 'Export' button near the download button. Thanks for the suggestion @Ed*****oded! (Note: You can only use your DLSU email for this!)",
    },
    {
      title: "Call for suggestions",
      description:
        "If you have any more suggestions, please let me know! You can do so through Reddit DM or on GitHub. I will try to implement them as soon as possible.",
    },
  ];

  useEffect(() => {
    if (hasHydrated && hasSeenAnnouncement !== patchDate) {
      setOpen(true);
      setHasSeenAnnouncement(patchDate);
    }
  }, [hasHydrated, hasSeenAnnouncement, setHasSeenAnnouncement]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Megaphone className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] w-full">
          <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
            {updates.map(({ title, description }, i) => (
              <StepCard
                key={i}
                step={i + 1}
                description={description}
                title={title}
              />
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-start">
          <p className="text-sm text-muted-foreground">
            Patch Date: {patchDate}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
