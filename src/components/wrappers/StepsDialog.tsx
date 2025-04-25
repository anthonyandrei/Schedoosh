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
import { CircleHelp, LucideIcon } from "lucide-react";

export interface StepCardProps {
  step?: number;
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

interface StepsDialogProps {
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
}: StepsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="icon">
          <TriggerIcon className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center">
            <TitleIcon className="mr-2 size-4" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
