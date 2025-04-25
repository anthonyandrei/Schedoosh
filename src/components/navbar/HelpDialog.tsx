import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CircleHelp } from "lucide-react";

interface StepCardProps {
  step: number;
  description: string;
  title: string;
}

export function StepCard({ step, description, title }: StepCardProps) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="inline-flex gap-2 items-center">
        <div className="rounded-sm border-border border size-6 text-accent-foreground flex items-center justify-center font-bold flex-shrink-0 bg-accent">
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

interface HelpDialogProps {}
export default function HelpDialog({}: HelpDialogProps) {
  const steps = [
    {
      title: "Enter ID",
      description:
        "Click the ID Button on the top-right corner of the site and enter your ID number.",
    },
    {
      title: "Add Courses",
      description:
        "Once done, go to the 'Courses' tab and type your course on the top left. After, click 'Add course'. Repeat for desired courses",
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <CircleHelp className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center">
            <CircleHelp className="mr-2 size-4" /> Tutorial
          </DialogTitle>
          <DialogDescription>
            Here is how to use this website!
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] w-full">
          <div className="gap-4 flex flex-col">
            {steps.map(({ description, title }, i) => (
              <StepCard
                key={i}
                step={i + 1}
                description={description}
                title={title}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
