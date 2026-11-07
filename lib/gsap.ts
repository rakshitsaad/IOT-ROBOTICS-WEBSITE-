/**
 * Single entry point for GSAP. Always import gsap / ScrollTrigger / useGSAP
 * from here so plugins are registered exactly once.
 *
 *   import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
 *
 * GSAP and all its plugins are free (including SplitText, ScrollSmoother,
 * MorphSVG…). Register extra plugins here when a component needs them.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { EASE, DURATION } from "./motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

gsap.defaults({ ease: EASE.out, duration: DURATION.base });

export { gsap, ScrollTrigger, useGSAP };
