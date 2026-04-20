/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions for each coordinator role
 */

export type CoordinatorRole = 
  | "project_manager"
  | "finance"
  | "sponsorship"
  | "admin"
  | "logistics"
  | "marketing";

export type Permission = 
  | "view_budget"
  | "edit_budget"
  | "view_expenses"
  | "edit_expenses"
  | "view_sponsors"
  | "edit_sponsors"
  | "view_employers"
  | "edit_employers"
  | "view_booth_layout"
  | "edit_booth_layout"
  | "view_event_info"
  | "edit_event_info"
  | "manage_coordinators"
  | "send_notifications"
  | "view_reports"
  | "export_data"
  | "view_logistics"
  | "edit_logistics"
  | "view_marketing"
  | "edit_marketing";

/**
 * Role-to-Permissions mapping
 * Each role has a set of permissions it can perform
 */
export const rolePermissions: Record<CoordinatorRole, Permission[]> = {
  project_manager: [
    // Full access to everything
    "view_budget",
    "edit_budget",
    "view_expenses",
    "edit_expenses",
    "view_sponsors",
    "edit_sponsors",
    "view_employers",
    "edit_employers",
    "view_booth_layout",
    "edit_booth_layout",
    "view_event_info",
    "edit_event_info",
    "manage_coordinators",
    "send_notifications",
    "view_reports",
    "export_data",
    "view_logistics",
    "edit_logistics",
    "view_marketing",
    "edit_marketing",
  ],
  
  finance: [
    // Budget and financial data only
    "view_budget",
    "edit_budget",
    "view_expenses",
    "edit_expenses",
    "view_sponsors",
    "view_employers", // Can see employer booth prices
    "view_event_info",
    "view_reports",
    "export_data",
  ],
  
  sponsorship: [
    // Sponsor management and employer database
    "view_sponsors",
    "edit_sponsors",
    "view_employers", // Full employer database access
    "view_event_info",
    "send_notifications",
    "view_reports",
    "export_data",
  ],
  
  admin: [
    // Event administration and employer registration
    "view_event_info",
    "edit_event_info",
    "view_employers",
    "edit_employers",
    "view_booth_layout",
    "send_notifications",
    "view_reports",
    "export_data",
  ],
  
  logistics: [
    // Venue and booth layout management
    "view_booth_layout",
    "edit_booth_layout",
    "view_event_info",
    "view_logistics",
    "edit_logistics",
    "view_employers", // Can see employer booth needs
    "view_reports",
  ],
  
  marketing: [
    // Marketing and employer database
    "view_marketing",
    "edit_marketing",
    "view_employers", // Full employer database access
    "view_event_info",
    "send_notifications",
    "view_reports",
    "export_data",
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: CoordinatorRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: CoordinatorRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Check if a role can perform multiple permissions
 */
export function hasAllPermissions(role: CoordinatorRole, permissions: Permission[]): boolean {
  const rolePerms = rolePermissions[role] ?? [];
  return permissions.every(perm => rolePerms.includes(perm));
}

/**
 * Check if a role can perform any of the given permissions
 */
export function hasAnyPermission(role: CoordinatorRole, permissions: Permission[]): boolean {
  const rolePerms = rolePermissions[role] ?? [];
  return permissions.some(perm => rolePerms.includes(perm));
}

/**
 * Role-friendly names for display
 */
export const roleNames: Record<CoordinatorRole, string> = {
  project_manager: "Project Manager",
  finance: "Finance / Bendahara",
  sponsorship: "Sponsorship Coordinator",
  admin: "Admin / Kesekertariatan",
  logistics: "Logistics Coordinator",
  marketing: "Marketing Coordinator",
};

/**
 * Role descriptions
 */
export const roleDescriptions: Record<CoordinatorRole, string> = {
  project_manager: "Full access to all event features and coordinator management",
  finance: "Budget planning, expense tracking, and financial analysis",
  sponsorship: "Sponsorship management and employer database access",
  admin: "Event administration, employer registration, and notifications",
  logistics: "Venue management, booth layout, and resource coordination",
  marketing: "Marketing budget and employer outreach",
};
