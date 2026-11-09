import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '@/api/errors'
import { listIngredients } from '@/api/ingredients.api'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/common/useToast'
import { formatDateTime } from '@/utils/format'
import { useDispatchWarehouseRequest, useWarehouseApprovedRequests, useWarehouseDispatches } from './queries'

export function WarehousePage() {
 const toast=useToast(), requests=useWarehouseApprovedRequests(), history=useWarehouseDispatches(), dispatch=useDispatchWarehouseRequest()
 const [quantities,setQuantities]=useState<Record<string,string>>({}),[notes,setNotes]=useState<Record<number,string>>({})
 const ingredients=useQuery({queryKey:['warehouse','active-ingredients'],queryFn:async()=>{const first=await listIngredients({active:true,page:0,size:100,sort:'name,asc'});const all=[...first.content];for(let p=1;p<first.totalPages;p++)all.push(...(await listIngredients({active:true,page:p,size:100,sort:'name,asc'})).content);return all}})
 const byId=useMemo(()=>new Map((ingredients.data??[]).map(i=>[i.id,i])),[ingredients.data])
 async function submit(id:number,lines:{ingredientId:number;approvedQuantity:number|null}[]){
  const items=lines.filter(x=>(x.approvedQuantity??0)>0).map(x=>({ingredientId:x.ingredientId,dispatchedQuantity:Number(quantities[`${id}:${x.ingredientId}`]??(x.approvedQuantity??0))}))
  if(!items.length||items.some(x=>!Number.isFinite(x.dispatchedQuantity)||x.dispatchedQuantity<=0||x.dispatchedQuantity>(lines.find(y=>y.ingredientId===x.ingredientId)?.approvedQuantity??0)||!/^\d{1,12}(\.\d{1,3})?$/.test(String(quantities[`${id}:${x.ingredientId}`]??lines.find(y=>y.ingredientId===x.ingredientId)?.approvedQuantity)))){
   toast.error('Enter valid dispatch quantities, no greater than the approved amounts.');return
  }
  try{const result=await dispatch.mutateAsync({id,body:{items,note:notes[id]?.trim()||undefined}});toast.success(`Request #${result.ingredientRequestId} dispatched.`)}
  catch(error){toast.error(errorMessage(error))}
 }
 return <div>
  <PageHeader title="Warehouse" description="Prepare approved branch requests and record the quantities dispatched to delivery."/>
  {requests.isLoading||history.isLoading||ingredients.isLoading?<Card><p className="text-sm text-gray-500">Loading warehouse queue…</p></Card>
  :requests.isError?<Card><p className="text-sm text-red-700">{errorMessage(requests.error)}</p><Button className="mt-3" variant="secondary" onClick={()=>requests.refetch()}>Try again</Button></Card>
  :history.isError?<Card><p className="text-sm text-red-700">{errorMessage(history.error)}</p><Button className="mt-3" variant="secondary" onClick={()=>history.refetch()}>Try again</Button></Card>
  :ingredients.isError?<Card><p className="text-sm text-red-700">{errorMessage(ingredients.error)}</p></Card>:<>
   <div className="mb-5 grid gap-4 sm:grid-cols-2"><Card><p className="text-sm text-gray-500">Ready to prepare</p><p className="mt-1 text-2xl font-semibold">{requests.data?.length??0}</p></Card><Card><p className="text-sm text-gray-500">Dispatched requests</p><p className="mt-1 text-2xl font-semibold">{history.data?.length??0}</p></Card></div>
   <div className="space-y-4">{(requests.data??[]).length===0?<Card title="Preparation queue"><p className="text-sm text-gray-600">No approved requests are waiting for warehouse preparation.</p></Card>:requests.data?.map(request=>{
    const approved=request.items.filter(i=>(i.approvedQuantity??0)>0)
    return <Card key={request.id} title={`Request #${request.id} · Branch #${request.branchId}`} description={`Approved ${request.reviewedAt?formatDateTime(request.reviewedAt):'—'} · ${request.status.replaceAll('_',' ')}`}>
     <div className="space-y-3">{approved.map(item=>{const ingredient=byId.get(item.ingredientId),key=`${request.id}:${item.ingredientId}`;return <div key={item.id} className="grid grid-cols-1 gap-2 border-b border-gray-100 pb-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium text-gray-900">{ingredient?.name??`Ingredient #${item.ingredientId}`}</p><p className="text-xs text-gray-500">Approved: {item.approvedQuantity} {ingredient?.stockUnit.symbol??''}</p></div><label className="text-sm text-gray-600" htmlFor={`dispatch-${key}`}>Prepared quantity</label><div className="flex items-center gap-2"><input id={`dispatch-${key}`} aria-label={`${ingredient?.name??`Ingredient ${item.ingredientId}`} dispatched quantity`} type="number" min="0.001" max={item.approvedQuantity??undefined} step="0.001" value={quantities[key]??String(item.approvedQuantity)} onChange={e=>setQuantities(c=>({...c,[key]:e.target.value}))} className="h-10 w-32 rounded-lg border border-gray-300 px-3 text-sm"/><span className="text-xs text-gray-500">{ingredient?.stockUnit.symbol??''}</span></div></div>})}
      <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`warehouse-note-${request.id}`}>Dispatch note (optional)</label><textarea id={`warehouse-note-${request.id}`} rows={2} maxLength={1000} value={notes[request.id]??''} onChange={e=>setNotes(c=>({...c,[request.id]:e.target.value}))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Packing or dispatch details"/></div>
      <div className="flex justify-end"><Button loading={dispatch.isPending} disabled={dispatch.isPending||approved.length===0} onClick={()=>submit(request.id,approved)}>Confirm dispatch</Button></div>
     </div>
    </Card>
   })}</div>
   {(history.data??[]).length>0&&<div className="mt-7"><h2 className="mb-3 text-lg font-semibold text-gray-900">Dispatch history</h2><div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Dispatch</th><th className="px-4 py-3">Request</th><th className="px-4 py-3">Dispatched</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Note</th></tr></thead><tbody className="divide-y divide-gray-100">{history.data?.map(d=><tr key={d.id}><td className="px-4 py-3 font-medium">#{d.id}</td><td className="px-4 py-3">#{d.ingredientRequestId}</td><td className="px-4 py-3">{formatDateTime(d.dispatchedAt)}</td><td className="px-4 py-3">{d.items.length}</td><td className="px-4 py-3">{d.note??'—'}</td></tr>)}</tbody></table></div></div>}
  </>}
 </div>
}
