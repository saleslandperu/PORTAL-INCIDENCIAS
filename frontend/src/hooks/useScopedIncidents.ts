import { useMemo } from "react";
import { useAuth, useOrganization } from "../context/AuthContext";
import { costCentersForKam } from "../services/accessService";
import type { CostCenter, IncidentFilters } from "../types/incident";
import { useIncidentFeed } from "./useIncidentFeed";

export function useScopedCatalogs(filters: IncidentFilters) {
  const { scope } = useAuth();
  const snapshot = useOrganization();
  const feed = useIncidentFeed();

  return useMemo(() => {
    if (!scope) {
      return { costCenters: [] as CostCenter[], kams: [], showKamFilter: false };
    }

    // Antes se devolvía vacío cuando la fuente era "glpi" (los tickets no tenían centro de costo).
    // Ahora que el ticket se relaciona por código, se muestran los centros del catálogo también
    // con datos reales, para poder filtrar por centro de costo.
    const kams = snapshot.users.filter((item) => scope.kamIds.includes(item.id));
    const allowedIds = filters.kamId ? costCentersForKam(filters.kamId, snapshot) : scope.costCenterIds;
    const costCenters: CostCenter[] = snapshot.costCenters
      .filter((item) => allowedIds.includes(item.id))
      .map((item) => ({ id: item.id, name: item.name, code: item.code }));

    return {
      costCenters,
      kams,
      showKamFilter: scope.role === "admin_ti" || scope.role === "gerente" || scope.role === "tecnico_ti",
    };
  }, [feed.source, filters.kamId, scope, snapshot]);
}
