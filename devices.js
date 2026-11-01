// Device data only. Edit values here; app.js reads everything from this list.
//
// fovH / fovV     field of view in degrees
// weightG         main weight used for the meter (null = not applicable)
// weightAltG      second weight, shown as a tick on the meter
// ppd             sharpness used for the meter and close-up (measured when available)
// ppdAlt          second sharpness (the manufacturer's claim), shown as a tick
// seeThrough      false = the headset blocks the room
// isReference     true = human vision, no digital image

window.FOV_DEVICES = [
  {
    id: "moverio",
    name: "Epson Moverio BT-30C",
    shortName: "Epson Moverio",
    type: "AR glasses",
    fovDiagonal: 23,
    fovH: 20,
    fovV: 11,
    weightG: 95,
    weightAltG: null,
    weightLabel: "~95 g",
    ppd: 64,
    ppdAlt: null,
    ppdLabel: "≈64 (calculated)",
    ppdShort: "≈64",
    optics: "SI-OLED + light guide",
    seeThrough: true,
    fact: "Like a 40-inch TV seen from about 8 feet away."
  },
  {
    id: "magicleap",
    name: "Magic Leap 1",
    shortName: "Magic Leap 1",
    type: "AR headset",
    fovDiagonal: 50,
    fovH: 40,
    fovV: 30,
    weightG: 316,
    weightAltG: 376,
    weightLabel: "316 g listed (376 g measured)",
    ppd: 16,
    ppdAlt: 32,
    ppdLabel: "32 claimed, ≈16 measured",
    ppdShort: "≈16",
    optics: "Diffractive waveguide",
    seeThrough: true,
    fact: "Like a 65-inch TV seen from just under 6 feet away."
  },
  {
    id: "hololens",
    name: "Microsoft HoloLens 2",
    shortName: "HoloLens 2",
    type: "AR headset",
    fovDiagonal: 52,
    fovH: 43,
    fovV: 29,
    weightG: 566,
    weightAltG: null,
    weightLabel: "566 g",
    ppd: 20,
    ppdAlt: 47,
    ppdLabel: "47 claimed, <20 measured",
    ppdShort: "<20",
    optics: "Laser scanning + waveguide",
    seeThrough: true,
    fact: "Barely wider than Magic Leap 1, yet about as heavy as a basketball."
  },
  {
    id: "quest3",
    name: "Meta Quest 3",
    shortName: "Quest 3",
    type: "VR headset (not see-through, shown for contrast)",
    fovDiagonal: null,
    fovH: 104,
    fovV: 96,
    weightG: 515,
    weightAltG: null,
    weightLabel: "515 g",
    ppd: 25,
    ppdAlt: null,
    ppdLabel: "~25",
    ppdShort: "~25",
    optics: "Pancake lenses",
    seeThrough: false,
    fact: "Its wide view is possible partly because it doesn't have to let you see through it."
  },
  {
    id: "human",
    name: "Human vision",
    shortName: "Your eyes",
    type: "Reference",
    fovDiagonal: null,
    fovH: 200,
    fovV: 135,
    weightG: null,
    weightAltG: null,
    weightLabel: "—",
    ppd: null,
    ppdAlt: null,
    ppdLabel: "—",
    optics: "—",
    seeThrough: true,
    isReference: true,
    fact: "This is the whole view that every headset is trying to cover."
  }
];
