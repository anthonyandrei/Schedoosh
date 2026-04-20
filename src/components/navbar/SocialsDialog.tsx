import { AtSign, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import ResponsiveButton from "../wrappers/ResponsiveButton";

export default function SocialsDialog() {
  return (
    <DialogWrapper
      trigger={<ResponsiveButton icon={AtSign}>Socials</ResponsiveButton>}
      title="Socials"
      description="Here are my socials in case you want to reach out to me! I am always open to feedback and suggestions."
    >
      <div className="flex flex-row items-center justify-center">
        <Button asChild variant="ghost">
          <Link
            target="_blank"
            href="https://github.com/CyberEzpertz/Schedaddle/issues"
          >
            GitHub{" "}
            <SquareArrowOutUpRight className="ml-2 size-4" strokeWidth={2.5} />
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link
            target="_blank"
            href="https://www.reddit.com/user/Cyberezpertz/"
          >
            Reddit{" "}
            <SquareArrowOutUpRight className="ml-2 size-4" strokeWidth={2.5} />
          </Link>
        </Button>
      </div>
    </DialogWrapper>
  );
}
