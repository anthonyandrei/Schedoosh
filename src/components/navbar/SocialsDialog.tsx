import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AtSign, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

interface Props {}
export default function SocialsDialog({}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <AtSign className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="inline-flex items-center">
            <AtSign className="mr-2 size-4" /> Socials
          </DialogTitle>
          <DialogDescription>
            Here are my socials in case you want to reach out to me! I am always
            open to feedback and suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center flex-row justify-center">
          <Button asChild variant="ghost">
            <Link
              target="_blank"
              href="https://github.com/CyberEzpertz/Schedaddle/issues"
            >
              GitHub{" "}
              <SquareArrowOutUpRight
                className="size-4 ml-2"
                strokeWidth={2.5}
              />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link
              target="_blank"
              href="https://www.reddit.com/user/Cyberezpertz/"
            >
              Reddit{" "}
              <SquareArrowOutUpRight
                className="size-4 ml-2"
                strokeWidth={2.5}
              />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
