import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Carrot,
  Ruler,
  Store,
  Truck,
  Users,
  Warehouse,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

/** Roles allowed to call GET /api/branches (list). BRANCH_STAFF may only read their own branch. */
export const BRANCH_LIST_ROLES: Role[] = ['ADMIN', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER']
export const ADMIN_ONLY: Role[] = ['ADMIN']

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Undefined = every authenticated role. */
  roles?: Role[]
}

export const MAIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/branches', label: 'Branches', icon: Store, roles: BRANCH_LIST_ROLES },
  { to: '/my-branch', label: 'My branch', icon: Store, roles: ['BRANCH_STAFF'] },
  { to: '/stock-counting', label: 'Stock counting', icon: ClipboardCheck, roles: ['BRANCH_STAFF'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['ADMIN', 'BRANCH_STAFF', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'] },
  { to: '/requests', label: 'Ingredient requests', icon: ClipboardList, roles: ['ADMIN', 'BRANCH_STAFF', 'CENTRAL_OFFICE_STAFF', 'WAREHOUSE_MANAGER'] },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, roles: ['ADMIN', 'CENTRAL_OFFICE_STAFF'] },
  { to: '/ingredients', label: 'Ingredients', icon: Carrot },
  { to: '/units', label: 'Units', icon: Ruler },
  { to: '/users', label: 'Users', icon: Users, roles: ADMIN_ONLY },
]

export interface FutureModule extends NavItem {
  description: string
}

// These modules remain placeholders until their corresponding backend APIs are implemented.
export const FUTURE_NAV: FutureModule[] = [
  { to: '/warehouse', label: 'Warehouse', icon: Warehouse, description: 'The warehouse will prepare and dispatch approved orders here.' },
  { to: '/deliveries', label: 'Deliveries', icon: Truck, description: 'Drivers will update delivery progress and branches will track it here.' },
]

export function canSee(item: NavItem, role: Role): boolean {
  return !item.roles || item.roles.includes(role)
}
