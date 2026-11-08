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
        {/* Deep Cosmic Space Gradient in TakarLaba Signature Navy */}
        <linearGradient id="cosmicSpaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06141B" />
          <stop offset="45%" stopColor="#11212D" />
          <stop offset="100%" stopColor="#1E374D" />
        </linearGradient>

        {/* Glowing Planetary Nebulae */}
        <radialGradient id="planetGrad1" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3A5974" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#1A3144" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06141B" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="planetGrad2" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2D4860" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#152737" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06141B" stopOpacity="0" />
        </radialGradient>

        {/* Cloud Shadow Underlayers */}
        <linearGradient id="smokeShadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B445B" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#122332" stopOpacity="0.3" />
        </linearGradient>

        {/* Rocket Thruster Flame Gradient */}
        <linearGradient id="flameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#FDE047" />
          <stop offset="65%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#F43F5E" />
        </linearGradient>

        <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* COSMIC SPACE BACKGROUND */}
      <rect width="1000" height="600" fill="url(#cosmicSpaceGrad)" />

      {/* GLOWING ORBS / PLANETS */}
      <circle cx="100" cy="110" r="75" fill="url(#planetGrad1)" />
      <circle cx="210" cy="460" r="55" fill="url(#planetGrad2)" />

      {/* TWINKLING STARS & 4-POINT SPARKLES */}
      <path
        d="M 240 65 Q 240 75 250 75 Q 240 75 240 85 Q 240 75 230 75 Q 240 75 240 65 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path
        d="M 410 50 Q 410 58 418 58 Q 410 58 410 66 Q 410 58 402 58 Q 410 58 410 50 Z"
        fill="#93C5FD"
        opacity="0.9"
      />
      <path
        d="M 75 350 Q 75 357 82 357 Q 75 357 75 364 Q 75 357 68 357 Q 75 357 75 350 Z"
        fill="#FFFFFF"
        opacity="0.75"
      />
      <path
        d="M 480 75 Q 480 80 485 80 Q 480 80 480 85 Q 480 80 475 80 Q 480 80 480 75 Z"
        fill="#E2E8F0"
        opacity="0.8"
      />
      <circle cx="215" cy="65" r="2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="340" cy="90" r="1.5" fill="#BFDBFE" opacity="0.8" />
      <circle cx="140" cy="240" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="90" cy="420" r="2" fill="#FFFFFF" opacity="0.75" />
      <circle cx="150" cy="490" r="1.5" fill="#93C5FD" opacity="0.8" />
      <circle cx="280" cy="530" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="370" cy="380" r="1.5" fill="#E2E8F0" opacity="0.6" />
      <circle cx="430" cy="240" r="2" fill="#FFFFFF" opacity="0.8" />

      {/* DETACHED FLOATING SMOKE PUFFS */}
      <circle cx="265" cy="505" r="18" fill="#FFFFFF" opacity="0.22" />
      <circle cx="485" cy="460" r="14" fill="#FFFFFF" opacity="0.28" />
      <circle cx="360" cy="475" r="22" fill="#FFFFFF" opacity="0.25" />
      <circle cx="445" cy="510" r="16" fill="#FFFFFF" opacity="0.3" />
      <circle cx="535" cy="275" r="15" fill="#FFFFFF" opacity="0.25" />
      <circle cx="540" cy="345" r="20" fill="#FFFFFF" opacity="0.22" />

      {/* LAYER 1: DARK UNDERLAYER CLOUD SHADOW */}
      <path
        d="M 1000 0 L 590 0
           C 565 10, 550 30, 555 55
           C 520 65, 510 110, 540 140
           C 505 160, 500 215, 535 245
           C 495 270, 490 330, 525 365
           C 475 390, 460 455, 500 500
           C 450 520, 430 580, 470 600
           L 1000 600 Z"
        fill="url(#smokeShadowGrad)"
      />

      {/* LAYER 2: TRANSLUCENT MID-LAYER CLOUDS */}
      <path
        d="M 1000 0 L 600 0
           C 575 15, 565 40, 570 65
           C 540 75, 530 120, 560 150
           C 525 170, 520 225, 555 255
           C 515 280, 510 340, 545 375
           C 485 400, 470 470, 520 515
           C 470 540, 455 595, 505 600
           L 1000 600 Z"
        fill="#CBDDEB"
        opacity="0.55"
      />

      {/* LAYER 3: MAIN WHITE BILLOWING CLOUD CANVAS (Forms the right half for form) */}
      <path
        d="M 1000 0 L 610 0
           C 580 10, 560 35, 565 65
           C 568 80, 578 92, 590 100
           C 560 108, 540 135, 545 165
           C 550 185, 565 200, 585 208
           C 555 215, 535 245, 540 278
           C 545 305, 565 325, 592 332
           C 558 340, 530 375, 538 412
           C 545 440, 570 460, 600 465
           C 565 475, 535 515, 548 555
           C 558 585, 585 600, 615 600
           L 1000 600 Z"
        fill="#FFFFFF"
      />

      {/* ROCKET EXHAUST PLUME */}
      <g id="exhaust-trail">
        <path
          d="M 335 290
             C 345 320, 360 360, 395 385
             C 435 410, 480 395, 520 440
             C 550 475, 540 540, 600 570
             C 560 580, 520 570, 480 550
             C 430 525, 410 470, 370 440
             C 335 415, 330 350, 320 300 Z"
          fill="#FFFFFF"
          opacity="0.88"
        />
        <path
          d="M 330 295
             C 345 330, 375 375, 415 405
             C 455 435, 505 440, 550 480
             C 580 505, 590 550, 620 575
             C 580 575, 550 560, 520 535
             C 475 495, 440 470, 395 435
             C 360 405, 345 350, 325 305 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* ROCKET ATMOSPHERIC SPEED HALO / MOTION AURA */}
      <g transform="translate(290, 245) rotate(-35)">
        <ellipse cx="0" cy="55" rx="42" ry="120" fill="#FFFFFF" opacity="0.08" />
        <ellipse cx="0" cy="40" rx="30" ry="90" fill="#FFFFFF" opacity="0.12" />
      </g>

      {/* ROCKET SHIP (Blasting off diagonally towards Top-Left) */}
      <g id="rocket-ship" transform="translate(290, 245) rotate(-35)">
        {/* Thruster Flame */}
        <path
          d="M -10 42 C -15 65, -5 85, 0 100 C 5 85, 15 65, 10 42 Z"
          fill="url(#flameGrad)"
          filter="url(#flameGlow)"
        />
        <path d="M -6 42 C -9 58, -3 70, 0 80 C 3 70, 9 58, 6 42 Z" fill="#FFFFFF" />

        {/* Left Fin */}
        <path d="M -18 15 C -35 22, -42 42, -38 52 C -28 50, -20 44, -16 38 Z" fill="#F43F5E" />
        {/* Right Fin */}
        <path d="M 18 15 C 35 22, 42 42, 38 52 C 28 50, 20 44, 16 38 Z" fill="#F43F5E" />
        {/* Thruster Base Ring */}
        <rect x="-12" y="38" width="24" height="6" rx="2" fill="#06141B" />

        {/* Fuselage Body (Capsule) */}
        <path
          d="M 0 -55
             C 25 -25, 26 15, 18 40
             L -18 40
             C -26 15, -25 -25, 0 -55 Z"
          fill="#F8FAFC"
        />

        {/* Nose Cone Accent */}
        <path
          d="M 0 -55
             C 12 -40, 15 -25, 15 -18
             L -15 -18
             C -15 -25, -12 -40, 0 -55 Z"
          fill="#F43F5E"
        />

        {/* Center Dorsal Fin */}
        <path d="M -3 15 L 3 15 L 3 42 L -3 42 Z" fill="#E11D48" />

        {/* Porthole Window */}
        <circle cx="0" cy="5" r="11" fill="#11212D" />
        <circle cx="0" cy="5" r="8.5" fill="#38BDF8" />
        <circle cx="-2.5" cy="2.5" r="3" fill="#FFFFFF" opacity="0.9" />

        {/* Shading Stripe */}
        <path
          d="M -16 0 C -16 -20, -10 -35, -5 -45 C -10 -35, -14 -15, -13 25 L -17 35 Z"
          fill="#E2E8F0"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
