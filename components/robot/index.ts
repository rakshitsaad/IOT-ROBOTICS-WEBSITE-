/**
 * Club robot public API (lightweight: no three.js in here).
 *
 *   import { BotStage, useBotMood, botActions, botTransform } from "@/components/robot";
 *
 * <ClubBot /> itself lives in "@/components/robot/ClubBot" and pulls in
 * three.js; import it directly only inside your own R3F <Canvas>.
 */
export { BotStage, useBotSupport, type BotStageProps, type BotSupport } from "./BotStage";
export { useBotMood, BOT_MOOD_WEIGHTS, BOT_MOOD_TIMING } from "./useBotMood";
export {
  useBotStore,
  botTransform,
  botInput,
  botScreen,
  botActions,
  BOT_FACES,
  BOT_TRANSFORM_DEFAULT,
  type BotFace,
  type BotGesture,
  type BotGestureName,
  type BotIdleMove,
  type BotIdleMoveKind,
  type BotReaction,
  type BotScene,
  type BotTransform,
  type Vec3,
} from "./store";
export { BOT_ICONS, BOT_ICON_NAMES, type BotIcon } from "./icons";
