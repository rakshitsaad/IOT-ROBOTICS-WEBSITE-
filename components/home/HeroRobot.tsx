"use client";

import { BotStage, useBotMood } from "@/components/robot";
import { BOT_CAMERA, BOT_HEIGHT, BOT_VIEW_HEIGHT } from "@/components/robot/config";

/** Robot height as a share of its stage, and where its base sits (from the top). */
const ROBOT_HEIGHT = 0.74;
const ROBOT_BASE = 0.9;

/** The hero placement: centred, turned a little towards the headline. Also positions the server-rendered poster. */
const HERO_ROBOT = {
  x: 0,
  y: BOT_CAMERA.position[1] - (ROBOT_BASE - 0.5) * BOT_VIEW_HEIGHT,
  z: 0,
  rotX: 0,
  rotY: -0.3,
  scale: (ROBOT_HEIGHT * BOT_VIEW_HEIGHT) / BOT_HEIGHT,
};

/**
 * The club mascot in the home hero (DESIGN.md §11, §12): the page's only <BotStage>, filling its framed panel, plus
 * the mood engine (blinks, moods, a reaction when it's clicked). It stays in the hero; nothing moves it on scroll.
 */
export function HeroRobot() {
  useBotMood();
  return <BotStage fixed={false} transform={HERO_ROBOT} preloadPoster label="Say hi to ClubBot, the club's robot" />;
}
