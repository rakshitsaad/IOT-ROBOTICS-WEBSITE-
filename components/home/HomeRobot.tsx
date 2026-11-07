"use client";

import { BotStage, useBotMood } from "@/components/robot";
import { BOT_CAMERA, BOT_HEIGHT, BOT_VIEW_HEIGHT } from "@/components/robot/config";

/** Robot height as a fraction of its stage height. */
const ROBOT_HEIGHT = 0.7;
/** Where the robot's base sits, as a fraction of the stage height from the top (clear of the bottom labels). */
const ROBOT_BASE = 0.88;

/**
 * Hero placement: fills ROBOT_HEIGHT of the stage with its base at ROBOT_BASE,
 * turned 20° towards the page (it turns to face the camera as you scroll).
 * The stage box itself (CSS below) decides where that is on screen, so the
 * server-rendered poster is already in the right place on every screen.
 */
export const HOME_ROBOT = {
  x: 0,
  y: BOT_CAMERA.position[1] - (ROBOT_BASE - 0.5) * BOT_VIEW_HEIGHT,
  z: 0,
  rotX: 0,
  rotY: -0.35,
  scale: (ROBOT_HEIGHT * BOT_VIEW_HEIGHT) / BOT_HEIGHT,
};

/**
 * The home page's only <BotStage>, plus the mood engine. The stage is fixed
 * so the robot can travel from the hero into the statement section; the
 * scroll timeline (HomeScroll) moves it with botTransform.
 *
 * Stage box:
 * - phones: full width, bottom 71.4svh, so the robot is 50svh tall
 *   (41–91svh), centred under the wordmark and clear of the corner labels;
 * - md and up: from 32% of the width to the right edge, full height (capped
 *   at 95vw for portrait tablets), so the robot stands at 66% of the width;
 * - reduced motion: the same box, but absolute at the top of the page, so
 *   the robot (the poster) stays in the hero and scrolls away with it.
 */
export function HomeRobot() {
  useBotMood();
  return (
    <div
      data-home-robot
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-[71.4svh] md:left-[32%] md:h-[min(100svh,95vw)] motion-reduce:absolute motion-reduce:bottom-auto motion-reduce:top-[28.6svh] md:motion-reduce:top-[calc(100svh_-_min(100svh,95vw))]"
    >
      <BotStage fixed={false} transform={HOME_ROBOT} preloadPoster label="Say hi to the club robot" />
    </div>
  );
}
