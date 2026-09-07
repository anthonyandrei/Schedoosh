import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import {
  createSerialRenderQueue,
  getExportRenderOptions,
  getPreviewRenderOptions,
} from "./imageRender";

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
  const optionsRef = useRef(options);
  const callbacksRef = useRef({ onError, onLoading, onSuccess });
  const renderQueueRef = useRef(createSerialRenderQueue());
  const previewRequestIdRef = useRef(0);

  optionsRef.current = options;
  callbacksRef.current = { onError, onLoading, onSuccess };

  const convertPreview = useCallback(async () => {
    const requestId = ++previewRequestIdRef.current;
    setIsPreviewLoading(true);

    try {
      const dataUrl = await renderQueueRef.current(async () => {
        if (!ref.current) throw new Error("Ref is not set");

        return toPng(
          ref.current,
          getPreviewRenderOptions(optionsRef.current ?? {})
        );
      });

      if (requestId === previewRequestIdRef.current) {
        setPreview(dataUrl);
      }

      return dataUrl;
    } catch (error) {
      callbacksRef.current.onError?.(error as Error);
    } finally {
      if (requestId === previewRequestIdRef.current) {
        setIsPreviewLoading(false);
      }
    }
  }, []);

  const convertToPng = useCallback(async () => {
    try {
      setIsLoading(true);
      callbacksRef.current.onLoading?.(true);

      const dataUrl = await renderQueueRef.current(async () => {
        if (!ref.current) throw new Error("Ref is not set");

        return toPng(
          ref.current,
          getExportRenderOptions(optionsRef.current ?? {})
        );
      });

      callbacksRef.current.onSuccess?.(dataUrl);
      return dataUrl;
    } catch (error) {
      callbacksRef.current.onError?.(error as Error);
    } finally {
      setIsLoading(false);
      callbacksRef.current.onLoading?.(false);
    }
  }, []);

  const download = useCallback(async () => {
    const dataUrl = await convertToPng();

    if (!dataUrl) return false;

    const link = document.createElement("a");

    link.download = "Schedoosh.png";
    link.href = dataUrl;
    link.click();
    link.remove();
    return true;
  }, [convertToPng]);

  const copy = useCallback(async () => {
    const dataUrl = await convertToPng();

    if (!dataUrl) return false;

    const blobData = await fetch(dataUrl).then((res) => res.blob());

    if (!blobData) return false;

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blobData,
      }),
    ]);
    return true;
  }, [convertToPng]);

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
