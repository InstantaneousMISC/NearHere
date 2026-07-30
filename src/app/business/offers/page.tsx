"use client"

import { FormEvent, useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Offer = {
  id: string
  title: string
  details: string
  expiresAt: Date | string | null
  isActive: boolean
}

function dateInputValue(value: Date | string | null) {
  if (!value) return ""
  return new Date(value).toISOString().slice(0, 10)
}

export default function BusinessOffersPage() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [expiresOn, setExpiresOn] = useState("")

  const { data: offers, isLoading, refetch } = trpc.business.listMyOffers.useQuery(undefined, {
    staleTime: 30_000,
  })
  const saveOffer = trpc.business.saveMyOffer.useMutation()
  const setOfferActive = trpc.business.setMyOfferActive.useMutation()

  const resetForm = () => {
    setEditingId(null)
    setTitle("")
    setDetails("")
    setExpiresOn("")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await saveOffer.mutateAsync({
        ...(editingId ? { id: editingId } : {}),
        title,
        details,
        expiresOn: expiresOn || null,
      })
      resetForm()
      refetch()
    } catch (error: any) {
      alert(error.message || "Unable to save this offer.")
    }
  }

  const startEditing = (offer: Offer) => {
    setEditingId(offer.id)
    setTitle(offer.title)
    setDetails(offer.details)
    setExpiresOn(dateInputValue(offer.expiresAt))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const toggleOffer = async (offer: Offer) => {
    try {
      await setOfferActive.mutateAsync({ id: offer.id, isActive: !offer.isActive })
      refetch()
    } catch (error: any) {
      alert(error.message || "Unable to update this offer.")
    }
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <p className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-primary">Public profile content</p>
        <h1 className="mt-1 font-headline text-3xl font-black uppercase tracking-tight text-press">Custom offers</h1>
        <p className="mt-2 max-w-2xl text-sm text-warm">
          Create offers customers can see on your public business profile. Active offers appear immediately; set an expiration date when the deal is time-sensitive.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit offer" : "Add an offer"}</CardTitle>
          <CardDescription>Use clear terms and include any important restrictions in the offer details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="offer-title" className="text-xs font-mono font-bold uppercase tracking-wider text-warm">Offer title</label>
              <Input id="offer-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required placeholder="e.g. $25 off your first service" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="offer-details" className="text-xs font-mono font-bold uppercase tracking-wider text-warm">Details and restrictions</label>
              <Textarea id="offer-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={500} required placeholder="Describe what is included, who is eligible, and any exclusions." />
              <p className="text-right text-[10px] text-warm">{details.length}/500</p>
            </div>
            <div className="max-w-xs space-y-1.5">
              <label htmlFor="offer-expiration" className="text-xs font-mono font-bold uppercase tracking-wider text-warm">Expiration date (optional)</label>
              <Input id="offer-expiration" type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saveOffer.isPending} className="font-headline text-xs font-bold uppercase tracking-wider">
                {saveOffer.isPending ? "Saving..." : editingId ? "Save offer" : "Publish offer"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={saveOffer.isPending} className="text-xs font-bold uppercase tracking-wider">
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your offers</CardTitle>
          <CardDescription>Paused and expired offers stay here for your records but are hidden from your public profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-warm">Loading offers...</p>
          ) : offers?.length ? (
            offers.map((offer) => {
              const expired = !!offer.expiresAt && new Date(offer.expiresAt) < new Date()
              return (
                <div key={offer.id} className="border border-border bg-background/40 p-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-headline text-lg font-black uppercase tracking-tight text-press">{offer.title}</h2>
                        <Badge variant={offer.isActive && !expired ? "success" : "secondary"}>{offer.isActive && !expired ? "Live" : expired ? "Expired" : "Paused"}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-warm whitespace-pre-wrap">{offer.details}</p>
                      {offer.expiresAt && <p className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Expires {formatDate(offer.expiresAt)}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEditing(offer)} className="text-[10px] font-bold uppercase tracking-wider">Edit</Button>
                      <Button type="button" size="sm" variant={offer.isActive ? "outline" : "default"} disabled={setOfferActive.isPending} onClick={() => toggleOffer(offer)} className="text-[10px] font-bold uppercase tracking-wider">
                        {offer.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-warm">No custom offers yet. Add one above to show it on your profile.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
