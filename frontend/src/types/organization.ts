export type UserRole = "admin_ti" | "gerente" | "kam" | "tecnico_ti" | "consulta";
export type RecordStatus = "activo" | "inactivo";

export interface UserPermissions {
  /** Permiso expreso, independiente del rol. En producción lo emite el servidor. */
  canManageUsers?: boolean;
  canManageCostCenters?: boolean;
}

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: RecordStatus;
  managerId?: string;
  permissions?: UserPermissions;
  permissionIds?: string[];
}

export interface CostCenterRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
}

/** Relación N:N entre KAM y centros de costo. No duplica el CC. */
export interface CostCenterAssignment {
  kamId: string;
  costCenterId: string;
}

export interface AccessScope {
  userId: string;
  role: UserRole;
  seesAllIncidents: boolean;
  costCenterIds: string[];
  kamIds: string[];
  canManageUsers: boolean;
  canManageCostCenters: boolean;
  canManageProfiles: boolean;
  canViewDashboard: boolean;
  canViewIncidentsNav: boolean;
  canViewReports: boolean;
  canViewSettings: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canToggleUserStatus: boolean;
  permissionIds: string[];
}

export const roleLabels: Record<UserRole, string> = {
  admin_ti: "Administrador TI",
  gerente: "Gerente",
  kam: "KAM / Responsable de cuenta",
  tecnico_ti: "Técnico TI",
  consulta: "Usuario de consulta",
};
