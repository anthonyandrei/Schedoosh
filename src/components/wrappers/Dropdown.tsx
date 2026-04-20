import { DropdownMenuContentProps } from "@radix-ui/react-dropdown-menu";
import { Ellipsis, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DropdownItem {
  Icon?: LucideIcon;
  name: string;
  onClick?: () => void;
}

interface DropdownProps extends DropdownMenuContentProps {
  title?: string;
  children?: ReactNode;
  items: DropdownItem[];
}

export default function Dropdown({
  title,
  children,
  items,
  ...props
}: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <Button size="icon" variant="ghost" className="size-8">
            <Ellipsis className="size-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent {...props}>
        {title && (
          <>
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item?.onClick}
            className="inline-flex h-8 w-full items-center"
          >
            {item.Icon && <item.Icon className="mr-2 ml-1 size-4" />}
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
