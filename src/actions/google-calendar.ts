"use server";

import { calendar_v3, google } from "googleapis";
import { GaxiosPromise } from "googleapis/build/src/apis/abusiveexperiencereport";
import { Class } from "@/lib/definitions";
import { convertClassToEvent } from "@/lib/sched-utils";

export async function getCalendars(accessToken: string) {
  const calendarsRaw = await google.calendar("v3").calendarList.list({
    auth: process.env.GOOGLE_API_KEY,
    oauth_token: accessToken,
  });

  const calendars =
    calendarsRaw.data.items
      ?.filter((item) => item.accessRole === "owner" && item.id && item.summary)
      .map((item) => {
        return {
          id: item.id as string,
          summary: item.summary as string,
        };
      }) ?? [];

  return calendars;
}

export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: calendar_v3.Schema$Event
) {
  const calendar = google.calendar({ version: "v3", auth: accessToken });

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}

export async function createBatchEvents(
  accessToken: string,
  calendarId: string,
  classes: Class[]
) {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });

  const promises: GaxiosPromise<calendar_v3.Schema$Event>[] = [];

  try {
    // Process each class and create its events
    for (const classData of classes) {
      const events = convertClassToEvent(classData);

      // Create each event for the class
      for (const event of events) {
        try {
          const res = calendar.events.insert({
            calendarId,
            requestBody: event,
            oauth_token: accessToken,
          });
          promises.push(res);
        } catch (error) {
          console.error("Error creating event:", error);
        }
      }
    }

    await Promise.all(promises);

    return { data: "Success!", error: undefined };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { data: undefined, error: error.message };
    }
    return { data: undefined, error: "An unknown error occurred." };
  }
}
