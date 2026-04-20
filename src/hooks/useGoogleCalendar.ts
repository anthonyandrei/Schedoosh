import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { toast } from "sonner";
import { createBatchEvents, getCalendars } from "@/actions/google-calendar";
import { Class } from "@/lib/definitions";

export default function useGoogleCalendar(scheduleClasses: Class[]) {
  const [calendars, setCalendars] = useState<
    Awaited<ReturnType<typeof getCalendars>>
  >([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchNewCalendars = async (token: string) => {
    const toastId = toast.loading("Fetching calendars...");
    const newCalendars = await getCalendars(token);
    toast.dismiss(toastId);
    setCalendars(newCalendars);
  };

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await fetchNewCalendars(tokenResponse.access_token);
      setToken(tokenResponse.access_token);
      setOpen(true);
    },
    onError: (error) => {
      toast.error("Login failed. Please try again.", {
        description: error.error_description,
      });
    },
    scope: "https://www.googleapis.com/auth/calendar",
  });

  const handleClick = async () => {
    if (!token) {
      handleLogin();
    } else {
      await fetchNewCalendars(token);
      setOpen(true);
    }
  };

  const handleExport = async () => {
    if (!token) {
      toast.error("An error occured while exporting...", {
        description: "Try refreshing the page.",
      });
      return;
    }

    setImporting(true);

    const { data, error } = await createBatchEvents(
      token,
      selectedCalendar,
      scheduleClasses
    );

    if (error) {
      toast.error("An error occured while exporting...", {
        description: error,
      });
    }

    const calendar = calendars.find(
      (calendar) => calendar.id === selectedCalendar
    );

    if (data && calendar) {
      toast.success("Events created successfully!", {
        description: `You can now see your schedule in your ${calendar?.summary} calendar!`,
      });
    }

    setImporting(false);
    setOpen(false);
  };

  return {
    calendars,
    selectedCalendar,
    setSelectedCalendar,
    token,
    open,
    setOpen,
    importing,
    handleExport,
    handleClick,
  };
}
