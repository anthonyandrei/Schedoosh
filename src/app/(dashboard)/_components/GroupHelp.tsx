import StepsDialog, { StepCardProps } from "@/components/wrappers/StepsDialog";
import { CircleHelp } from "lucide-react";

const GroupHelp = () => {
  const steps: StepCardProps[] = [
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
    <StepsDialog
      steps={steps}
      title="Grouped Courses"
      description="Grouped courses allow you to group courses together to create more flexible schedules."
      triggerIcon={CircleHelp}
    />
  );
};
export default GroupHelp;
