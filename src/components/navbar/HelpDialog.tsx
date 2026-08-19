import { CircleHelp } from "lucide-react";
import { Card } from "@/components/ui/card";
import ResponsiveButton from "../wrappers/ResponsiveButton";
import StepsDialog from "../wrappers/StepsDialog";

interface StepCardProps {
  step: number;
  description: string;
  title: string;
}

export function StepCard({ step, description, title }: StepCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="inline-flex items-center gap-2">
        <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-sm border border-border bg-accent font-bold text-accent-foreground">
          {step}
        </div>
        <div className="font-semibold text-card-foreground">{title}</div>
      </div>

      <div>
        <div className="text-pretty text-sm">{description}</div>
      </div>
    </Card>
  );
}

export default function HelpDialog() {
  const steps = [
    {
      title: "Connect ArchersHub",
      description:
        "Click the ArchersHub button on the top-right corner to connect your session token using the 1-click DevTools console helper.",
    },
    {
      title: "Add Courses",
      description:
        "Go to the 'Courses' tab, type your course code (e.g., CCPROG1), and click 'Add Course'. Repeat for all your desired courses.",
    },
    {
      title: "Select Classes",
      description:
        "In each course, click the classes you want to take. This will be used to generate schedules later.",
    },
    {
      title: "(Optional) Create Groups",
      description:
        "Click on 'Group Courses' to create groups of courses. Change the 'picks' to the number of courses you want to appear in your schedule for that group.",
    },
    {
      title: "Generate Schedule",
      description:
        "Go to the 'Schedules' tab and click 'Generate Schedules'. This will generate all possible schedules!",
    },
    {
      title: "Save your Schedule",
      description:
        "Click on the heart button to save your schedule. You can also customize the colors of your schedule by clicking on the paint palette button.",
    },
    {
      title: "Download/Export your Schedule",
      description:
        "You can also download your schedule as an image or export it to Google Calendar by clicking the respective buttons.",
    },
  ];

  return (
    <StepsDialog steps={steps}>
      <ResponsiveButton icon={CircleHelp}>Site Tutorial</ResponsiveButton>
    </StepsDialog>
  );
}
