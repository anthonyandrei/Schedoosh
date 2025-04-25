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

interface GroupHelpProps {}

const GroupHelp = (props: GroupHelpProps) => {
  const steps = [
    {
      title: "Create a Group",
      description:
        "Click the 'Create Group' box to start creating a new group for your courses. You can also drag it to the 'Create Group' box",
    },
    {
      title: "Add Courses to Group",
      description: "Drag the courses to your newly made group to add them.",
    },
    {
      title: "Set No. of Courses to Pick",
      description:
        "Click on the '...' button on the top right of the group and select 'Change # of picks.' Picks refers to the number of courses you want to take from this group.",
    },
    {
      title: "Generate Schedules",
      description:
        "Once you're done, go to the 'Schedules' tab and click 'Generate Schedules'. This will generate all possible schedules!",
    },
    {
      title: "Why would I use this?",
      description:
        "Say you have 5 GEs you can take, but you only want to take 2. You can group them together and set the number of picks to 2. This will generate schedules with any combination of 2 GEs.",
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
            <CircleHelp className="mr-2 size-4" /> What are Grouped Courses?
          </DialogTitle>
          <DialogDescription>
            Grouped courses allow you to group courses together to create more
            flexible schedules.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] w-full">
          <div className="flex flex-col gap-4">
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
};
export default GroupHelp;
