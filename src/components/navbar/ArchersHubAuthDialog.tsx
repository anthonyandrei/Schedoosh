"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import {
  clearCourseCacheAction,
  validateArchersHubSession,
} from "@/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { analyzeSessionCookie } from "@/lib/archershub/validation";
import { useGlobalStore } from "@/stores/useGlobalStore";
import ResponsiveButton from "../wrappers/ResponsiveButton";

interface ArchersHubAuthDialogProps {
  children?: ReactNode;
}

export default function ArchersHubAuthDialog({
  children,
}: ArchersHubAuthDialogProps) {
  const {
    sessionCookie,
    isAuthenticated,
    lastAuthenticated,
    isSessionModalOpen,
    setSessionCookie,
    clearSession,
    setSessionModalOpen,
  } = useGlobalStore(
    useShallow((state) => ({
      sessionCookie: state.sessionCookie,
      isAuthenticated: state.isAuthenticated,
      lastAuthenticated: state.lastAuthenticated,
      isSessionModalOpen: state.isSessionModalOpen,
      setSessionCookie: state.setSessionCookie,
      clearSession: state.clearSession,
      setSessionModalOpen: state.setSessionModalOpen,
    }))
  );

  const isDemoMode =
    isAuthenticated &&
    (sessionCookie === "MOCK_SESSION" || sessionCookie === "DEMO");

  const [inputVal, setInputVal] = useState(sessionCookie || "");
  const [isValidating, setIsValidating] = useState(false);

  const cookieAnalysis = useMemo(() => {
    return analyzeSessionCookie(inputVal);
  }, [inputVal]);

  useEffect(() => {
    if (isSessionModalOpen) {
      setInputVal(sessionCookie || "");
    }
  }, [isSessionModalOpen, sessionCookie]);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      toast.error("Please enter a session cookie or token.");
      return;
    }

    setIsValidating(true);
    try {
      const validation = await validateArchersHubSession(trimmed);

      if (!validation.success) {
        if (validation.cloudflareBlocked) {
          toast.error("Blocked by Cloudflare", {
            description:
              validation.error ||
              "ArchersHub's bot protection blocked this check. Please try Demo Mode or add your courses manually.",
            duration: 7000,
          });
        } else if (validation.isAffinityOnly) {
          toast.error("Incomplete Session Cookie", {
            description:
              validation.error ||
              "Only Azure Gateway cookies were detected. Please copy your full Cookie header from the DevTools Network Tab as instructed below.",
            duration: 6000,
          });
        } else {
          toast.error("Couldn't Verify Your Session", {
            description:
              validation.error ||
              "Please check your session cookie and try again.",
            duration: 6000,
          });
        }
        return;
      }

      await clearCourseCacheAction();
      setSessionCookie(trimmed, true);
      setSessionModalOpen(false);
      toast.success("Connected to ArchersHub!", {
        description: "You can now search and import your courses seamlessly.",
      });
    } catch (_err) {
      toast.error("Validation Failed", {
        description: "An unexpected error occurred during validation.",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDemo = async () => {
    await clearCourseCacheAction();
    setInputVal("MOCK_SESSION");
    setSessionCookie("MOCK_SESSION", true);
    setSessionModalOpen(false);
    toast.success("Demo Mode Activated!", {
      description:
        "You can now test course importing with realistic mock DLSU courses.",
    });
  };

  const handleExitDemo = async () => {
    await clearCourseCacheAction();
    clearSession();
    setInputVal("");
    toast.info("Exited Demo Mode.", {
      description:
        "Enter a valid ArchersHub session cookie to scrape live courses.",
    });
  };

  const handleDisconnect = async () => {
    await clearCourseCacheAction();
    clearSession();
    setInputVal("");
    toast.info("Disconnected from ArchersHub session.");
  };

  const formattedDate = lastAuthenticated
    ? new Date(lastAuthenticated).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <DialogWrapper
      open={isSessionModalOpen}
      setOpen={setSessionModalOpen}
      className="max-w-[560px]"
      trigger={
        children ?? (
          <ResponsiveButton
            aria-label={isDemoMode ? "Demo Mode" : "ArchersHub"}
            icon={isDemoMode ? Sparkles : KeyRound}
            className={
              isDemoMode
                ? "border-warning bg-warning/10 text-warning"
                : !isAuthenticated
                  ? "animate-pulse border-warning text-warning"
                  : "border-success text-success"
            }
          >
            <div className="flex items-center gap-1.5">
              <span>{isDemoMode ? "Demo Mode" : "ArchersHub"}</span>
              <span
                className={`size-2 rounded-full ${
                  isDemoMode
                    ? "bg-warning"
                    : isAuthenticated
                      ? "bg-success"
                      : "bg-warning"
                }`}
              />
            </div>
          </ResponsiveButton>
        )
      }
      title={
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-bold text-xl">
            <ShieldCheck className="size-5 text-primary" />
            ArchersHub Session
          </span>
          {isDemoMode ? (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 border-warning/30 bg-warning/15 text-warning"
            >
              <Sparkles className="size-3 text-warning" />
              Demo Mode Active
            </Badge>
          ) : (
            <Badge
              variant={isAuthenticated ? "default" : "secondary"}
              className={
                isAuthenticated
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "border-warning/30 bg-warning/15 text-warning"
              }
            >
              {isAuthenticated ? "Connected" : "Session Required"}
            </Badge>
          )}
        </span>
      }
      description="Connect your ArchersHub account to automatically import course offerings and section schedules."
      footer={
        <div className="flex w-full flex-col-reverse items-center gap-2 border-t pt-2 sm:flex-row sm:justify-between">
          {isDemoMode ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExitDemo}
              className="h-9 w-full gap-1.5 border-warning/30 text-warning text-xs hover:bg-warning/10 sm:w-auto"
            >
              <LogOut className="size-3.5" />
              Exit Demo Mode
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseDemo}
              className="h-9 w-full gap-1.5 text-xs sm:w-auto"
            >
              <Sparkles className="size-3.5 text-warning" />
              Try Demo Mode
            </Button>
          )}

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSessionModalOpen(false)}
              className="h-9 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleConnect()}
              disabled={!inputVal.trim() || isValidating}
              className="h-9 w-full font-medium sm:w-auto"
            >
              {isValidating ? "Validating..." : "Connect Session"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Demo Mode Active Banner */}
        {isDemoMode && (
          <div className="flex flex-col gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-warning text-xs">
                <Sparkles className="size-4 text-warning" />
                <span>Demo Mode is Currently Active</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExitDemo}
                className="h-9 border-warning/40 bg-background text-warning text-xs hover:bg-warning/10"
              >
                <LogOut className="mr-1 size-3.5" /> Exit Demo Mode
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Schedoosh is generating simulated course schedules. Paste your
              real ArchersHub session cookie below to fetch live data, or click{" "}
              <strong>Exit Demo Mode</strong> to disconnect.
            </p>
          </div>
        )}

        {/* Step-by-step instructions */}
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 font-semibold text-sm">
              <Network className="size-4 text-primary" />
              <span>How to copy your session cookie</span>
            </h4>
            <a
              href="https://archershub.dlsu.edu.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-normal text-primary text-xs hover:underline"
            >
              Open ArchersHub <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
            <p className="font-semibold text-foreground">
              Copy via DevTools Network Tab
            </p>
            <ol className="mt-1.5 list-inside list-decimal space-y-1 text-muted-foreground">
              <li>
                Log in to{" "}
                <a
                  href="https://archershub.dlsu.edu.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline"
                >
                  archershub.dlsu.edu.ph
                </a>{" "}
                and stay signed in — don&apos;t copy from the login page.
              </li>
              <li>
                Navigate inside the portal (e.g. <strong>Enlistment</strong> or{" "}
                <strong>Course Finder</strong>).
              </li>
              <li>
                Press{" "}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                  F12
                </kbd>{" "}
                (or Right-Click &rarr; Inspect) and switch to the{" "}
                <strong>Network</strong> tab.
              </li>
              <li>Refresh the ArchersHub page or click any course link.</li>
              <li>
                Click any request to <code>archershub.dlsu.edu.ph</code> in the
                list.
              </li>
              <li>
                In <strong>Headers</strong> &rarr;{" "}
                <strong>Request Headers</strong>, right-click the{" "}
                <code>Cookie:</code> line and click <strong>Copy value</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConnect} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sessionInput" className="font-medium text-sm">
              Session Cookie / Header
            </Label>
            <Textarea
              id="sessionInput"
              placeholder="Paste your ArchersHub cookie header here (e.g. .AspNetCore.Cookies=... or full Request Cookie header)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="min-h-[80px] resize-y font-mono text-xs"
            />
          </div>

          {/* Incomplete Cookie Warning Alert */}
          {cookieAnalysis.isAffinityOnly && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive dark:bg-destructive/20">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Incomplete Cookie (Azure Gateway Only)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                You pasted Azure Gateway routing cookies (
                <code>ApplicationGatewayAffinity</code>). The actual student
                authentication cookie is marked <strong>HttpOnly</strong> by
                DLSU and cannot be copied via the Console snippet.
              </p>
              <p className="font-medium text-[11px]">
                👉 Please copy the full <code>Cookie:</code> line from the{" "}
                <strong>DevTools Network Tab</strong> (instructions above), or
                activate <strong>Demo Mode</strong> below.
              </p>
            </div>
          )}

          {/* Live validation in progress */}
          {isValidating && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2.5 text-muted-foreground text-xs">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span>Checking your session with ArchersHub&hellip;</span>
            </div>
          )}

          {/* Privacy and Local Storage Notice */}
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-2.5 text-muted-foreground text-xs">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              <strong>Privacy Guaranteed:</strong> Your session token is stored{" "}
              <em>only</em> in your browser&apos;s local IndexedDB storage and
              is never saved to external databases.
            </span>
          </div>

          {/* Connected details */}
          {isAuthenticated && !isDemoMode && formattedDate && (
            <div className="flex items-center justify-between rounded-md border border-success/20 bg-success/10 p-2 text-muted-foreground text-xs">
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="size-4" />
                <span>Last connected: {formattedDate}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="h-9 text-destructive text-xs hover:bg-destructive/10"
              >
                <LogOut className="mr-1 size-3.5" /> Disconnect
              </Button>
            </div>
          )}
        </form>
      </div>
    </DialogWrapper>
  );
}
