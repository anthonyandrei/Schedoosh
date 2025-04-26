"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard } from "lucide-react";
import { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

const FormSchema = z.object({
  idNumber: z
    .string()
    .min(8, {
      message: "Your ID number must be 8 numbers long.",
    })
    .regex(/^\d+$/, "Your ID should only contain numbers!"),
});

interface IDInputProps {
  children?: ReactNode;
}

const IDInput = ({ children }: IDInputProps) => {
  const { id, setId } = useGlobalStore(
    useShallow((state) => ({
      id: state.id,
      setId: state.setId,
    }))
  );

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    setId(data.idNumber);
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      idNumber: "",
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button
            variant="outline"
            size="icon"
            className={cn(!id && "border-primary animate-pulse")}
          >
            <IdCard className="size-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[380px]">
        <DialogHeader className="">
          <DialogTitle>ID Number</DialogTitle>
          <DialogDescription>
            {
              "We'll need your ID Number to fetch courses. Don't worry, this will only be stored locally!"
            }
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={8} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription className="max-w-80">
                    {!!id && `Current ID: ${id}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogClose asChild>
              <Button type="submit" className="ml-auto">
                Save
              </Button>
            </DialogClose>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default IDInput;
