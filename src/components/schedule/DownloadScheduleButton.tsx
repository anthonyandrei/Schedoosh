/* eslint-disable @next/next/no-img-element */
import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import useToImage from "@/hooks/useToImage";
import { Class } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { cn } from "@/lib/utils";
import {
  Copy,
  Download,
  Eye,
  EyeClosed,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SchedaddleLogo from "../SchedaddleLogo";
import Calendar from "./Calendar";
import ScheduleOverview from "./ScheduleOverview";

interface DownloadScheduleButtonProps extends ButtonProps {
  classes: Class[];
  colors: Record<string, ColorsEnum>;
}

/**
 * Component for rendering a button that allows users to download their schedule as a PNG image.
 *
 * @component
 * @param classes - An array of classes to be displayed in the schedule calendar.
 * @param colors - A record mapping classes to their respective colors.
 *
 * @returns The rendered DownloadScheduleButton component.
 *
 * @example
 * <DownloadScheduleButton classes={classes} colors={colors} />
 */
export default function DownloadScheduleButton({
  classes,
  colors,
  ...props
}: DownloadScheduleButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="default"
        className="w-full px-5"
        onClick={() => setOpen(true)}
        {...props}
      >
        <Download className="mr-2 size-4" /> Download
      </Button>
      <DownloadDialog
        open={open}
        setOpen={setOpen}
        classes={classes}
        colors={colors}
      />
    </div>
  );
}

interface DownloadDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  classes: Class[];
  colors: Record<string, ColorsEnum>;
}

function DownloadDialog({
  open,
  setOpen,
  colors,
  classes,
}: DownloadDialogProps) {
  const [aspectRatio, setAspectRatio] = useState<[number, number]>([
    2560, 1440,
  ]);
  const [isTransparent, setIsTransparent] = useState(false);
  const [hasClockOffset, setHasClockOffset] = useState(false);
  const [imgName, setImgName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const isMobile = aspectRatio[0] <= aspectRatio[1];

  const {
    isLoading,
    ref,
    download,
    copy,
    preview,
    convertPreview,
    isPreviewLoading,
  } = useToImage({
    options: { quality: 1, pixelRatio: isMobile ? 2.5 : 2, skipFonts: true },
    onLoading: () => {
      toast.loading("Generating image...");
    },
    onError: (error) => {
      toast.error("Failed to generate image");
      console.error(error);
    },
    onSuccess: async () => {
      toast.dismiss();
    },
  });

  const dropdownItems = {
    landscape: [
      {
        name: "Desktop (16:9)",
        Icon: Monitor,
        value: [2560, 1440],
      },
      {
        name: "Tablet (4:3)",
        Icon: Tablet,
        value: [2048, 1536],
      },
    ],
    portrait: [
      {
        name: "Phone (16:9)",
        Icon: Smartphone,
        value: [1080, 1920],
      },
      {
        name: "Tall Phone (21:9)",
        Icon: Smartphone,
        value: [1080, 2520],
      },
      {
        name: "Tablet (3:4)",
        Icon: Tablet,
        value: [1536, 2048],
      },
    ],
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file); // ← read as Base64 instead of blob URL

      setImgName(file.name);
    } else {
      toast.error("Please select a valid image file.");
    }
  };

  useEffect(() => {
    if (showPreview) {
      convertPreview();
    }
    // Disabled because the function changes everytime it's run
    // useCallback did not work here, so this is the next best thing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPreview, aspectRatio, imageUrl, isTransparent, hasClockOffset]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setImageUrl(null);
      setOpen(false);
      setImgName(null);
      setShowPreview(false);
      setAspectRatio([2560, 1440]);
      setHasClockOffset(false);
    }
  };

  const handleDownload = async () => {
    await download();
    toast.success("Image downloaded successfully!");
  };

  const handleCopy = async () => {
    await copy();
    toast.success("Image copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Schedule</DialogTitle>
          <DialogDescription>
            Choose between mobile or desktop view. You can also upload your own
            image to use as a background.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[fit-content(30%)_auto] items-center gap-x-4 gap-y-2">
          <Label htmlFor="aspectRatio" className="text-nowrap">
            Aspect Ratio
          </Label>
          <Select
            onValueChange={(value) => {
              const selectedItem = [
                ...dropdownItems.landscape,
                ...dropdownItems.portrait,
              ].find((item) => item.name === value);
              if (selectedItem) {
                setAspectRatio([selectedItem.value[0], selectedItem.value[1]]);
              }
            }}
            defaultValue="Desktop (16:9)"
          >
            <SelectTrigger className="w-full" id="aspectRatio">
              <div className="ml-2">
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup>
                <SelectLabel>Landscape</SelectLabel>
                {dropdownItems.landscape.map((item, index) => (
                  <SelectItem key={`landscape-${index}`} value={item.name}>
                    <div className="flex items-center gap-2">
                      {item.Icon && (
                        <item.Icon
                          className="size-4 shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                      {item.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Portrait</SelectLabel>
                {dropdownItems.portrait.map((item, index) => (
                  <SelectItem key={`portrait-${index}`} value={item.name}>
                    <div className="flex items-center gap-2">
                      {item.Icon && (
                        <item.Icon
                          className="size-4 shrink-0"
                          strokeWidth={2.5}
                        />
                      )}
                      {item.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Label htmlFor="fileUpload" className="text-nowrap">
            Custom BG
          </Label>
          <Button
            onClick={() => document.getElementById("fileUpload")?.click()}
            variant="outline"
            className="justify-start w-full min-w-0"
            disabled={isTransparent}
          >
            <Upload className="size-4 mr-2" />
            <span
              className={cn(
                "text-ellipsis w-[35ch] truncate text-left ",
                !imgName && "text-muted-foreground"
              )}
            >
              {imgName ?? "Select file..."}
            </span>
          </Button>
          <input
            id="fileUpload"
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            hidden
          />
          <Label htmlFor="transparent" className="text-nowrap">
            Is transparent?
          </Label>
          <Switch
            id="transparent"
            className="my-1"
            checked={isTransparent}
            onCheckedChange={setIsTransparent}
          />
          {isMobile && (
            <>
              <Label htmlFor="clockOffset" className="text-nowrap">
                Leave space for clock?
              </Label>
              <Switch
                id="clockOffset"
                className="my-1"
                checked={hasClockOffset}
                onCheckedChange={setHasClockOffset}
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-center max-h-[300px]">
          {showPreview && (
            <>
              {isPreviewLoading ? (
                <Loader2 className="size-20 my-20 animate-spin text-muted-foreground" />
              ) : (
                preview && (
                  <img src={preview} alt="Image Preview" className="h-full" />
                )
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex gap-2"
            variant="outline"
            disabled={isLoading}
          >
            {showPreview ? (
              <EyeClosed className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button
            onClick={handleCopy}
            className="inline-flex gap-2"
            variant="outline"
            disabled={isLoading}
          >
            <Copy className="size-4 mr-2" /> Copy
          </Button>
          <Button onClick={handleDownload} disabled={isLoading}>
            <Download className="size-4 mr-2" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
      <div className="relative">
        <Wallpaper
          ref={ref}
          imageUrl={imageUrl}
          classes={classes}
          colors={colors}
          aspectRatio={aspectRatio}
          isTransparent={isTransparent}
          hasClockOffset={hasClockOffset}
        />
      </div>
    </Dialog>
  );
}

interface WallpaperProps {
  imageUrl: string | null;
  classes: Class[];
  colors: Record<string, ColorsEnum>;
  aspectRatio: [width: number, height: number];
  ref: React.RefObject<HTMLDivElement | null>;
  isTransparent: boolean;
  hasClockOffset?: boolean;
}

function Wallpaper({
  imageUrl,
  classes,
  colors,
  aspectRatio,
  ref,
  isTransparent,
  hasClockOffset = false,
}: WallpaperProps) {
  const isMobile = aspectRatio[0] <= aspectRatio[1];
  const [width, height] = aspectRatio;

  // Calculate the cell size based on the aspect ratio
  // So either height / 17.5 (approx. the amount of rows in the calendar) + 6 for mobile since it's longer
  const cellSize = height / (17.5 + (isMobile ? 6 : 0));

  const bgImageUrl =
    imageUrl ??
    (isMobile ? "/SchedaddleBG.Mobile.png" : "/SchedaddleBG.Desktop.png");

  return (
    <div
      className="absolute -left-[9999px] -top-[9999px]"
      style={{ width, height }}
    >
      <div
        className={cn(
          "flex flex-row gap-8 min-h-0 h-full w-full p-8 bg-cover bg-center overflow-hidden items-center justify-center",
          isMobile && "p-20 pt-20",
          isTransparent && "bg-background/0"
        )}
        id="wallpaper"
        ref={ref}
        key={`${cellSize}-${width}-${height}`}
      >
        {!isTransparent && (
          <img
            alt=""
            src={bgImageUrl}
            className="absolute inset-0 w-full h-full object-cover -z-10 pointer-events-none select-none"
            draggable={false}
          />
        )}
        <Calendar
          classes={classes}
          colors={colors}
          cellSizePx={cellSize}
          className={cn(
            "h-max shadow-[0_0_30px_20px_rgba(0,0,0,0.2)] border-none",
            hasClockOffset && isMobile && "self-end"
          )}
          isMobile={isMobile}
          noAnimations
        />
        {!isMobile && (
          <ScheduleOverview
            activeSchedule={classes}
            colors={colors}
            columns={2}
            className="min-w-[700px] shrink-0 bg-background/30 dark:bg-background/40 border-none backdrop-blur-lg shadow-[0_0_20px_10px_rgba(0,0,0,0.2)]"
            noAnimations
          />
        )}
        {!isMobile && (
          <div
            className={cn(
              "p-2 bg-accent rounded-lg flex justify-center pl-3 absolute w-max",
              "right-12 bottom-12"
            )}
          >
            <SchedaddleLogo
              width={32}
              height={32}
              className="text-accent-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );
}
