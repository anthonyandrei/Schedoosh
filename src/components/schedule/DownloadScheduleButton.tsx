/* eslint-disable @next/next/no-img-element */

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
import TooltipWrapper from "@/components/wrappers/TooltipWrapper";
import useToImage from "@/hooks/useToImage";
import { Class } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { cn } from "@/lib/utils";
import SchedooshLogo from "../SchedooshLogo";
import Calendar from "./Calendar";
import {
  getWallpaperComposition,
  getWallpaperPreset,
  WALLPAPER_PRESETS,
  WallpaperPreset,
  WallpaperPresetId,
} from "./downloadSchedule";
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
  const [presetId, setPresetId] = useState<WallpaperPresetId>("desktop");
  const [isTransparent, setIsTransparent] = useState(false);
  const [hasClockOffset, setHasClockOffset] = useState(false);
  const [imgName, setImgName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const preset = getWallpaperPreset(presetId);
  const { isMobile } = getWallpaperComposition(presetId);

  const {
    isLoading,
    ref,
    download,
    copy,
    preview,
    convertPreview,
    isPreviewLoading,
  } = useToImage({
    options: { quality: 1, skipFonts: true },
    onLoading: (loading) => {
      if (loading) {
        toast.loading("Generating image...", { id: "schedule-image" });
      } else {
        toast.dismiss("schedule-image");
      }
    },
    onError: (error) => {
      toast.error("Failed to generate image");
      console.error(error);
    },
  });

  const dropdownItems = WALLPAPER_PRESETS.map((item) => ({
    ...item,
    Icon:
      item.id === "desktop"
        ? Monitor
        : item.id.includes("tablet")
          ? Tablet
          : Smartphone,
  }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
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
    if (!showPreview) return;

    const timeoutId = window.setTimeout(() => {
      void convertPreview();
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [
    showPreview,
    presetId,
    imageUrl,
    isTransparent,
    hasClockOffset,
    convertPreview,
  ]);

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
      setPresetId("desktop");
      setHasClockOffset(false);
    }
  };

  const handleDownload = async () => {
    if (await download()) {
      toast.success("Image downloaded successfully!");
    }
  };

  const handleCopy = async () => {
    if (await copy()) {
      toast.success("Image copied to clipboard!");
    }
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
              const selectedItem = WALLPAPER_PRESETS.find(
                (item) => item.id === value
              );
              if (selectedItem) {
                setPresetId(selectedItem.id);
              }
            }}
            value={presetId}
          >
            <SelectTrigger className="w-full" id="aspectRatio">
              <div className="ml-2">
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectGroup>
                <SelectLabel>Landscape</SelectLabel>
                {dropdownItems
                  .filter((item) => item.orientation === "landscape")
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <item.Icon
                          className="size-4 shrink-0"
                          strokeWidth={2.5}
                        />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Portrait</SelectLabel>
                {dropdownItems
                  .filter((item) => item.orientation === "portrait")
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <item.Icon
                          className="size-4 shrink-0"
                          strokeWidth={2.5}
                        />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Label htmlFor="fileUpload" className="text-nowrap">
            Custom BG
          </Label>
          <TooltipWrapper
            content={imgName ?? "Select a background image"}
            side="top"
          >
            <Button
              onClick={() => document.getElementById("fileUpload")?.click()}
              variant="outline"
              className="w-full min-w-0 justify-start overflow-hidden"
              disabled={isTransparent}
            >
              <Upload className="mr-2 size-4 shrink-0" />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-left",
                  !imgName && "text-muted-foreground"
                )}
              >
                {imgName ?? "Select file..."}
              </span>
            </Button>
          </TooltipWrapper>
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
        {showPreview && (
          <div className="relative flex max-h-[300px] min-h-40 items-center justify-center overflow-hidden rounded-md border bg-muted/20">
            {preview ? (
              // biome-ignore lint/performance/noImgElement: The preview is a generated data URL.
              <img
                src={preview}
                alt="Schedule preview"
                className="max-h-[300px] max-w-full object-contain"
              />
            ) : (
              <Loader2 className="size-12 animate-spin text-muted-foreground" />
            )}
            {preview && isPreviewLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/60"
                aria-label="Updating schedule preview"
              >
                <Loader2 className="size-10 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
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
            disabled={isLoading || isPreviewLoading}
          >
            <Copy className="mr-2 size-4" /> Copy
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading || isPreviewLoading}
          >
            <Download className="mr-2 size-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
      <div className="relative">
        <Wallpaper
          ref={ref}
          imageUrl={imageUrl}
          classes={classes}
          colors={colors}
          preset={preset}
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
  preset: WallpaperPreset;
  ref: React.RefObject<HTMLDivElement | null>;
  isTransparent: boolean;
  hasClockOffset?: boolean;
}

function Wallpaper({
  imageUrl,
  classes,
  colors,
  preset,
  ref,
  isTransparent,
  hasClockOffset = false,
}: WallpaperProps) {
  const { isMobile, showOverview } = getWallpaperComposition(preset.id);
  const { width, height } = preset;

  // Calculate the cell size based on the aspect ratio
  // So either height / 17.5 (approx. the amount of rows in the calendar) + 6 for mobile since it's longer
  const cellSize = height / (17.5 + (isMobile ? 6 : 0));

  const bgImageUrl =
    imageUrl ??
    (isMobile ? "/SchedooshBG.Mobile.png" : "/SchedooshBG.Desktop.png");

  return (
    <div
      className="absolute -top-[9999px] -left-[9999px]"
      style={{ width, height }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-row items-center justify-center gap-8 overflow-hidden bg-center bg-cover p-8",
          isMobile && "p-20 pt-20",
          isTransparent && "bg-background/0"
        )}
        id="wallpaper"
        ref={ref}
        key={`${cellSize}-${width}-${height}`}
      >
        {!isTransparent && (
          // biome-ignore lint/performance/noImgElement: The export renderer needs the original local file or blob URL.
          <img
            alt=""
            src={bgImageUrl}
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover"
            draggable={false}
          />
        )}
        <Calendar
          classes={classes}
          colors={colors}
          cellSizePx={cellSize}
          className={cn(
            "h-max border-none shadow-[0_0_30px_20px_rgba(0,0,0,0.2)]",
            hasClockOffset && isMobile && "self-end"
          )}
          isMobile={isMobile}
          noAnimations
        />
        {showOverview && (
          <ScheduleOverview
            activeSchedule={classes}
            colors={colors}
            columns={2}
            className="min-w-[700px] shrink-0 border-none bg-background/30 shadow-[0_0_20px_10px_rgba(0,0,0,0.2)] backdrop-blur-lg dark:bg-background/40"
            noAnimations
          />
        )}
        <div
          className={cn(
            "absolute flex w-max justify-center rounded-lg bg-accent p-2",
            isMobile ? "right-20 bottom-20" : "right-12 bottom-12"
          )}
        >
          <SchedooshLogo width={32} height={32} />
        </div>
      </div>
    </div>
  );
}
