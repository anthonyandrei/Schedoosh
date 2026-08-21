"use client";

import {
  CalendarRange,
  Heart,
  LayoutList,
  LucideIcon,
  Menu,
  PencilRuler,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SchedooshLogo from "../SchedooshLogo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import Announcement from "./Announcement";
import ArchersHubAuthDialog from "./ArchersHubAuthDialog";
import HelpDialog from "./HelpDialog";
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

export default function NavigationBar() {
  const pathName = usePathname();

  const normalButton = cn(
    buttonVariants({
      variant: "ghost",
    }),
    "flex items-center gap-2 font-medium"
  );

  const activeButton = cn(
    buttonVariants({
      variant: "default",
    }),
    "flex items-center gap-2 font-medium"
  );

  return (
    <div className="flex w-full items-center justify-between gap-2 border-b bg-background px-8 py-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-16">
      <Link
        href="/"
        className="flex items-center gap-2 font-extrabold text-lg tracking-tight"
      >
        <div className="flex max-w-[40px] justify-center rounded-lg bg-accent p-2 pl-3">
          <SchedooshLogo
            className="text-accent-foreground"
            width={24}
            height={24}
          />
        </div>
        Schedoosh
      </Link>
      <div className="hidden gap-2 lg:flex lg:justify-self-center">
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
      <div className="lg:hidden">
        <NavigationBarMobile>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <Menu className="size-4" />
          </Button>
        </NavigationBarMobile>
      </div>
      <div className="hidden flex-row items-center gap-2 lg:flex lg:justify-self-end">
        <Announcement />
        <SocialsDialog />
        <ArchersHubAuthDialog />
        <ModeToggle />
        <HelpDialog />
      </div>
    </div>
  );
}

interface NavigationBarMobile {
  children: React.ReactNode;
}

function NavigationBarMobile({ children }: NavigationBarMobile) {
  const pathName = usePathname();

  const normalButton = cn(
    buttonVariants({
      variant: "ghost",
    }),
    "flex items-center justify-start gap-2 font-medium"
  );

  const activeButton = cn(
    buttonVariants({
      variant: "default",
    }),
    "flex items-center justify-start gap-2 font-medium"
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex max-h-svh w-[75vw] flex-col" side="left">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-2 font-extrabold text-lg tracking-tight"
            >
              <div className="flex max-w-[40px] justify-center rounded-lg bg-accent p-2 pl-3">
                <SchedooshLogo
                  className="text-accent-foreground"
                  width={24}
                  height={24}
                />
              </div>
              Schedoosh
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2">
          {navigationItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={pathName === item.href ? activeButton : normalButton}
              >
                <item.icon strokeWidth={2} size={20} />
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex flex-col gap-2">
            <Announcement />
            <SocialsDialog />
            <ArchersHubAuthDialog />
            <ModeToggle />
            <HelpDialog />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
