export function LoginHeroIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 760 520"
        className="w-full h-auto select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Soft Background Mountains / Cloud Gradients in TakarLaba Slate Palette */}
          <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C4D8E7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EAF2F8" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AFC8DC" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#DEEBF4" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="foliageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A2BFD7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D9E8F3" stopOpacity="0.2" />
          </linearGradient>

          {/* Main Screen Gradients */}
          <linearGradient id="screenFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F6FA" />
          </linearGradient>
          <linearGradient id="railGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#46627A" />
            <stop offset="100%" stopColor="#253745" />
          </linearGradient>

          {/* Floating 3D Pie Chart Gradients */}
          <linearGradient id="pie3dTopLg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93B4D1" />
            <stop offset="100%" stopColor="#678EAE" />
          </linearGradient>
          <linearGradient id="pie3dTopSm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F7495" />
            <stop offset="100%" stopColor="#253745" />
          </linearGradient>
          <linearGradient id="pie3dSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2C4C68" />
            <stop offset="100%" stopColor="#11212D" />
          </linearGradient>

          {/* 3D Bar Columns Gradients */}
          <linearGradient id="barTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#91B3D0" />
            <stop offset="100%" stopColor="#6A90B1" />
          </linearGradient>
          <linearGradient id="barLeftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B5D7A" />
            <stop offset="100%" stopColor="#1B3245" />
          </linearGradient>
          <linearGradient id="barRightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A455D" />
            <stop offset="100%" stopColor="#11212D" />
          </linearGradient>

          {/* Sphere Radial Gradient */}
          <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#B8D3EA" />
            <stop offset="45%" stopColor="#6086A7" />
            <stop offset="100%" stopColor="#11212D" />
          </radialGradient>

          {/* Shadows */}
          <filter id="screenDropShadow" x="-10%" y="-10%" width="125%" height="130%">
            <feDropShadow
              dx="0"
              dy="16"
              stdDeviation="16"
              floodColor="#11212D"
              floodOpacity="0.12"
            />
          </filter>
          <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* BACKGROUND: Soft Mountain/Cloud Blobs */}
        <g id="background-blobs">
          {/* Back Hill */}
          <path
            d="M 180 340 C 240 180, 360 160, 480 200 C 580 230, 640 170, 710 240 C 740 270, 750 350, 730 440 C 650 450, 200 450, 180 340 Z"
            fill="url(#cloudGrad1)"
          />
          {/* Mid Hill Layer */}
          <path
            d="M 230 420 C 260 270, 330 200, 420 220 C 500 240, 560 210, 650 280 C 700 320, 710 400, 680 440 Z"
            fill="url(#cloudGrad2)"
            opacity="0.85"
          />
          {/* Botanical foliage (Left) */}
          <path
            d="M 195 380 C 180 330, 190 280, 215 260 C 220 290, 215 340, 195 380 Z"
            fill="url(#foliageGrad)"
          />
          <path
            d="M 180 400 C 160 360, 165 315, 185 295 C 190 325, 190 365, 180 400 Z"
            fill="url(#foliageGrad)"
            opacity="0.7"
          />
          {/* Botanical foliage (Right) */}
          <path
            d="M 685 390 C 705 340, 700 290, 675 270 C 670 300, 675 350, 685 390 Z"
            fill="url(#foliageGrad)"
          />
        </g>

        {/* FLOATING 3D PIE CHART (Top Left) */}
        <g id="floating-3d-pie" className="animate-float-slow">
          {/* Drop Shadow on Cloud */}
          <ellipse
            cx="210"
            cy="190"
            rx="36"
            ry="12"
            fill="#253745"
            opacity="0.16"
            filter="url(#softBlur)"
          />

          {/* 3D Extrusion Rim (Dark Side) */}
          <path
            d="M 175 125 A 35 20 0 0 0 245 125 L 245 140 A 35 20 0 0 1 175 140 Z"
            fill="url(#pie3dSide)"
          />

          {/* Big Wedge Surface (75%) */}
          <path
            d="M 210 125 L 175 125 A 35 20 0 1 1 235 140 L 210 125 Z"
            fill="url(#pie3dTopLg)"
            stroke="#A9C7DF"
            strokeWidth="0.75"
          />

          {/* Cut Small Wedge Surface (25% separated) */}
          <g transform="translate(-4, -5)">
            <path
              d="M 210 125 L 235 140 A 35 20 0 0 0 245 125 L 245 137 A 35 20 0 0 1 235 152 L 210 137 Z"
              fill="#11212D"
            />
            <path
              d="M 210 125 L 235 140 A 35 20 0 0 0 245 125 Z"
              fill="url(#pie3dTopSm)"
              stroke="#749BBF"
              strokeWidth="0.75"
            />
          </g>
        </g>

        {/* FLOATING SPHERE (Top Right) */}
        <g id="floating-sphere" className="animate-float-reverse">
          <ellipse
            cx="615"
            cy="185"
            rx="14"
            ry="5"
            fill="#253745"
            opacity="0.12"
            filter="url(#softBlur)"
          />
          <circle cx="615" cy="155" r="13" fill="url(#sphereGrad)" />
        </g>

        {/* GROUND LINE & SHADOWS */}
        <g id="ground-plane">
          <line
            x1="160"
            y1="440"
            x2="690"
            y2="440"
            stroke="#CBDCE8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="440"
            cy="442"
            rx="160"
            ry="8"
            fill="#1E384D"
            opacity="0.14"
            filter="url(#softBlur)"
          />
        </g>

        {/* MAIN DASHBOARD SCREEN */}
        <g id="main-dashboard-screen" filter="url(#screenDropShadow)">
          {/* Screen Chassis */}
          <rect
            x="270"
            y="195"
            width="310"
            height="200"
            rx="16"
            fill="url(#screenFaceGrad)"
            stroke="#B6CDDE"
            strokeWidth="2"
          />

          {/* Left Rail / Sidebar Navigation */}
          <path
            d="M 270 211 C 270 202.16 277.16 195 286 195 L 302 195 L 302 395 L 286 395 C 277.16 395 270 387.84 270 379 Z"
            fill="url(#railGrad)"
          />
          {/* Rail Navigation Dots */}
          <circle cx="286" cy="220" r="5" fill="#D3E2EE" />
          <circle cx="286" cy="245" r="4" fill="#7190A9" />
          <circle cx="286" cy="270" r="4" fill="#7190A9" />
          <circle cx="286" cy="295" r="4" fill="#7190A9" />
          <circle cx="286" cy="320" r="4" fill="#7190A9" />

          {/* Screen Content: Top Header Lines */}
          <rect x="320" y="215" width="70" height="5" rx="2.5" fill="#9FBCCE" />
          <rect x="320" y="226" width="110" height="4" rx="2" fill="#D0DFEB" />
          <rect x="320" y="235" width="90" height="4" rx="2" fill="#D0DFEB" />

          {/* Screen Content: Center Pie Chart (Margin & Cost Breakdown) */}
          <g transform="translate(450, 275)">
            <circle cx="0" cy="0" r="44" fill="#EDF3F8" stroke="#D7E4EE" strokeWidth="1" />
            {/* Slice 1: Food Cost (HPP) - 50% */}
            <path d="M 0 0 L 0 -44 A 44 44 0 0 1 44 0 Z" fill="#80A4C2" />
            {/* Slice 2: Net Profit - 25% */}
            <path d="M 0 0 L 44 0 A 44 44 0 0 1 0 44 Z" fill="#253745" />
            {/* Slice 3: Operating Margin - 25% */}
            <path d="M 0 0 L 0 44 A 44 44 0 0 1 -44 0 L 0 0 Z" fill="#11212D" />
            <circle cx="0" cy="0" r="14" fill="#F4F8FB" />
          </g>

          {/* Screen Content: Right Metric Cards */}
          <g transform="translate(520, 235)">
            <rect x="0" y="0" width="45" height="6" rx="3" fill="#678BA9" />
            <rect x="0" y="12" width="40" height="4" rx="2" fill="#B7CEE0" />
            <rect x="0" y="22" width="32" height="4" rx="2" fill="#B7CEE0" />
            <rect x="0" y="32" width="42" height="4" rx="2" fill="#B7CEE0" />
          </g>

          {/* Screen Content: Progress/Trend Bars */}
          <rect x="320" y="260" width="30" height="6" rx="3" fill="#678BA9" />
          <rect x="320" y="275" width="65" height="12" rx="3" fill="#D2E2EF" />
          <rect x="320" y="295" width="55" height="12" rx="3" fill="#253745" />

          {/* Screen Content: Bottom Widgets */}
          <rect
            x="320"
            y="330"
            width="85"
            height="18"
            rx="5"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
          <rect
            x="420"
            y="330"
            width="70"
            height="18"
            rx="5"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
          <rect
            x="505"
            y="330"
            width="60"
            height="18"
            rx="5"
            fill="#EDF4F9"
            stroke="#CCDDE9"
            strokeWidth="1"
          />
        </g>

        {/* 3D BAR PILLARS (Front of Dashboard) */}
        <g id="bar-pillars-3d">
          <ellipse
            cx="505"
            cy="435"
            rx="38"
            ry="10"
            fill="#162D3E"
            opacity="0.25"
            filter="url(#softBlur)"
          />

          {/* Pillar 1: Short Left */}
          <g transform="translate(475, 375)">
            <path d="M 0 10 L 14 18 L 14 55 L 0 47 Z" fill="url(#barLeftGrad)" />
            <path d="M 14 18 L 28 10 L 28 47 L 14 55 Z" fill="url(#barRightGrad)" />
            <path
              d="M 14 2 L 28 10 L 14 18 L 0 10 Z"
              fill="url(#barTopGrad)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>

          {/* Pillar 2: Medium Middle */}
          <g transform="translate(492, 355)">
            <path d="M 0 10 L 15 19 L 15 75 L 0 66 Z" fill="url(#barLeftGrad)" />
            <path d="M 15 19 L 30 10 L 30 66 L 15 75 Z" fill="url(#barRightGrad)" />
            <path
              d="M 15 1 L 30 10 L 15 19 L 0 10 Z"
              fill="url(#barTopGrad)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>

          {/* Pillar 3: High Front-Right */}
          <g transform="translate(508, 385)">
            <path d="M 0 9 L 13 17 L 13 45 L 0 37 Z" fill="url(#barLeftGrad)" />
            <path d="M 13 17 L 26 9 L 26 37 L 13 45 Z" fill="url(#barRightGrad)" />
            <path
              d="M 13 1 L 26 9 L 13 17 L 0 9 Z"
              fill="url(#barTopGrad)"
              stroke="#B3D0E7"
              strokeWidth="0.5"
            />
          </g>
        </g>

        {/* LEFT CHARACTER (Female Analyst Holding Analytics Tablet) */}
        <g id="character-left">
          <ellipse
            cx="235"
            cy="442"
            rx="26"
            ry="6"
            fill="#1C354A"
            opacity="0.22"
            filter="url(#softBlur)"
          />

          {/* Wide Trousers */}
          <path d="M 218 375 L 210 435 L 226 435 L 230 380 Z" fill="#253745" />
          <path d="M 238 380 L 244 435 L 260 435 L 250 375 Z" fill="#253745" />
          {/* Shoes */}
          <path
            d="M 207 435 C 207 435, 206 442, 224 442 C 228 442, 227 435, 227 435 Z"
            fill="#06141B"
          />
          <path
            d="M 242 435 C 242 435, 243 442, 262 442 C 265 442, 263 435, 263 435 Z"
            fill="#06141B"
          />

          {/* Tunic Top */}
          <path d="M 222 288 L 246 288 L 256 375 L 214 375 Z" fill="#3D5F7C" />
          <path d="M 226 285 L 242 285 L 245 298 L 223 298 Z" fill="#E8D1C4" />

          {/* Face & Bob Hairstyle */}
          <ellipse cx="234" cy="272" rx="10" ry="11" fill="#F0DBD1" />
          <path
            d="M 222 272 C 220 258, 248 258, 246 272 C 246 277, 247 284, 243 286 C 241 280, 240 273, 237 273 C 233 273, 230 277, 226 286 C 222 283, 222 277, 222 272 Z"
            fill="#11212D"
          />

          {/* Arms Holding Board */}
          <path
            d="M 222 295 L 210 335 L 222 342"
            stroke="#3D5F7C"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 248 295 L 256 335 L 245 342"
            stroke="#3D5F7C"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Analytics Board with Vertical Bar Columns */}
          <g transform="translate(196, 330)">
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

        {/* RIGHT CHARACTER (Male Analyst Adjusting Screen Panel) */}
        <g id="character-right">
          <ellipse
            cx="612"
            cy="442"
            rx="24"
            ry="6"
            fill="#1C354A"
            opacity="0.22"
            filter="url(#softBlur)"
          />

          {/* Trousers */}
          <path d="M 598 375 L 590 435 L 606 435 L 610 380 Z" fill="#253745" />
          <path d="M 615 375 L 626 428 L 642 426 L 626 375 Z" fill="#253745" />
          {/* Shoes */}
          <path
            d="M 588 435 C 588 435, 587 442, 604 442 C 608 442, 607 435, 607 435 Z"
            fill="#06141B"
          />
          <path
            d="M 626 428 C 626 428, 631 435, 646 432 C 648 431, 644 425, 644 425 Z"
            fill="#06141B"
          />

          {/* Shirt */}
          <path d="M 600 292 L 624 290 L 626 375 L 598 375 Z" fill="#3D5F7C" />
          <path d="M 607 286 L 619 285 L 620 294 L 608 295 Z" fill="#E8D1C4" />

          {/* Head & Hair */}
          <ellipse cx="614" cy="274" rx="9.5" ry="11" fill="#F0DBD1" />
          <path
            d="M 604 274 C 603 262, 625 260, 625 272 C 625 275, 622 282, 620 282 C 618 280, 617 274, 614 274 C 611 274, 609 279, 606 281 Z"
            fill="#11212D"
          />

          {/* Arms Extending to Data Panel */}
          <path
            d="M 602 298 L 575 320 L 565 316"
            stroke="#3D5F7C"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 618 298 L 585 332 L 568 328"
            stroke="#3D5F7C"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Floating Callout Card in Hands */}
          <g transform="translate(545, 305)">
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
