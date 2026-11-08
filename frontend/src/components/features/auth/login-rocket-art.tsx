export function LoginRocketArt({
  className = "",
  preserveAspectRatio = "none",
}: {
  className?: string;
  preserveAspectRatio?: string;
}) {
  return (
    <svg
      viewBox="0 0 1000 600"
      preserveAspectRatio={preserveAspectRatio}
      className={`w-full h-full select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Cosmic Space Gradient in TakarLaba Signature Midnight Navy */}
        <linearGradient id="cosmicSpaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06141B" />
          <stop offset="42%" stopColor="#11212D" />
          <stop offset="100%" stopColor="#193248" />
        </linearGradient>

        {/* Glowing Planetary Nebulae */}
        <radialGradient id="planetGrad1" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2D4860" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#152737" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06141B" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="planetGrad2" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3A5974" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#1A3144" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#06141B" stopOpacity="0" />
        </radialGradient>

        {/* Cloud Shadow Underlayer Gradient */}
        <linearGradient id="smokeShadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3547" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#0E1E2C" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* COSMIC SPACE BACKGROUND */}
      <rect width="1000" height="600" fill="url(#cosmicSpaceGrad)" />

      {/* GLOWING CELESTIAL ORBS (Planets) */}
      {/* Bottom-left glowing planet */}
      <circle cx="115" cy="410" r="52" fill="url(#planetGrad1)" />
      {/* Top-left subtle glowing nebula */}
      <circle cx="95" cy="95" r="60" fill="url(#planetGrad2)" />

      {/* TWINKLING STARS & 4-POINT SPARKLES */}
      <path
        d="M 205 70 Q 205 78 213 78 Q 205 78 205 86 Q 205 78 197 78 Q 205 78 205 70 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path
        d="M 410 60 Q 410 67 417 67 Q 410 67 410 74 Q 410 67 403 67 Q 410 67 410 60 Z"
        fill="#93C5FD"
        opacity="0.85"
      />
      <path
        d="M 70 340 Q 70 346 76 346 Q 70 346 70 352 Q 70 346 64 346 Q 70 346 70 340 Z"
        fill="#FFFFFF"
        opacity="0.8"
      />
      <path
        d="M 505 80 Q 505 84 509 84 Q 505 84 505 88 Q 505 84 501 84 Q 505 84 505 80 Z"
        fill="#FFFFFF"
        opacity="0.75"
      />
      <path
        d="M 425 210 Q 425 214 429 214 Q 425 214 425 218 Q 425 214 421 214 Q 425 214 425 210 Z"
        fill="#E2E8F0"
        opacity="0.75"
      />

      {/* Star Dots */}
      <circle cx="190" cy="80" r="1.8" fill="#FFFFFF" opacity="0.9" />
      <circle cx="310" cy="65" r="1.5" fill="#BFDBFE" opacity="0.8" />
      <circle cx="490" cy="50" r="1.8" fill="#FFFFFF" opacity="0.85" />
      <circle cx="150" cy="200" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="80" cy="470" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="145" cy="520" r="1.5" fill="#93C5FD" opacity="0.8" />
      <circle cx="240" cy="540" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="285" cy="480" r="1.5" fill="#E2E8F0" opacity="0.6" />
      <circle cx="440" cy="150" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="525" cy="180" r="1.5" fill="#FFFFFF" opacity="0.7" />

      {/* DETACHED FLOATING SMOKE PUFFS / BUBBLES */}
      <circle cx="270" cy="460" r="22" fill="#FFFFFF" opacity="0.22" />
      <circle cx="475" cy="230" r="16" fill="#FFFFFF" opacity="0.28" />
      <circle cx="510" cy="320" r="20" fill="#FFFFFF" opacity="0.24" />
      <circle cx="460" cy="420" r="24" fill="#FFFFFF" opacity="0.26" />
      <circle cx="350" cy="520" r="18" fill="#FFFFFF" opacity="0.25" />

      {/* LAYER 1: DARK UNDERLAYER CLOUD SHADOW */}
      <path
        d="M 1000 0 L 560 0
           C 530 15, 520 45, 535 75
           C 510 90, 500 135, 530 165
           C 490 185, 485 240, 520 270
           C 440 280, 360 295, 240 280
           C 270 330, 280 390, 320 440
           C 310 490, 325 550, 335 600
           L 1000 600 Z"
        fill="url(#smokeShadowGrad)"
      />

      {/* LAYER 2: TRANSLUCENT MID-LAYER CLOUDS (PASTEL SLATE) */}
      <path
        d="M 1000 0 L 575 0
           C 550 20, 540 50, 555 80
           C 530 100, 520 145, 550 175
           C 515 200, 510 250, 545 285
           C 465 295, 385 305, 255 290
           C 285 340, 305 400, 340 450
           C 335 500, 345 560, 350 600
           L 1000 600 Z"
        fill="#CBDDEB"
        opacity="0.6"
      />

      {/* LAYER 3: MAIN WHITE BILLOWING CLOUD CANVAS & JET PLUME */}
      <path
        d="M 1000 0 L 595 0
           C 570 15, 560 40, 570 65
           C 575 75, 585 85, 595 90
           C 570 100, 555 125, 560 150
           C 565 170, 580 185, 600 190
           C 575 205, 565 235, 575 265
           C 580 278, 590 288, 605 295
           C 510 305, 420 310, 265 298
           C 295 320, 325 350, 345 385
           C 325 405, 325 435, 355 460
           C 335 485, 340 525, 365 550
           C 355 570, 360 590, 368 600
           L 1000 600 Z"
        fill="#FFFFFF"
      />

      {/* ROCKET SPEED HALO / MOTION AURA */}
      <g transform="translate(220, 265) rotate(-38)">
        <ellipse cx="0" cy="55" rx="40" ry="115" fill="#FFFFFF" opacity="0.08" />
        <ellipse cx="0" cy="42" rx="28" ry="85" fill="#FFFFFF" opacity="0.12" />
      </g>

      {/* ROCKET SHIP (Blasting off diagonally towards Top-Left) */}
      <g id="rocket-ship" transform="translate(220, 265) rotate(-38)">
        {/* Left Fin */}
        <path d="M -17 15 C -34 22, -40 42, -36 50 C -26 48, -19 42, -15 36 Z" fill="#F43F5E" />
        {/* Right Fin */}
        <path d="M 17 15 C 34 22, 40 42, 36 50 C 26 48, 19 42, 15 36 Z" fill="#F43F5E" />
        {/* Thruster Base Ring */}
        <rect x="-11" y="36" width="22" height="6" rx="2" fill="#06141B" />

        {/* Fuselage Body (Capsule) */}
        <path
          d="M 0 -52 C 24 -24, 25 15, 17 38 L -17 38 C -25 15, -24 -24, 0 -52 Z"
          fill="#FFFFFF"
        />

        {/* Nose Cone Accent */}
        <path
          d="M 0 -52 C 11 -38, 14 -24, 14 -16 L -14 -16 C -14 -24, -11 -38, 0 -52 Z"
          fill="#F43F5E"
        />

        {/* Center Dorsal Fin */}
        <path d="M -3 15 L 3 15 L 3 39 L -3 39 Z" fill="#E11D48" />

        {/* Porthole Window */}
        <circle cx="0" cy="6" r="11" fill="#11212D" />
        <circle cx="0" cy="6" r="8.5" fill="#F43F5E" />
        <circle cx="0" cy="6" r="6" fill="#FFFFFF" />
        <circle cx="1.5" cy="4.5" r="2.5" fill="#38BDF8" />

        {/* Shading Stripe */}
        <path
          d="M -15 0 C -15 -18, -9 -32, -4 -42 C -9 -32, -13 -14, -12 24 L -16 34 Z"
          fill="#E2E8F0"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
