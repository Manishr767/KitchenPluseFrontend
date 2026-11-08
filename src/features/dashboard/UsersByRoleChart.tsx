import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ROLES, type User } from '@/types'
import { roleLabel } from '@/utils/format'

export default function UsersByRoleChart({ users }: { users: User[] }) {
  const data = ROLES.map((role) => ({
    role: roleLabel(role),
    users: users.filter((u) => u.role === role).length,
  }))

  return (
    <div className="h-64" role="img" aria-label="Number of users per role">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="role"
            width={120}
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: '#f3f4f6' }} />
          <Bar dataKey="users" name="Users" fill="#2f9e5f" radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
