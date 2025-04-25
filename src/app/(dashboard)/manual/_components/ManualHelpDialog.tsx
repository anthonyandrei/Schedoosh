import { StepCard } from "@/components/navbar/HelpDialog";
import { Button } from "@/components/ui/button";
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

export default function ManualHelp() {
  const steps = [
    {
      title: "Select Courses",
      description:
        "Before using smart manual mode, make sure to select the classes you want to appear first in the Courses Tab.",
    },
    {
      title: "Click & Drag",
      description:
        "Click and drag on the calendar to show the classes that are inside that range. If you only click and not drag, it will instead show courses that start at that time.",
    },
    {
      title: "Include classes happening during this time",
      description:
        "Switching this on will include classes that are happening during the selected time (i.e. A range of 8:00am - 10:00am will include classes from 7:30am - 9:00am)",
    },
    {
      title: "Select a Class",
      description:
        "Click on a class to select it. You can also hover to see their details. The course of the class you select will not be shown in future selections unless the class is removed.",
    },
    {
      title: "Customize, Save, Export, or Download",
      description:
        "Once you're done, you can customize the schedule, save it, download it as an image, or export it as a .ical file for your calendar!",
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
            <CircleHelp className="mr-2 size-4" /> What is Smart Manual Mode?
          </DialogTitle>
          <DialogDescription>
            Smart Manual Mode allows you to curate your schedule by giving you
            fine control using time ranges!
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
