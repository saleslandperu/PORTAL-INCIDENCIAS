import { seedAssignments, seedCostCenters, seedUsers } from "../data/organization";
import type { AppUser, CostCenterAssignment, CostCenterRecord, RecordStatus } from "../types/organization";

export interface OrganizationSnapshot {
  users: AppUser[];
  costCenters: CostCenterRecord[];
  assignments: CostCenterAssignment[];
  revision: number;
}

let users = seedUsers.map((item) => ({ ...item }));
let costCenters = seedCostCenters.map((item) => ({ ...item }));
let assignments = seedAssignments.map((item) => ({ ...item }));
let revision = 0;

const listeners = new Set<() => void>();

function cloneSnapshot(): OrganizationSnapshot {
  return {
    users: users.map((item) => ({ ...item })),
    costCenters: costCenters.map((item) => ({ ...item })),
    assignments: assignments.map((item) => ({ ...item })),
    revision,
  };
}

let cachedSnapshot = cloneSnapshot();

function emit() {
  revision += 1;
  cachedSnapshot = cloneSnapshot();
  listeners.forEach((listener) => listener());
}

function assertUniqueUser(username: string, email: string, ignoreId?: string) {
  const usernameTaken = users.some(
    (item) => item.username.toLowerCase() === username.toLowerCase() && item.id !== ignoreId,
  );
  const emailTaken = users.some((item) => item.email.toLowerCase() === email.toLowerCase() && item.id !== ignoreId);
  if (usernameTaken) throw new Error("Ya existe un usuario con ese nombre de cuenta.");
  if (emailTaken) throw new Error("Ya existe un usuario con ese correo corporativo.");
}

function assertUniqueCostCenter(code: string, ignoreId?: string) {
  const taken = costCenters.some((item) => item.code.toLowerCase() === code.toLowerCase() && item.id !== ignoreId);
  if (taken) throw new Error("Ya existe un centro de costo con ese código.");
}

export const organizationStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getSnapshot(): OrganizationSnapshot {
    return cachedSnapshot;
  },

  getUserById(id: string) {
    return users.find((item) => item.id === id);
  },

  replaceFromDirectory(input: {
    users: AppUser[];
    costCenters: CostCenterRecord[];
    assignments: CostCenterAssignment[];
  }) {
    users = input.users.map((item) => ({ ...item }));
    costCenters = input.costCenters.map((item) => ({ ...item }));
    assignments = input.assignments.map((item) => ({ ...item }));
    emit();
  },

  upsertUser(input: Omit<AppUser, "id"> & { id?: string }, costCenterIds: string[] = []) {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!fullName || !username || !email) throw new Error("Nombre, usuario y correo son obligatorios.");
    if (input.role === "kam" && !input.managerId) throw new Error("Un KAM debe tener un gerente responsable.");
    if ((input.role === "kam" || input.role === "gerente") && costCenterIds.length === 0) {
      throw new Error("Debe asignar al menos un centro de costo.");
    }
    if (input.role !== "kam" && input.managerId) {
      throw new Error("Solo los KAM se asocian a un gerente responsable.");
    }

    assertUniqueUser(username, email, input.id);

    const record: AppUser = {
      id: input.id ?? `u-${crypto.randomUUID()}`,
      fullName,
      username,
      email,
      role: input.role,
      status: input.status,
      managerId: input.role === "kam" ? input.managerId : undefined,
      permissions: input.permissions,
    };

    if (input.id) {
      users = users.map((item) => (item.id === input.id ? record : item));
    } else {
      users = [...users, record];
    }

    assignments = assignments.filter((item) => item.kamId !== record.id);
    assignments = [
      ...assignments,
      ...costCenterIds.map((costCenterId) => ({ kamId: record.id, costCenterId })),
    ];

    emit();
    return record;
  },

  setUserStatus(id: string, status: RecordStatus) {
    const current = users.find((item) => item.id === id);
    if (!current) throw new Error("Usuario no encontrado.");
    users = users.map((item) => (item.id === id ? { ...item, status } : item));
    emit();
  },

  upsertCostCenter(input: Omit<CostCenterRecord, "id"> & { id?: string }, kamIds: string[] = []) {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim();
    if (!code || !name) throw new Error("El código y el nombre del centro de costo son obligatorios.");
    assertUniqueCostCenter(code, input.id);

    const record: CostCenterRecord = {
      id: input.id ?? code,
      code,
      name,
      description: input.description.trim(),
      status: input.status,
    };

    if (input.id) {
      costCenters = costCenters.map((item) => (item.id === input.id ? record : item));
      assignments = assignments.filter((item) => item.costCenterId !== record.id);
    } else {
      costCenters = [...costCenters, record];
    }

    const validKamIds = kamIds.filter((kamId) => users.some((user) => user.id === kamId && user.role === "kam"));
    assignments = [
      ...assignments.filter((item) => item.costCenterId !== record.id),
      ...validKamIds.map((kamId) => ({ kamId, costCenterId: record.id })),
    ];

    emit();
    return record;
  },

  setCostCenterStatus(id: string, status: RecordStatus) {
    const current = costCenters.find((item) => item.id === id);
    if (!current) throw new Error("Centro de costo no encontrado.");
    costCenters = costCenters.map((item) => (item.id === id ? { ...item, status } : item));
    emit();
  },
};
