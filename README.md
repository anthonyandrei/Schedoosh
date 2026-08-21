
# Schedoosh

Schedoosh builds DLSU class schedules from your course list, with filters for time constraints and conflicts.

## Links

- [Live site](https://schedoosh.vercel.app/)
- [GitHub repository](https://github.com/anthonyandrei/Schedoosh)

## Features

- **Course import.** Add classes from ArchersHub using your session token (via a 1-click DevTools console snippet), or enter custom courses manually.

- **Course grouping.** Group interchangeable electives (e.g. GESPORT, GETEAMS, GEETHIC) and set how many to pick from the group.

- **Schedule generator.** Generates every valid schedule from your selected classes.

- **Filters.** Narrow schedule generation by:
  - Earliest and latest class times
  - Max consecutive classes
  - Max courses per day
  - Unavailable times/days

- **Save and download.** Save a schedule and download it as an image, with a custom or transparent background, sized for common device screens.

- **Calendar export.** Export to Google Calendar, or download an .ics file to import elsewhere.

## Technologies used

- Next.js
- TypeScript
- Zustand for state management
- TanStack Table
- Zod for schema validation
- shadcn/ui

## ArchersHub session and data privacy

Your ArchersHub session token is stored only in your device's local storage (IndexedDB) and used to authenticate course searches against ArchersHub. It is never uploaded to external databases or shared with third parties.

## Bugs and feedback

Found a bug or have a suggestion? [Open an issue](https://github.com/anthonyandrei/Schedoosh/issues).

## Acknowledgments

- Forked from [Schedaddle](https://github.com/CyberEzpertz/Schedaddle) by [CyberEzpertz](https://github.com/CyberEzpertz).
- Originally inspired by [AralTools](https://github.com/tudlang/araltools) by u/YivanGamer.
- Thanks to early testers and contributors for their feedback.

## License

GNU General Public License v3.0 (GPLv3). See [LICENSE](LICENSE) for details.
