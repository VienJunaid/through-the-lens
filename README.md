# Through the Lens: Field of View demo

A touchscreen exhibit showing how much of your vision a headset's digital image covers, and that a wider view costs weight and sharpness.

Visitors pick a device and drag its window around a room. A digital whale only appears inside the window, so they see it get cut off. "Compare all" shows every device to scale.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```

Then go to <http://localhost:8000>. The app needs no internet connection, install or build step.

Add `#hololens`, `#magicleap`, `#moverio`, `#quest3`, `#human` or `#compare` to the URL to open on a specific view.

## Set up the Raspberry Pi

1. Copy this folder to the Pi.
2. Run `bash kiosk/install-autostart.sh`.
3. In `sudo raspi-config`, turn on desktop auto-login and turn off screen blanking.
4. Reboot.

To test without rebooting, run `bash kiosk/start-kiosk.sh`. The script reopens the browser if it closes, so to exit, switch to a terminal and run `pkill -f start-kiosk; pkill chromium`.

These scripts have not been run on a real Pi yet. Test them, and the frame rate, before exhibit day.

## Kiosk behavior

- After 60 seconds without a touch, the app cycles through the devices and shows "Touch to try it".
- The next touch stops the cycle and hands control to the visitor.
- Change the timing with `IDLE_MS` and `ATTRACT_STEP_MS` at the top of `app.js`.

## Change the data

All device facts live in `devices.js`. Field meanings are listed at the top of that file.

## How the numbers are shown

- **Stage:** field of view is drawn on a flat map where 1° is the same distance everywhere. Real vision is curved, so treat it as a size comparison.
- **View covered:** the device's H × V area divided by human vision's 200° × 135° area.
- **Sharpness meter:** the bar shows the measured value when there is one, and the white tick shows the manufacturer's claim. HoloLens 2 is measured at under 20 PPD, and the bar and close-up use 20 as the upper limit.
- **Weight meter:** the Magic Leap 1 bar shows the listed 316 g, and the tick shows the measured 376 g.
- **Close-up:** a 3° × 1.86° patch of text rendered at the device's PPD, then enlarged so the difference shows on any screen. It is a comparison, not a simulation of the view through the device.

## Data to check

- **Quest 3 horizontal field of view:** the app uses 104° from the team's table. [Meta's comparison page](https://www.meta.com/ca/quest/compare/) lists 110°.
- **Quest 3 weight and PPD:** 515 g and 25 PPD were confirmed against [GSMArena](https://m.gsmarena.com/meta_quest_3_review-amp-60375.php) and [the NCSU library listing](https://www.lib.ncsu.edu/devices/meta-quest-3).
- **Moverio BT-30C TV comparison:** a [retailer listing](https://www.markit.eu/eu/en/v11h962040/v2p27778675) supports the 95 g weight. The 40-inch TV at 8 feet line is calculated from the 23° diagonal rather than quoted from Epson.
- **TV comparisons for Magic Leap 1 and the basketball comparison for HoloLens 2:** these are approximations written for this exhibit.
