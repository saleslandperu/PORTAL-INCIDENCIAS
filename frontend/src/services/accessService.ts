import { DEFAULT_ROLE_PERMISSIONS, hasPermission } from "../config/permissions";
import type { AccessScope, AppUser } from "../types/organization";
import type { IncidentFilters } from "../types/incident";
import type { OrganizationSnapshot } from "./organizationStore";

function unique(values: string[]) {
  return [...new Set(values)];
}

function permissionIdsFor(user: AppUser): string[] {
  if (user.role === "admin_ti") return [...(DEFAULT_ROLE_PERMISSIONS.admin_ti ?? [])];
  if (user.permissionIds?.length) return user.permissionIds.filter((id) => id !== "profiles.manage");
  return [...(DEFAULT_ROLE_PERMISSIONS[user.role] ?? [])];
}

function flagsFrom(ids: string[], user: AppUser) {
  const canViewUsers = hasPermission(ids, "users.view");
  const canCreateUsers = hasPermission(ids, "users.create");
  const canEditUsers = hasPermission(ids, "users.edit");
  const canToggleUserStatus = hasPermission(ids, "users.toggle_status");
  const canManageCostCenters = hasPermission(ids, "cost_centers.manage");
  return {
    canViewDashboard: hasPermission(ids, "nav.dashboard"),
    canViewIncidentsNav: hasPermission(ids, "nav.incidents"),
    canViewReports: hasPermission(ids, "nav.reports"),
    canViewSettings: hasPermission(ids, "nav.settings"),
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canToggleUserStatus,
    canManageUsers: canViewUsers || canCreateUsers || canEditUsers || canToggleUserStatus,
    canManageCostCenters,
    canManageProfiles: user.role === "admin_ti",
    permissionIds: ids,
  };
}

export function buildAccessScope(user: AppUser, snapshot: OrganizationSnapshot): AccessScope {
  const activeKams = snapshot.users.filter((item) => item.role === "kam" && item.status === "activo");
  const ids = permissionIdsFor(user);
  const flags = flagsFrom(ids, user);

  if (user.role === "admin_ti") {
    return {
      userId: user.id,
      role: user.role,
      seesAllIncidents: true,
      costCenterIds: snapshot.costCenters.map((item) => item.id),
      kamIds: activeKams.map((item) => item.id),
      ...flags,
    };
  }

  const directCostCenters = unique(
    snapshot.assignments.filter((item) => item.kamId === user.id).map((item) => item.costCenterId),
  );

  if (user.role === "consulta") {
    return {
      userId: user.id,
      role: user.role,
      seesAllIncidents: true,
      costCenterIds: snapshot.costCenters.map((item) => item.id),
      kamIds: activeKams.map((item) => item.id),
      ...flags,
    };
  }

  if (user.role === "tecnico_ti") {
    const seesAll = directCostCenters.length === 0;
    return {
      userId: user.id,
      role: user.role,
      seesAllIncidents: seesAll,
      costCenterIds: seesAll ? snapshot.costCenters.map((item) => item.id) : directCostCenters,
      kamIds: activeKams.map((item) => item.id),
      ...flags,
    };
  }

  if (user.role === "gerente") {
    const kamIds = activeKams.filter((item) => item.managerId === user.id).map((item) => item.id);
    const kamCostCenters = snapshot.assignments
      .filter((item) => kamIds.includes(item.kamId))
      .map((item) => item.costCenterId);
    return {
      userId: user.id,
      role: user.role,
      seesAllIncidents: false,
      costCenterIds: unique([...directCostCenters, ...kamCostCenters]),
      kamIds,
      ...flags,
    };
  }

  const costCenterIds = unique(
    snapshot.assignments.filter((item) => item.kamId === user.id).map((item) => item.costCenterId),
  );

  return {
    userId: user.id,
    role: user.role,
    seesAllIncidents: false,
    costCenterIds,
    kamIds: [user.id],
    ...flags,
  };
}

/** Interseca filtros de UI con el alcance real. Evita consultar CC o KAM ajenos. */
export function constrainFilters(filters: IncidentFilters, scope: AccessScope): IncidentFilters {
  const next = { ...filters };
  if (next.costCenterId && !scope.costCenterIds.includes(next.costCenterId)) {
    next.costCenterId = "";
  }
  if (next.kamId && !scope.kamIds.includes(next.kamId)) {
    next.kamId = "";
  }
  return next;
}

export function costCentersForKam(kamId: string, snapshot: OrganizationSnapshot): string[] {
  return snapshot.assignments.filter((item) => item.kamId === kamId).map((item) => item.costCenterId);
}
