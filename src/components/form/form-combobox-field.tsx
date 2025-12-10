import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Combobox, ComboboxProps } from "@/components/ui/combobox";
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";

type BooleanPath<T> = {
  [K in Path<T>]: PathValue<T, K> extends boolean ? K : never;
}[Path<T>];

interface FormFieldComboboxProps<T extends FieldValues> extends Omit<
  ComboboxProps,
  "value" | "onValueChange" | "onCustomChange"
> {
  form: UseFormReturn<T>;
  label?: string;
  formKey: Path<T>;
  isCustomFormKey?: BooleanPath<T>;
  formDescription?: string;
  onValueChange?: (value: string) => void;
  onCustomChange?: (value: boolean) => void;
}

export function FormComboboxField<T extends FieldValues>({
  form,
  label,
  formKey,
  formDescription,
  className,
  onValueChange = () => {},
  isCustomFormKey,
  onCustomChange = () => {},
  ...props
}: FormFieldComboboxProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <Combobox
            value={field.value}
            onValueChange={(currentValue) => {
              field.onChange(currentValue);
              onValueChange(currentValue);
            }}
            disabled={form.formState.isSubmitting}
            allowCustom={!!isCustomFormKey}
            onCustomChange={(newVal) => {
              if (isCustomFormKey) {
                form.setValue(
                  isCustomFormKey,
                  newVal as PathValue<T, typeof isCustomFormKey>
                );
              }

              onCustomChange(newVal);
            }}
            isCustom={isCustomFormKey && form.watch(isCustomFormKey)}
            {...props}
          />
          {formDescription && (
            <FormDescription>{formDescription}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
