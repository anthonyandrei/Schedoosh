import { ReactElement } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormTextFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
  divClassName?: string;
  inputType?: "text" | "number" | "password" | "email";
  disabled?: boolean;
  startIcon?: ReactElement;
  endIcon?: ReactElement;
  onChange?: (value: string | number) => void;
}

export function FormTextField<T extends FieldValues>({
  form,
  formKey,
  label = "",
  description,
  placeholder,
  className,
  divClassName,
  inputType = "text",
  disabled,
  onChange,
}: FormTextFieldProps<T>) {
  return (
    <div className={cn("relative", divClassName)}>
      <FormField
        control={form.control}
        name={formKey}
        render={({ field }) => (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}

            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type={inputType}
                  disabled={disabled || form.formState.isSubmitting}
                  placeholder={placeholder}
                  className={className}
                  onChange={(e) => {
                    let value: string | number = e.target.value;
                    if (inputType === "number") {
                      value =
                        e.target.value === "" ? "" : parseFloat(e.target.value);
                    }
                    field.onChange(value);
                    onChange?.(value);
                  }}
                />
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
