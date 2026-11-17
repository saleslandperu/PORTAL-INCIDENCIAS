import type { AppUser, CostCenterAssignment, CostCenterRecord } from "../types/organization";

/**
 * Datos organizacionales ficticios para la demostración.
 * No hay contraseñas en este archivo: el prototipo compara un hash SHA-256
 * en memoria (ver authService). En producción esto vivirá en el servidor.
 */
export const seedUsers: AppUser[] = [
  {
    id: "u-admin",
    fullName: "Laura Méndez",
    username: "admin.ti",
    email: "laura.mendez@empresa-demo.local",
    role: "admin_ti",
    status: "activo",
  },
  {
    id: "u-ger-n",
    fullName: "Ricardo Beltrán",
    username: "gerente.norte",
    email: "ricardo.beltran@empresa-demo.local",
    role: "gerente",
    status: "activo",
  },
  {
    id: "u-ger-s",
    fullName: "Carmen Ibarra",
    username: "gerente.sur",
    email: "carmen.ibarra@empresa-demo.local",
    role: "gerente",
    status: "activo",
  },
  {
    id: "u-kam-on",
    fullName: "Héctor Salazar",
    username: "kam.norte",
    email: "hector.salazar@empresa-demo.local",
    role: "kam",
    status: "activo",
    managerId: "u-ger-n",
  },
  {
    id: "u-kam-os",
    fullName: "Andrés Molina",
    username: "kam.sur",
    email: "andres.molina@empresa-demo.local",
    role: "kam",
    status: "activo",
    managerId: "u-ger-s",
  },
  {
    id: "u-kam-com",
    fullName: "Rosa Méndez",
    username: "kam.comercial",
    email: "rosa.mendez@empresa-demo.local",
    role: "kam",
    status: "activo",
    managerId: "u-ger-n",
  },
  {
    id: "u-kam-af",
    fullName: "Elena Navarro",
    username: "kam.adminfin",
    email: "elena.navarro@empresa-demo.local",
    role: "kam",
    status: "activo",
    managerId: "u-ger-s",
  },
  {
    id: "u-kam-rh",
    fullName: "Lucía Andrade",
    username: "kam.rrhh",
    email: "lucia.andrade@empresa-demo.local",
    role: "kam",
    status: "activo",
    managerId: "u-ger-s",
  },
  {
    id: "u-tec",
    fullName: "Marcos Vidal",
    username: "tecnico.mesa",
    email: "marcos.vidal@empresa-demo.local",
    role: "tecnico_ti",
    status: "activo",
  },
  {
    id: "u-consulta",
    fullName: "Ana Quiroz",
    username: "consulta.ti",
    email: "ana.quiroz@empresa-demo.local",
    role: "consulta",
    status: "activo",
  },
];

export const seedCostCenters: CostCenterRecord[] = [
  { id: "CC-110", code: "CC-110", name: "Administración", description: "Gestión administrativa corporativa", status: "activo" },
  { id: "CC-120", code: "CC-120", name: "Finanzas", description: "Contabilidad y tesorería", status: "activo" },
  { id: "CC-210", code: "CC-210", name: "Operaciones Norte", description: "Operación de la zona norte", status: "activo" },
  { id: "CC-220", code: "CC-220", name: "Operaciones Sur", description: "Operación de la zona sur", status: "activo" },
  { id: "CC-310", code: "CC-310", name: "Logística", description: "Almacén, patio y despacho", status: "activo" },
  { id: "CC-410", code: "CC-410", name: "Comercial", description: "Fuerza comercial y cotizaciones", status: "activo" },
  { id: "CC-510", code: "CC-510", name: "Recursos Humanos", description: "Personas y onboarding", status: "activo" },
];

export const seedAssignments: CostCenterAssignment[] = [
  { kamId: "u-kam-af", costCenterId: "CC-110" },
  { kamId: "u-kam-af", costCenterId: "CC-120" },
  { kamId: "u-kam-on", costCenterId: "CC-210" },
  { kamId: "u-kam-on", costCenterId: "CC-310" },
  { kamId: "u-kam-os", costCenterId: "CC-220" },
  { kamId: "u-kam-com", costCenterId: "CC-410" },
  { kamId: "u-kam-rh", costCenterId: "CC-510" },
];
