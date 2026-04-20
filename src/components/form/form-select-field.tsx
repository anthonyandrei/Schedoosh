import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormSelectFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  formKey: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  options: Array<{
    id?: number;
    label: string;
    value: string;
  }>;
  className?: string;
  disabled?: boolean;
  onChange?: (val: string) => void;
}

export function FormSelectField<T extends FieldValues>({
  form,
  formKey,
  label = "",
  description,
  placeholder,
  options,
  className,
  disabled = false,
  onChange = () => {},
}: FormSelectFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={formKey}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel htmlFor={formKey}>{label}</FormLabel>}
          <Select
            disabled={disabled || form.formState.isSubmitting}
            onValueChange={(val) => {
              field.onChange(val);
              onChange(val);
            }}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option, i) => (
                <SelectItem key={option.id || i} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
