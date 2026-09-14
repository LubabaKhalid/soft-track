import { FilterBar } from '@/board/FilterBar'
import { toQueryParams } from '@/board/filters'
import { AXIOS_INSTANCE } from '@/api/client'
import { useState } from 'react'
import type { BoardFilters } from '@/board/filters'
import type { BoardView } from '@/keyboard/useCommands'
import { NotificationsBell } from '@/notifications/NotificationsBell'
import { useTeamContext } from '@/team/TeamContext'
import { Icon, type IconName } from '@/ui/Icon'

const VIEWS: Array<{ id: BoardView; label: string; icon: IconName }> = [
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'list', label: 'List', icon: 'list' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
]

export function TopBar({
  view,
  onViewChange,
  onNewIssue,
  onOpenSidebar,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onSaveView,
  canSaveView,
  notificationsOpen,
  onToggleNotifications,
  onCloseNotifications,
}: {
  view: BoardView
  onViewChange: (view: BoardView) => void
  onNewIssue: () => void
  onOpenSidebar: () => void
  search: string
  onSearchChange: (value: string) => void
  filters: BoardFilters
  onFiltersChange: (filters: BoardFilters) => void
  onSaveView: () => void
  /** False while these filters already match a saved view. */
  canSaveView: boolean
  notificationsOpen: boolean
  onToggleNotifications: () => void
  onCloseNotifications: () => void
}) {
  const { team } = useTeamContext()

  return (
    <header className="glass flex flex-wrap items-center gap-2 rounded-panel px-3 py-2">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="btn btn-ghost btn-icon btn-sm lg:hidden"
        aria-label="Open navigation"
      >
        <Icon name="menu" size={16} />
      </button>

      <h1 className="mr-1 truncate text-sm font-semibold tracking-tight text-neutral-900">
        {team.name}
      </h1>

      <div className="segmented" role="tablist" aria-label="View">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            data-active={view === item.id}
            onClick={() => onViewChange(item.id)}
            className="segmented-item"
          >
            <Icon name={item.icon} size={13} />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onChange={onFiltersChange}
        onSave={onSaveView}
        canSave={canSaveView}
      />

      <div className="ml-auto flex items-center gap-2">
        <label className="relative block">
          <span className="sr-only">Search issues</span>
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search issues…"
            className="field field-sm w-40 rounded-full pl-8 pr-8 sm:w-56 [&::-webkit-search-cancel-button]:hidden"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-800"
            >
              <Icon name="close" size={13} />
            </button>
          ) : (
            <kbd className="kbd pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 sm:inline-flex">
              /
            </kbd>
          )}
        </label>

        <NotificationsBell
          open={notificationsOpen}
          onToggle={onToggleNotifications}
          onClose={onCloseNotifications}
        />

        <ExportCsvButton filters={filters} />

        <button type="button" onClick={onNewIssue} className="btn btn-primary">
          <Icon name="plus" size={14} strokeWidth={2.2} />
          <span className="hidden sm:inline">New issue</span>
        </button>
      </div>
    </header>
  )
}

function ExportCsvButton({ filters }: { filters: any }) {
  const { team } = useTeamContext()
  const [loading, setLoading] = useState(false)

  const doExport = async () => {
    if (!team) return
    setLoading(true)
    try {
      const qp = toQueryParams(filters)
      const params = new URLSearchParams()
      Object.entries(qp).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.set(k, String(v))
      })
      const url = `/teams/${team.id}/issues/export?${params.toString()}`
      const resp = await AXIOS_INSTANCE.get(url, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(resp.data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = 'issues.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={doExport}
      className="btn btn-ghost btn-sm"
      disabled={loading}
      aria-disabled={loading}
    >
      <Icon name="download" size={14} />
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  )
}
