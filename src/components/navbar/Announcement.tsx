"use client";

import { Dialog } from "@/components/ui/dialog";
import StepsDialog from "@/components/wrappers/StepsDialog";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

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
  const patchDate = "April 19, 2025 (Part 3)";
  const description = `I've added a lot of things! Check them out!\nPatch Date: ${patchDate}`;

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
  }, [hasHydrated, hasSeenAnnouncement, setHasSeenAnnouncement, patchDate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <StepsDialog
        steps={updates}
        title={title}
        description={description}
        triggerIcon={Megaphone}
      />
    </Dialog>
  );
}
