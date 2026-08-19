import { toPng } from "html-to-image";
import { useRef, useState } from "react";

type ToImageOptions = Parameters<typeof toPng>[1];

export interface UseToImageProps {
  options?: ToImageOptions;
  onSuccess?: (dataUrl: string) => void;
  onError?: (error: Error) => void;
  onLoading?: (isLoading: boolean) => void;
}

export default function useToImage({
  options,
  onLoading,
  onError,
  onSuccess,
}: UseToImageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const convertPreview = async () => {
    try {
      if (!ref.current) throw new Error("Ref is not set");
      setIsPreviewLoading(true);

      const element = ref.current;

      const dataUrl = await toPng(element, {
        cacheBust: true,
        quality: 0.3,
        pixelRatio: 0.5,
        ...(options ?? {}),
      });

      setPreview(dataUrl);

      return dataUrl;
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const convertToPng = async () => {
    try {
      if (!ref.current) throw new Error("Ref is not set");
      setIsLoading(true);
      onLoading?.(true);

      const element = ref.current;

      const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        ...(options ?? {}),
      });

      onSuccess?.(dataUrl);
      return dataUrl;
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const download = async () => {
    const dataUrl = await convertToPng();

    if (!dataUrl) return;

    const link = document.createElement("a");

    link.download = "Schedoosh.png";
    link.href = dataUrl;
    link.click();
    link.remove();
  };

  const copy = async () => {
    const dataUrl = await convertToPng();

    if (!dataUrl) return;

    const blobData = await fetch(dataUrl).then((res) => res.blob());

    if (!blobData) return;

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blobData,
      }),
    ]);
  };

  return {
    ref,
    convertToPng,
    download,
    isLoading,
    copy,
    convertPreview,
    preview,
    isPreviewLoading,
  };
}
