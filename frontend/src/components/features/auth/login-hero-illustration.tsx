export function LoginHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 740 520"
        className="w-full h-auto select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* SVG Grain / Noise Texture Filter via feTurbulence */}
          <filter id="grainFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.08   0 0 0 0 0.15   0 0 0 0 0.22   0 0 0 0.22 0"
              result="coloredNoise"
            />
            <feComposite operator="in" in2="SourceGraphic" result="grainPattern" />
            <feBlend mode="multiply" in="SourceGraphic" in2="grainPattern" />
          </filter>

          {/* Monochrome Primary-Color Tones Gradients */}
          <linearGradient id="blobGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C2D8E9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EAF2F8" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="blobGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AFC8DC" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#DFEBF4" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9EBED7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D5E6F2" stopOpacity="0.2" />
          </linearGradient>

          {/* Dashboard Screen Gradients */}
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F2F6FA" />
          </linearGradient>
          <linearGradient id="railGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3A566E" />
            <stop offset="100%" stopColor="#233C52" />
          </linearGradient>

          {/* 3D Pie Disc Gradients */}
          <linearGradient id="pieTopLg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8DB0CD" />
            <stop offset="100%" stopColor="#648CAE" />
          </linearGradient>
          <linearGradient id="pieTopSm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#446A8B" />
            <stop offset="100%" stopColor="#1E3850" />
          </linearGradient>
          <linearGradient id="pieSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#26445E" />
            <stop offset="100%" stopColor="#11212D" />
          </linearGradient>

          {/* 3D Isometric Bar Gradients */}
          <linearGradient id="barTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FB2CF" />
            <stop offset="100%" stopColor="#678EAF" />
          </linearGradient>
          <linearGradient id="barLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3A5D7A" />
            <stop offset="100%" stopColor="#1A3144" />
          </linearGradient>
          <linearGradient id="barRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#264158" />
            <stop offset="100%" stopColor="#11212D" />
          </linearGradient>

          {/* Sphere Radial Gradient */}
          <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#B8D3EA" />
            <stop offset="45%" stopColor="#5E84A5" />
            <stop offset="100%" stopColor="#11212D" />
          </radialGradient>

          {/* Soft Shadows */}
          <filter id="cardShadow" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow
              dx="0"
              dy="16"
              stdDeviation="16"
              floodColor="#11212D"
              floodOpacity="0.14"
            />
          </filter>
          <filter id="floorBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* BACKGROUND: Grain-textured Organic Blob Shape & Plant Silhouettes */}
        <g id="background-elements">
          {/* Left Plant Silhouette behind blob */}
          <path
            d="M 175 390 C 150 335, 160 280, 190 260 C 195 295, 185 350, 175 390 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M 160 410 C 135 365, 145 320, 170 300 C 175 330, 170 375, 160 410 Z"
            fill="url(#leafGrad)"
            opacity="0.6"
          />
          {/* Right Plant Silhouette behind blob */}
          <path
            d="M 680 395 C 705 340, 695 285, 665 265 C 660 300, 670 355, 680 395 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M 695 410 C 720 370, 715 325, 690 305 C 685 335, 685 380, 695 410 Z"
            fill="url(#leafGrad)"
            opacity="0.6"
          />

          {/* Large Organic Blob with Grain Texture */}
          <g filter="url(#grainFilter)">
            <path
              d="M 165 340 C 220 180, 350 160, 470 195 C 570 225, 630 165, 700 235 C 730 265, 740 345, 720 435 C 640 445, 190 445, 165 340 Z"
              fill="url(#blobGrad1)"
            />
            <path
              d="M 215 420 C 245 270, 315 200, 405 220 C 485 240, 545 210, 635 280 C 685 320, 695 400, 665 440 Z"
              fill="url(#blobGrad2)"
              opacity="0.75"
            />
          </g>
        </g>

        {/* FLOATING 3D PIE DISC (Top-Left) */}
        <g id="floating-3d-pie" className="animate-float-slow">
          <ellipse
            cx="205"
            cy="185"
            rx="35"
            ry="11"
            fill="#253745"
            opacity="0.18"
            filter="url(#floorBlur)"
          />
          <path
            d="M 170 120 A 35 20 0 0 0 240 120 L 240 135 A 35 20 0 0 1 170 135 Z"
            fill="url(#pieSide)"
          />
          <path
            d="M 205 120 L 170 120 A 35 20 0 1 1 230 135 L 205 120 Z"
            fill="url(#pieTopLg)"
            stroke="#A9C7DF"
            strokeWidth="0.75"
          />
          <g transform="translate(-4, -5)">
            <path
              d="M 205 120 L 230 135 A 35 20 0 0 0 240 120 L 240 132 A 35 20 0 0 1 230 147 L 205 132 Z"
              fill="#11212D"
            />
            <path
              d="M 205 120 L 230 135 A 35 20 0 0 0 240 120 Z"
              fill="url(#pieTopSm)"
              stroke="#749BBF"
              strokeWidth="0.75"
            />
          </g>
        </g>

        {/* FLOATING GRADIENT SPHERE (Top-Right) */}
        <g id="floating-sphere" className="animate-float-reverse">
          <ellipse
            cx="610"
            cy="180"
            rx="14"
            ry="5"
            fill="#253745"
            opacity="0.14"
            filter="url(#floorBlur)"
          />
          <circle cx="610" cy="150" r="13" fill="url(#sphereGrad)" />
        </g>

        {/* GROUND LINE & FLOOR SHADOW */}
        <g id="ground-plane">
          <ellipse
            cx="430"
            cy="442"
            rx="175"
            ry="8"
            fill="#162B3B"
            opacity="0.14"
            filter="url(#floorBlur)"
          />
          <line
            x1="150"
            y1="440"
            x2="680"
            y2="440"
            stroke="#CBDCE8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* CENTER DASHBOARD / MONITOR CARD */}
        <g id="center-dashboard" filter="url(#cardShadow)">
          <rect
            x="265"
            y="195"
            width="320"
            height="205"
            rx="16"
            fill="url(#screenGrad)"
            stroke="#B6CDDE"
            strokeWidth="2"
          />

          {/* Left Sidebar (32px wide with 6 circular icons) */}
          <path
            d="M 265 211 C 265 202.16 272.16 195 281 195 L 297 195 L 297 400 L 281 400 C 272.16 400 265 392.84 265 384 Z"
            fill="url(#railGrad)"
          />
          <circle cx="281" cy="218" r="4.5" fill="#D3E2EE" />
          <circle cx="281" cy="242" r="3.5" fill="#6F8EA7" />
          <circle cx="281" cy="266" r="3.5" fill="#6F8EA7" />
          <circle cx="281" cy="290" r="3.5" fill="#6F8EA7" />
          <circle cx="281" cy="314" r="3.5" fill="#6F8EA7" />
          <circle cx="281" cy="338" r="3.5" fill="#6F8EA7" />

          {/* Screen Content - Left Side: Horizontal Bars & Text-Line Placeholders */}
          <rect x="312" y="215" width="60" height="5" rx="2.5" fill="#9FBCCE" />
          <rect x="312" y="226" width="95" height="3.5" rx="1.75" fill="#D0DFEB" />
          <rect x="312" y="235" width="80" height="3.5" rx="1.75" fill="#D0DFEB" />

          <rect x="312" y="258" width="35" height="5" rx="2.5" fill="#6589A6" />
          <rect x="312" y="272" width="75" height="10" rx="3" fill="#D2E2EF" />
          <rect x="312" y="290" width="60" height="10" rx="3" fill="#253745" />

          {/* Screen Content - Right Side: Big Pie Chart + Legend Items Beside It */}
          <g transform="translate(450, 272)">
            <circle cx="0" cy="0" r="38" fill="#EDF3F8" stroke="#D7E4EE" strokeWidth="1" />
            {/* Wedge 1 (50%): primary-light */}
            <path d="M 0 0 L 0 -38 A 38 38 0 0 1 38 0 Z" fill="#7FA3C2" />
            {/* Wedge 2 (30%): primary-accent */}
            <path d="M 0 0 L 38 0 A 38 38 0 0 1 -12 36 Z" fill="#253745" />
            {/* Wedge 3 (20%): primary-dark */}
            <path d="M 0 0 L -12 36 A 38 38 0 0 1 0 -38 Z" fill="#11212D" />
            <circle cx="0" cy="0" r="13" fill="#F4F8FB" />
          </g>

          {/* Legend Items Beside Pie Chart */}
          <g transform="translate(506, 252)">
            <rect x="0" y="0" width="7" height="7" rx="2" fill="#7FA3C2" />
            <rect x="12" y="1" width="38" height="5" rx="2.5" fill="#B3CBDF" />

            <rect x="0" y="14" width="7" height="7" rx="2" fill="#253745" />
            <rect x="12" y="15" width="46" height="5" rx="2.5" fill="#B3CBDF" />

            <rect x="0" y="28" width="7" height="7" rx="2" fill="#11212D" />
            <rect x="12" y="29" width="32" height="5" rx="2.5" fill="#B3CBDF" />
          </g>

          {/* Row of Three Small Cards at Bottom */}
          <rect
            x="312"
            y="335"
            width="80"
            height="18"
            rx="4"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
          <rect x="320" y="342" width="40" height="4" rx="2" fill="#9FBCCE" />

          <rect
            x="402"
            y="335"
            width="80"
            height="18"
            rx="4"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
          <rect x="410" y="342" width="45" height="4" rx="2" fill="#9FBCCE" />

          <rect
            x="492"
            y="335"
            width="78"
            height="18"
            rx="4"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
          <rect x="500" y="342" width="35" height="4" rx="2" fill="#9FBCCE" />
        </g>

        {/* BOTTOM CENTER: 3D Isometric Bar Chart Popping Out of Hole in Ground */}
        <g id="hole-and-3d-bars">
          <ellipse cx="505" cy="436" rx="36" ry="11" fill="#11212D" opacity="0.85" />
          <ellipse cx="505" cy="436" rx="33" ry="9" fill="#0A151E" />

          {/* 3D Bar 1 (Short Left) */}
          <g transform="translate(477, 380)">
            <path d="M 0 9 L 13 17 L 13 52 L 0 44 Z" fill="url(#barLeft)" />
            <path d="M 13 17 L 26 9 L 26 44 L 13 52 Z" fill="url(#barRight)" />
            <path
              d="M 13 1 L 26 9 L 13 17 L 0 9 Z"
              fill="url(#barTop)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>

          {/* 3D Bar 2 (Medium Middle) */}
          <g transform="translate(493, 360)">
            <path d="M 0 10 L 14 18 L 14 70 L 0 62 Z" fill="url(#barLeft)" />
            <path d="M 14 18 L 28 10 L 28 62 L 14 70 Z" fill="url(#barRight)" />
            <path
              d="M 14 2 L 28 10 L 14 18 L 0 10 Z"
              fill="url(#barTop)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>

          {/* 3D Bar 3 (Front Right) */}
          <g transform="translate(508, 390)">
            <path d="M 0 9 L 12 16 L 12 42 L 0 35 Z" fill="url(#barLeft)" />
            <path d="M 12 16 L 24 9 L 24 35 L 12 42 Z" fill="url(#barRight)" />
            <path
              d="M 12 2 L 24 9 L 12 16 L 0 9 Z"
              fill="url(#barTop)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>
        </g>

        {/* LEFT FOREGROUND: Flat-style Woman Character (Faceless, dark bob hair, tinted clothes, bar-chart board) */}
        <g id="woman-character">
          <ellipse
            cx="230"
            cy="442"
            rx="24"
            ry="6"
            fill="#1C354A"
            opacity="0.22"
            filter="url(#floorBlur)"
          />

          {/* Legs & Trousers */}
          <path d="M 214 375 L 206 435 L 222 435 L 226 380 Z" fill="#253745" />
          <path d="M 234 380 L 240 435 L 256 435 L 246 375 Z" fill="#253745" />
          <path
            d="M 203 435 C 203 435, 202 442, 220 442 C 224 442, 223 435, 223 435 Z"
            fill="#06141B"
          />
          <path
            d="M 238 435 C 238 435, 239 442, 258 442 C 261 442, 259 435, 259 435 Z"
            fill="#06141B"
          />

          {/* Tunic Dress (Tinted Clothes) */}
          <path d="M 218 288 L 242 288 L 252 375 L 210 375 Z" fill="#3A5B79" />
          <path d="M 222 285 L 238 285 L 241 298 L 219 298 Z" fill="#E8D1C4" />

          {/* Faceless Head & Dark Bob Hair */}
          <ellipse cx="230" cy="272" rx="9.5" ry="10.5" fill="#EEDCD2" />
          <path
            d="M 218 272 C 216 258, 244 258, 242 272 C 242 277, 243 284, 239 286 C 237 280, 236 273, 233 273 C 229 273, 226 277, 222 286 C 218 283, 218 277, 218 272 Z"
            fill="#11212D"
          />

          {/* Arms Holding Chart Board */}
          <path
            d="M 218 295 L 206 335 L 218 342"
            stroke="#3A5B79"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 244 295 L 252 335 L 241 342"
            stroke="#3A5B79"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Small Bar-Chart Board in Hands */}
          <g transform="translate(192, 330)">
            <rect
              x="0"
              y="0"
              width="56"
              height="52"
              rx="5"
              fill="#FFFFFF"
              stroke="#CCDDE9"
              strokeWidth="1.5"
            />
            <rect x="6" y="6" width="22" height="3" rx="1.5" fill="#678BA9" />
            <rect x="8" y="24" width="5" height="20" rx="1" fill="#A4C4DC" />
            <rect x="16" y="16" width="5" height="28" rx="1" fill="#587D9E" />
            <rect x="24" y="28" width="5" height="16" rx="1" fill="#A4C4DC" />
            <rect x="32" y="13" width="5" height="31" rx="1" fill="#11212D" />
            <rect x="40" y="20" width="5" height="24" rx="1" fill="#365773" />
          </g>
        </g>

        {/* RIGHT FOREGROUND: Flat-style Man Character (Faceless, short dark hair, walking with card panel) */}
        <g id="man-character">
          <ellipse
            cx="615"
            cy="442"
            rx="24"
            ry="6"
            fill="#1C354A"
            opacity="0.22"
            filter="url(#floorBlur)"
          />

          {/* Legs & Trousers in Walking Posture */}
          <path d="M 602 375 L 594 435 L 610 435 L 614 380 Z" fill="#253745" />
          <path d="M 619 375 L 630 428 L 646 426 L 630 375 Z" fill="#253745" />
          <path
            d="M 592 435 C 592 435, 591 442, 608 442 C 612 442, 611 435, 611 435 Z"
            fill="#06141B"
          />
          <path
            d="M 630 428 C 630 428, 635 435, 650 432 C 652 431, 648 425, 648 425 Z"
            fill="#06141B"
          />

          {/* Shirt (Tinted clothes) */}
          <path d="M 604 292 L 628 290 L 630 375 L 602 375 Z" fill="#3A5B79" />
          <path d="M 611 286 L 623 285 L 624 294 L 612 295 Z" fill="#E8D1C4" />

          {/* Faceless Head & Short Dark Hair */}
          <ellipse cx="618" cy="274" rx="9" ry="10.5" fill="#EEDCD2" />
          <path
            d="M 608 274 C 607 262, 629 260, 629 272 C 629 275, 626 282, 624 282 C 622 280, 621 274, 618 274 C 615 274, 613 279, 610 281 Z"
            fill="#11212D"
          />

          {/* Arms Extending Toward Dashboard Holding Small Card Panel */}
          <path
            d="M 606 298 L 579 320 L 569 316"
            stroke="#3A5B79"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 622 298 L 589 332 L 572 328"
            stroke="#3A5B79"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Small Card / Panel Held in Hands */}
          <g transform="translate(548, 305)">
            <rect
              x="0"
              y="0"
              width="46"
              height="26"
              rx="4"
              fill="#FFFFFF"
              stroke="#B8CFE0"
              strokeWidth="1.5"
            />
            <rect x="6" y="6" width="34" height="3" rx="1.5" fill="#678BA9" />
            <rect x="6" y="12" width="24" height="3" rx="1.5" fill="#B2CBE0" />
            <rect x="6" y="17" width="16" height="3" rx="1.5" fill="#B2CBE0" />
          </g>
        </g>
      </svg>
    </div>
  );
}
