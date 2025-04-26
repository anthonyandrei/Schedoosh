import StepsDialog from "@/components/wrappers/StepsDialog";

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
    <StepsDialog
      steps={steps}
      title="Smart Manual Mode"
      description="Smart Manual Mode allows you to curate your schedule by giving you fine control using time ranges!"
    />
  );
}
