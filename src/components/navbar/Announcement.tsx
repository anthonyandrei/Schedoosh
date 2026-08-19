"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import StepsDialog from "@/components/wrappers/StepsDialog";
import { useGlobalStore } from "@/stores/useGlobalStore";
import ResponsiveButton from "../wrappers/ResponsiveButton";

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

  const title = "The ArchersHub Migration Update!";
  const patchDate = "May 2025 (ArchersHub Update)";
  const description = `Schedoosh has migrated from MLS to ArchersHub! Check out what's new:\nPatch Date: ${patchDate}`;

  const updates = [
    {
      title: "ArchersHub Course Integration",
      description:
        "Schedoosh now fetches courses directly from ArchersHub! Connect your session in seconds using the 1-click DevTools console copy snippet.",
    },
    {
      title: "Self-Contained & Faster",
      description:
        "Course scraping and parsing now run directly within Schedoosh with zero external backend dependencies and local-first session security.",
    },
    {
      title: "Zero Data Loss & Smart Manual",
      description:
        "All your existing saved schedules and custom courses have been seamlessly preserved across store version upgrades.",
    },
    {
      title: "Call for suggestions",
      description:
        "If you have any feedback or suggestions, please let us know on GitHub or Reddit DM. Happy scheduling!",
    },
  ];

  useEffect(() => {
    if (hasHydrated && hasSeenAnnouncement !== patchDate) {
      setOpen(true);
      setHasSeenAnnouncement(patchDate);
    }
  }, [hasHydrated, hasSeenAnnouncement, setHasSeenAnnouncement, patchDate]);

  return (
    <StepsDialog
      open={open}
      onOpenChange={setOpen}
      steps={updates}
      title={title}
      description={description}
      triggerIcon={Megaphone}
    >
      <ResponsiveButton icon={Megaphone}>
        <span className="text-sm">Announcements</span>
      </ResponsiveButton>
    </StepsDialog>
  );
}
