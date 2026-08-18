<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  size?: number;
  animate?: boolean;
  speed?: number;
  className?: string;
}>();

const size = computed(() => props.size || 40);
const isAnimating = computed(() => props.animate !== false);
// Total cycle: rotation (3s) + hold (0.8s) = 3.8s
const animationDuration = computed(() => props.speed || 3.8);

const iconStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
  '--rotation-duration': '3s',
  '--hold-duration': '0.8s',
  '--sand-flow-duration': '2.8s',
  '--settle-duration': '0.2s',
  '--blink-duration': '4s',
  '--cycle-duration': `${animationDuration.value}s`,
  '--sand-flow-start': '0.2s',
  '--rotation-start': '0.2s',
}));
</script>

<template>
  <div class="animated-icon-wrapper" :class="className">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      :style="iconStyle"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#293b58"/><stop offset="1" stop-color="#243752"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fffdf6"/><stop offset="0.55" stop-color="#fff9ed"/><stop offset="1" stop-color="#f7f0df"/>
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff0d0"/><stop offset="1" stop-color="#ead4aa"/>
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stop-color="#ffb63f"/><stop offset="0.62" stop-color="#f5a72f"/><stop offset="1" stop-color="#df9525"/>
        </linearGradient>
        <linearGradient id="sand2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffb642"/><stop offset="1" stop-color="#e49a29"/>
        </linearGradient>
      </defs>

      <!-- Static background -->
      <rect width="1024" height="1024" rx="205" fill="url(#bg)"/>

      <!-- Static wooden caps (don't rotate) -->
      <rect x="274" y="133" width="476" height="61" rx="30.5" fill="url(#wood)"/>
      <rect x="319" y="192" width="386" height="28" rx="7" fill="#f3dfbd"/>
      <rect x="274" y="815" width="476" height="58" rx="29" fill="url(#wood)"/>
      <rect x="316" y="800" width="392" height="19" rx="7" fill="#f4e2c2"/>
      <path d="M305 145 H719" stroke="#fff7e6" stroke-width="7" stroke-linecap="round" opacity=".45"/>

      <!-- Rotating group - only the hourglass glass and sand rotate -->
      <g class="rotating-hourglass" :class="{ 'animate-rotate': isAnimating }">
        <!-- glass silhouette -->
        <path d="M322 214 C309 243 308 279 314 311 C322 357 347 394 387 425 L454 477 C483 500 483 522 454 547 L384 605 C340 641 315 686 315 735 C315 760 320 785 326 802 L699 802 C706 783 710 758 710 735 C710 686 684 641 640 605 L570 547 C541 522 541 500 570 477 L637 425 C677 394 702 357 710 311 C716 279 715 243 702 214 Z" fill="url(#glass)"/>

        <!-- upper sand reservoir - morphs during animation -->
        <path class="sand-top" d="M391 410 C432 402 460 406 488 412 C510 417 533 417 556 412 C585 406 612 402 633 410 L548 471 C525 488 514 504 512 524 C509 505 499 488 476 471 Z" fill="url(#sand)"/>
        <path class="sand-top-shade" d="M391 410 C434 404 464 411 491 417 C514 422 539 420 563 414 C590 408 614 404 633 410 L556 463 C530 481 515 486 489 476 C458 464 425 435 391 410Z" fill="#ffb53c" opacity=".52"/>
        
        <!-- Sand stream - flows from neck to neck -->
        <path class="sand-stream" d="M512 470 Q512 512 512 550 Q512 590 512 630" fill="none" stroke="url(#sand)" stroke-width="12" stroke-linecap="round" opacity="0"/>
        
        <!-- Individual sand particles falling at different speeds -->
        <circle class="sand-grain sand-grain-1" cx="500" cy="480" r="4" fill="#f2a332" opacity="0"/>
        <circle class="sand-grain sand-grain-2" cx="512" cy="490" r="3.5" fill="#f5a72f" opacity="0"/>
        <circle class="sand-grain sand-grain-3" cx="524" cy="500" r="4.5" fill="#df9525" opacity="0"/>
        <circle class="sand-grain sand-grain-4" cx="505" cy="510" r="3" fill="#e49a29" opacity="0"/>
        <circle class="sand-grain sand-grain-5" cx="519" cy="520" r="4" fill="#ffb63f" opacity="0"/>
        <circle class="sand-grain sand-grain-6" cx="510" cy="535" r="3.5" fill="#f2a332" opacity="0"/>
        <circle class="sand-grain sand-grain-7" cx="515" cy="545" r="4" fill="#df9525" opacity="0"/>

        <!-- lower sand reservoir - morphs during animation -->
        <path class="sand-bottom" d="M342 801 C344 772 362 753 393 737 L466 695 C485 684 499 674 512 671 C525 674 539 684 558 695 L631 737 C662 753 680 772 682 801 Z" fill="url(#sand2)"/>
        <path class="sand-bottom-shade" d="M342 801 C344 774 363 755 397 737 L468 697 C485 686 498 678 512 675 C526 680 540 691 558 705 C582 723 604 737 622 748 C647 764 665 782 668 801 Z" fill="#ffb63e" opacity=".58"/>

        <!-- glass highlights -->
        <path class="glass-highlight glass-highlight-1" d="M622 235 C658 243 680 271 680 305 C680 315 678 325 674 333" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" opacity=".78"/>
        <path class="glass-highlight glass-highlight-2" d="M600 604 C640 628 667 664 670 705" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round" opacity=".72"/>

        <!-- face - counter-rotates to stay upright -->
        <g class="face-group">
          <!-- left eye -->
          <circle class="eye eye-left" cx="428" cy="315" r="21" fill="#26384f"/>
          <circle class="eye-pupil" cx="428" cy="315" r="8" fill="#1a2536"/>
          <!-- right eye -->
          <circle class="eye eye-right" cx="596" cy="315" r="21" fill="#26384f"/>
          <circle class="eye-pupil" cx="596" cy="315" r="8" fill="#1a2536"/>
          <!-- mouth / smile -->
          <path class="mouth" d="M487 341 C493 351 503 356 512 356 C522 356 532 351 537 341" fill="none" stroke="#26384f" stroke-width="10" stroke-linecap="round"/>
          <!-- eyelids for blinking -->
          <path class="eyelid eyelid-left" d="M407 315 Q428 300 450 315" fill="#26384f" opacity="0"/>
          <path class="eyelid eyelid-right" d="M575 315 Q596 300 618 315" fill="#26384f" opacity="0"/>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.animated-icon-wrapper {
  display: inline-block;
  line-height: 0;
}

.animated-icon-wrapper svg {
  display: block;
}

/* ===== ROTATION ANIMATION ===== */
/* Slower, more intentional rotation with easing */
@keyframes rotateWithHold {
  0% { transform: rotate(0deg); }
  /* Slow acceleration */
  15% { transform: rotate(20deg); }
  30% { transform: rotate(60deg); }
  /* Passing through 90 degrees */
  43% { transform: rotate(90deg); }
  /* Gentle deceleration */
  57% { transform: rotate(120deg); }
  70% { transform: rotate(150deg); }
  /* Settle at 180 with tiny overshoot for physicality */
  85% { transform: rotate(177deg); }
  87.5% { transform: rotate(181deg); }
  90%, 100% { transform: rotate(180deg); }
}

/* ===== SAND FLOW ANIMATIONS ===== */
/* Upper sand shrinking */
@keyframes sandTopShrink {
  0%, 10% { 
    transform: scale(1) translateY(0); 
    opacity: 1;
  }
  15%, 85% { 
    transform: scale(0.95) translateY(2px); 
    opacity: 0.8;
  }
  90%, 100% { 
    transform: scale(0.05) translateY(0); 
    opacity: 0.1;
  }
}

/* Sand stream appearing and flowing */
@keyframes sandStreamFlow {
  0%, 15% { 
    opacity: 0;
    transform: translateY(-10px);
  }
  20% { 
    opacity: 0.8;
    transform: translateY(0);
  }
  40% { 
    opacity: 1;
    transform: translateY(5px);
  }
  60% { 
    opacity: 1;
    transform: translateY(10px);
  }
  80% { 
    opacity: 0.8;
    transform: translateY(15px);
  }
  85%, 100% { 
    opacity: 0;
    transform: translateY(20px);
  }
}

/* Individual grain animations with different timings */
@keyframes grainFall1 {
  0% { opacity: 0; transform: translateY(-20px) translateX(-8px); }
  10% { opacity: 0.8; transform: translateY(0) translateX(-8px); }
  30% { opacity: 1; transform: translateY(80px) translateX(-4px); }
  50% { opacity: 0.8; transform: translateY(160px) translateX(0px); }
  70% { opacity: 0.4; transform: translateY(240px) translateX(2px); }
  85%, 100% { opacity: 0; transform: translateY(280px) translateX(4px); }
}

@keyframes grainFall2 {
  0% { opacity: 0; transform: translateY(-15px) translateX(0px); }
  12% { opacity: 0.8; transform: translateY(0) translateX(0px); }
  35% { opacity: 1; transform: translateY(90px) translateX(-2px); }
  55% { opacity: 0.8; transform: translateY(170px) translateX(3px); }
  75% { opacity: 0.4; transform: translateY(250px) translateX(-1px); }
  87%, 100% { opacity: 0; transform: translateY(290px) translateX(2px); }
}

@keyframes grainFall3 {
  0% { opacity: 0; transform: translateY(-25px) translateX(8px); }
  8% { opacity: 0.8; transform: translateY(0) translateX(8px); }
  28% { opacity: 1; transform: translateY(70px) translateX(6px); }
  48% { opacity: 0.8; transform: translateY(150px) translateX(2px); }
  68% { opacity: 0.4; transform: translateY(230px) translateX(-3px); }
  82%, 100% { opacity: 0; transform: translateY(270px) translateX(-1px); }
}

@keyframes grainFall4 {
  0% { opacity: 0; transform: translateY(-18px) translateX(-5px); }
  14% { opacity: 0.8; transform: translateY(0) translateX(-5px); }
  38% { opacity: 1; transform: translateY(85px) translateX(-1px); }
  58% { opacity: 0.8; transform: translateY(165px) translateX(4px); }
  78% { opacity: 0.4; transform: translateY(245px) translateX(1px); }
  90%, 100% { opacity: 0; transform: translateY(285px) translateX(-2px); }
}

@keyframes grainFall5 {
  0% { opacity: 0; transform: translateY(-22px) translateX(5px); }
  10% { opacity: 0.8; transform: translateY(0) translateX(5px); }
  32% { opacity: 1; transform: translateY(75px) translateX(3px); }
  52% { opacity: 0.8; transform: translateY(155px) translateX(-2px); }
  72% { opacity: 0.4; transform: translateY(235px) translateX(1px); }
  86%, 100% { opacity: 0; transform: translateY(275px) translateX(3px); }
}

@keyframes grainFall6 {
  0% { opacity: 0; transform: translateY(-20px) translateX(-3px); }
  16% { opacity: 0.8; transform: translateY(0) translateX(-3px); }
  40% { opacity: 1; transform: translateY(90px) translateX(2px); }
  60% { opacity: 0.8; transform: translateY(170px) translateX(-1px); }
  80% { opacity: 0.4; transform: translateY(250px) translateX(3px); }
  92%, 100% { opacity: 0; transform: translateY(290px) translateX(-2px); }
}

@keyframes grainFall7 {
  0% { opacity: 0; transform: translateY(-15px) translateX(4px); }
  12% { opacity: 0.8; transform: translateY(0) translateX(4px); }
  35% { opacity: 1; transform: translateY(80px) translateX(-1px); }
  55% { opacity: 0.8; transform: translateY(160px) translateX(2px); }
  75% { opacity: 0.4; transform: translateY(240px) translateX(-2px); }
  88%, 100% { opacity: 0; transform: translateY(280px) translateX(1px); }
}

/* Lower sand growing */
@keyframes sandBottomGrow {
  0%, 10% { 
    transform: scale(0.05) translateY(0); 
    opacity: 0.1;
  }
  15%, 85% { 
    transform: scale(0.95) translateY(-2px); 
    opacity: 0.8;
  }
  90%, 100% { 
    transform: scale(1) translateY(0); 
    opacity: 1;
  }
}

/* ===== FACE ANIMATIONS ===== */
/* Subtle eye movement and blinking */
@keyframes eyeBlink {
  0%, 45%, 55%, 100% { 
    transform: scaleY(1);
    opacity: 1;
  }
  50% { 
    transform: scaleY(0.05);
    opacity: 1;
  }
}

@keyframes pupilShift {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1px, 1px); }
  75% { transform: translate(1px, -1px); }
}

/* Mouth subtle movement */
@keyframes mouthSubtle {
  0%, 100% { transform: translateY(0); }
  20% { transform: translateY(1px); }
  80% { transform: translateY(-1px); }
}

/* Face counter-rotation to stay upright */
@keyframes faceCounterRotate {
  0%, 100% { 
    transform: rotate(0deg); 
  }
  /* Match rotation easing */
  15% { transform: rotate(-20deg); }
  30% { transform: rotate(-60deg); }
  43% { transform: rotate(-90deg); }
  57% { transform: rotate(-120deg); }
  70% { transform: rotate(-150deg); }
  85% { transform: rotate(-177deg); }
  87.5% { transform: rotate(-181deg); }
  90%, 100% { transform: rotate(-180deg); }
}

/* Glass highlight subtle shift */
@keyframes highlightShift {
  0%, 100% { 
    transform: translate(0, 0);
    opacity: 0.78;
  }
  25% { 
    transform: translate(-2px, 1px);
    opacity: 0.85;
  }
  75% { 
    transform: translate(2px, -1px);
    opacity: 0.8;
  }
}

@keyframes highlightShift2 {
  0%, 100% { 
    transform: translate(0, 0);
    opacity: 0.72;
  }
  30% { 
    transform: translate(-1px, 2px);
    opacity: 0.78;
  }
  70% { 
    transform: translate(1px, -2px);
    opacity: 0.75;
  }
}

/* ===== APPLY ANIMATIONS ===== */
.rotating-hourglass {
  transform-origin: 512px 512px;
}

.rotating-hourglass.animate-rotate {
  animation: rotateWithHold var(--rotation-duration) ease-in-out infinite;
}

/* Sand reservoirs */
.sand-top,
.sand-top-shade {
  transform-origin: 512px 512px;
  animation: sandTopShrink var(--cycle-duration) ease-in-out infinite;
}

.sand-bottom,
.sand-bottom-shade {
  transform-origin: 512px 512px;
  animation: sandBottomGrow var(--cycle-duration) ease-in-out infinite;
}

/* Sand stream */
.sand-stream {
  transform-origin: 512px 512px;
  animation: sandStreamFlow var(--cycle-duration) ease-in-out infinite;
}

/* Individual grains with staggered timing */
.sand-grain-1 { animation: grainFall1 var(--cycle-duration) ease-in infinite; }
.sand-grain-2 { animation: grainFall2 var(--cycle-duration) ease-in infinite; }
.sand-grain-3 { animation: grainFall3 var(--cycle-duration) ease-in infinite; }
.sand-grain-4 { animation: grainFall4 var(--cycle-duration) ease-in infinite; }
.sand-grain-5 { animation: grainFall5 var(--cycle-duration) ease-in infinite; }
.sand-grain-6 { animation: grainFall6 var(--cycle-duration) ease-in infinite; }
.sand-grain-7 { animation: grainFall7 var(--cycle-duration) ease-in infinite; }

/* Face elements */
.face-group {
  transform-origin: 512px 512px;
}

.rotating-hourglass.animate-rotate .face-group {
  animation: faceCounterRotate var(--rotation-duration) ease-in-out infinite;
}

.rotating-hourglass.animate-rotate .eye-pupil {
  animation: pupilShift 3s ease-in-out infinite;
}

.rotating-hourglass.animate-rotate .eyelid-left,
.rotating-hourglass.animate-rotate .eyelid-right {
  transform-origin: 512px 512px;
  animation: eyeBlink var(--blink-duration) ease-in-out infinite;
}

.rotating-hourglass.animate-rotate .mouth {
  animation: mouthSubtle 3s ease-in-out infinite;
}

/* Glass highlights */
.glass-highlight-1 {
  animation: highlightShift var(--cycle-duration) ease-in-out infinite;
}

.glass-highlight-2 {
  animation: highlightShift2 var(--cycle-duration) ease-in-out infinite;
}
</style>
