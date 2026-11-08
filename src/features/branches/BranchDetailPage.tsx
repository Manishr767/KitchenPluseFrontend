import { useParams } from 'react-router-dom'
import { ErrorState } from '@/components/common/States'
import { BranchDetail } from './BranchDetail'

export function BranchDetailPage() {
  const id = Number(useParams().id)
  if (!Number.isInteger(id) || id <= 0) return <ErrorState error={new Error('That branch link isn’t valid.')} />
  return <BranchDetail id={id} showBack />
}
