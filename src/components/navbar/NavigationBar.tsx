"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarRange,
  Heart,
  LayoutList,
  LucideIcon,
  PencilRuler,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SchedaddleLogo from "../SchedaddleLogo";
import Announcement from "./Announcement";
import HelpDialog from "./HelpDialog";
import IDInput from "./IDInput";
import { ModeToggle } from "./ModeToggle";
import SocialsDialog from "./SocialsDialog";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    icon: LayoutList,
    label: "Courses",
  },
  {
    href: "/schedules",
    icon: CalendarRange,
    label: "Schedules",
  },
  {
    href: "/saved",
    icon: Heart,
    label: "Saved",
  },
  {
    href: "/manual",
    icon: PencilRuler,
    label: "Smart Manual",
  },
];

const NavigationBar = () => {
  const pathName = usePathname();

  const normalButton = cn(
    buttonVariants({
      variant: "ghost",
    }),
    "flex gap-2 items-center font-medium"
  );

  const activeButton = cn(
    buttonVariants({
      variant: "default",
    }),
    "flex gap-2 items-center font-medium"
  );

  return (
    <div className="p-4 flex items-center justify-between gap-2 w-full border-b px-16 bg-background">
      <Link
        href="/"
        className="flex gap-2 font-extrabold text-lg items-center tracking-tight"
      >
        <div className="p-2 bg-accent rounded-lg flex justify-center pl-3 max-w-[40px] ">
          <SchedaddleLogo
            className="text-accent-foreground"
            width={24}
            height={24}
          />
        </div>
        Schedaddle
      </Link>
      <div className="flex gap-2 absolute left-1/2 -translate-x-1/2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathName === item.href ? activeButton : normalButton}
          >
            <item.icon
              strokeWidth={pathName === item.href ? 2 : 1.75}
              size={22}
            />
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-row gap-2">
        <Announcement />
        <SocialsDialog />
        <IDInput />
        <ModeToggle />
        <HelpDialog />
      </div>
    </div>
  );
};

export default NavigationBar;
