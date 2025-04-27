import { Button, ButtonProps } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { UserSchedule } from "@/lib/definitions";
import { ColorsEnum, ColorsEnumSchema } from "@/lib/enums";
import { getCardColors } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Check, CheckCheck, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import ResponsiveButton from "../wrappers/ResponsiveButton";

interface CourseColorsDialogProps extends ButtonProps {
  activeSched?: UserSchedule;
  changeColors?: (colors: Record<string, ColorsEnum>) => void;
}

export default function CourseColorsDialog({
  activeSched,
  changeColors,
  ...props
}: CourseColorsDialogProps) {
  const { courseColors, setCourseColors, randomizeColors, setRandomizeColors } =
    useGlobalStore(
      useShallow((state) => ({
        courseColors: state.courseColors,
        setCourseColors: state.setCourseColors,
        randomizeColors: state.randomizeColors,
        setRandomizeColors: state.setRandomizeColors,
      }))
    );

  const [colors, setColors] = useState(() => ({
    ...(activeSched ? activeSched.colors : courseColors),
  }));
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (!activeSched) {
      setCourseColors(colors);
    } else {
      changeColors?.(colors);
    }

    toast.success("Colors successfully saved!", {
      description: "Your course colors have been saved.",
    });
    setOpen(false);
  };

  useEffect(() => {
    setColors(activeSched ? { ...activeSched.colors } : { ...courseColors });
  }, [activeSched, courseColors]);

  const trigger = (
    <ResponsiveButton
      icon={Palette}
      hasOutline
      className="justify-center"
      {...props}
    >
      Customize
    </ResponsiveButton>
  );

  const footer = (
    <>
      <div className="flex items-center gap-2 mr-auto">
        <Switch
          id="randomize-colors"
          checked={randomizeColors}
          onCheckedChange={setRandomizeColors}
        />
        <Label htmlFor="randomize-colors">Randomize Colors on Generate?</Label>
      </div>
      <Button onClick={handleSave}>
        <CheckCheck className="size-4 mr-2" />
        Save
      </Button>
    </>
  );

  return (
    <DialogWrapper
      open={open}
      setOpen={setOpen}
      title="Course Colors"
      description="Change how your courses colors look!"
      trigger={trigger}
      footer={footer}
      isWide
    >
      <div className="flex flex-col gap-4">
        {Object.entries(colors).map(([course, color]) => (
          <Card key={course} className="flex flex-col gap-2 p-4">
            <div className="font-bold">{course}</div>
            <div className="grid grid-cols-9 gap-2 w-full h-16">
              {ColorsEnumSchema.options.map((colorEnum) => {
                const { color: colorCSS } = getCardColors(colorEnum);
                return (
                  <div
                    key={colorEnum}
                    className={`size-7 ${colorCSS} rounded-full cursor-pointer inline-flex items-center justify-center w-full`}
                    onClick={() =>
                      setColors({ ...colors, [course]: colorEnum })
                    }
                  >
                    {color === colorEnum && <Check className="size-4" />}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </DialogWrapper>
  );
}
