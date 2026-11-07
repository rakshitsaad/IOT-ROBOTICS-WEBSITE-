/**
 * The drone (DESIGN.md §12 "Mission Control"). Public API, without three.js: the canvas, the model and the
 * effects load lazily through DroneStage. `Drone` (the model) is at "@/components/drone/Drone" for use inside your
 * own R3F canvas.
 */
export { DroneStage } from "./DroneStage";
export { droneActions, droneState, useDroneStore, type DroneMode, type ManualGoal } from "./store";
export { DRONE_COLORS, FLIGHT } from "./config";
