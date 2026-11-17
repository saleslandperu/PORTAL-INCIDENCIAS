import { useSyncExternalStore } from "react";
import { incidentService } from "../services/incidentService";

export function useIncidentFeed() {
  return useSyncExternalStore(incidentService.subscribe, incidentService.getSnapshot);
}
