import type { AppUser, CostCenterAssignment, CostCenterRecord, RecordStatus, UserRole } from "../types/organization";
import { api } from "./api";
import { organizationStore } from "./organizationStore";

interface DirectoryUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: RecordStatus;
  managerId?: string | null;
  costCenterIds?: string[];
}

interface DirectoryCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: RecordStatus;
  assigneeIds?: string[];
}

export async function refreshDirectory() {
  const payload = await api<{ users: DirectoryUser[]; costCenters: DirectoryCenter[] }>("/api/directory");
  const users: AppUser[] = payload.users.map((item) => ({
    id: item.id,
    fullName: item.fullName,
    username: item.username,
    email: item.email,
    role: item.role,
    status: item.status,
    managerId: item.managerId ?? undefined,
  }));
  const costCenters: CostCenterRecord[] = payload.costCenters.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description ?? "",
    status: item.status,
  }));
  const assignments: CostCenterAssignment[] = [];
  for (const center of payload.costCenters) {
    for (const userId of center.assigneeIds ?? []) {
      assignments.push({ kamId: userId, costCenterId: center.id });
    }
  }
  organizationStore.replaceFromDirectory({ users, costCenters, assignments });
}

export async function saveUser(input: {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: RecordStatus;
  managerId?: string;
  costCenterIds: string[];
  password?: string;
}) {
  const body = JSON.stringify({
    workerCode: undefined,
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    role: input.role,
    status: input.status,
    managerId: input.managerId,
    costCenterIds: input.costCenterIds,
    password: input.password,
  });
  if (input.id) {
    await api(`/api/users/${input.id}`, { method: "PUT", body });
  } else {
    await api("/api/users", { method: "POST", body });
  }
  await refreshDirectory();
}

export async function patchUserStatus(id: string, status: RecordStatus) {
  await api(`/api/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  await refreshDirectory();
}

export async function saveCostCenter(input: {
  id?: string;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
  kamIds: string[];
}) {
  const body = JSON.stringify(input);
  if (input.id) {
    await api(`/api/cost-centers/${input.id}`, { method: "PUT", body });
  } else {
    await api("/api/cost-centers", { method: "POST", body });
  }
  await refreshDirectory();
}

export async function patchCostCenterStatus(id: string, status: RecordStatus) {
  await api(`/api/cost-centers/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  await refreshDirectory();
}

export interface ProfileRecord {
  id: string;
  locked: boolean;
  permissionIds: string[];
}

export async function fetchProfiles() {
  return api<{
    groups: { id: string; label: string; items: { id: string; label: string }[] }[];
    profiles: ProfileRecord[];
  }>("/api/profiles");
}

export async function saveProfilePermissions(roleId: string, permissionIds: string[]) {
  return api<{ profile: ProfileRecord; profiles: ProfileRecord[] }>(`/api/profiles/${roleId}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissionIds }),
  });
}
