import { DialogProps } from "@radix-ui/react-dialog";
import { CircleHelp, LucideIcon } from "lucide-react";
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

export interface StepCardProps {
  step?: number;
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

interface StepsDialogProps extends DialogProps {
  steps: StepCardProps[];
  title?: string;
  description?: string;
  triggerIcon?: LucideIcon;
  titleIcon?: LucideIcon;
  triggerVariant?: "outline" | "default" | "secondary" | "ghost";
}

export default function StepsDialog({
  steps,
  title = "Tutorial",
  description = "Here is how to use this website!",
  triggerIcon: TriggerIcon = CircleHelp,
  titleIcon: TitleIcon = CircleHelp,
  triggerVariant = "outline",
  children,
  ...props
}: StepsDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant={triggerVariant} size="icon">
            <TriggerIcon className="size-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center">
            <TitleIcon className="mr-2 size-4" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
}
