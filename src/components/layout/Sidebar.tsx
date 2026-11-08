import { ChefHat, LogOut, UserRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { FUTURE_NAV, MAIN_NAV, canSee, type NavItem } from '@/routes/navigation'
import { roleLabel } from '@/utils/format'

function SidebarLink({ item, soon = false, onNavigate }: { item: NavItem; soon?: boolean; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-brand-600 font-medium text-white'
            : soon
              ? 'text-gray-400 hover:bg-sidebar-hover hover:text-gray-200'
              : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
        }`
      }
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {soon && <span className="rounded bg-sidebar-line px-1.5 py-0.5 text-[11px] text-gray-400">Soon</span>}
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null
  const items = MAIN_NAV.filter((item) => canSee(item, user.role))

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-gray-200 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-line px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ChefHat className="size-[18px]" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">KitchenPulse</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-md p-1 text-gray-400 hover:bg-sidebar-hover hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {items.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={onClose} />
            ))}
          </div>
          <div>
            <p className="mb-1.5 px-3 text-xs text-gray-500">Coming soon</p>
            <div className="space-y-1">
              {FUTURE_NAV.map((item) => (
                <SidebarLink key={item.to} item={item} soon onNavigate={onClose} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-sidebar-line p-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-sidebar-hover' : 'hover:bg-sidebar-hover'}`
            }
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-line text-gray-300">
              <UserRound className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{roleLabel(user.role)}</p>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover hover:text-white"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
