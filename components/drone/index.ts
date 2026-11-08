/**
 * The drone (DESIGN.md §18). Public API, without three.js. Two uses:
 * - the home hero's sidekick: `<Sidekick />` inside the robot's canvas (BotScene renders it when <BotStage sidekick>);
 * - the /lab/drone bench: <DroneStage> (its own lazy canvas) driven by droneActions.
 * `Drone` (the model) is at "@/components/drone/Drone" for use inside your own R3F canvas.
 */
export { DroneStage } from "./DroneStage";
export { droneActions, droneState, useDroneStore, type ManualGoal } from "./store";
export { DRONE_COLORS, FLIGHT } from "./config";
