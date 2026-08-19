
# Schedaddle

**Schedaddle** is a powerful schedule-making tool designed to help students build their ideal class schedules with ease and flexibility. Import courses, group them, filter by time and day, and generate all possible combinations that fit your preferences.


## 🔗 Links

- 🔗 [Live Site](https://schedaddle.vercel.app/)


## 🚀 Features

- **📥 Easy Course Import**  
  Add classes directly from **ArchersHub** using your session token (with our 1-click DevTools console snippet), or manually enter your own custom courses.

- **🧩 Course Grouping**  
  Want only 2 GEs but have many options (e.g., GESPORT, GETEAMS, GEETHIC)? Group them and set how many you want to pick!

- **📅 Smart Schedule Generator**  
  Create all possible schedules based on your selected classes.

- **⚙️ Advanced Filters**  
  Fine-tune schedule generation with filters for:
  - Earliest and latest class times
  - Max consecutive classes
  - Max courses per day
  - Unavailable times/days

- **💾 Save & Download**  
  Save your schedule for future use, then download it as an image with support for many device sizes! You can even set your own custom BG image or have it be transparent!  

- **📅 Export to your Calendar**  
  Export your Calendar directly to **Google Calendar** or download it as an .ics file and import it manually!

## 🧠 Technologies Used

- **Next.js** – Framework for building web applications
- **TypeScript** – For static typing
- **Zustand** – Simple, fast state management
- **TanStack Table** – For table rendering
- **Zod** – Schema validation
- **shadcn/ui** – Accessible, reusable UI components

## 🔐 ArchersHub Session & Data Privacy

Your **ArchersHub session token** is stored *strictly* on your device's local storage (IndexedDB) and is used solely to authenticate course searches against ArchersHub. It is never uploaded to external databases or shared with third parties.

## ❗ Bugs & Feedback

Found a bug or have a suggestion? [Open an Issue](https://github.com/CyberEzpertz/Schedaddle/issues) or message me directly.

## 🙏 Acknowledgments

Inspired by [**AralTools**](https://github.com/tudlang/araltools) by u/YivanGamer — huge thanks for the inspiration. Also, special thanks to early testers for their feedback!

## 📄 License

Licensed under the **GNU General Public License (GPL)**.  
See the [LICENSE](LICENSE) file for more info.
