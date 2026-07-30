"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { trpc } from "@/components/providers"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface InvoiceSpot {
  id: string
  label: string
  price: number
}

interface InquiryInvoiceDialogProps {
  inquiry: {
    id: string
    name: string | null
    businessName: string
    email: string | null
    phone: string | null
    businessCategory: string | null
    websiteOrFacebook: string | null
    campaign: {
      name: string
      spots: InvoiceSpot[]
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceSent: () => void
}

export default function InquiryInvoiceDialog({
  inquiry,
  open,
  onOpenChange,
  onInvoiceSent,
}: InquiryInvoiceDialogProps) {
  const availableSpots = inquiry.campaign.spots
  const [spotId, setSpotId] = useState(availableSpots[0]?.id || "")
  const [categoryId, setCategoryId] = useState("")
  const [amountDollars, setAmountDollars] = useState(
    availableSpots[0] ? String(availableSpots[0].price / 100) : ""
  )
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<{ orderId: string; paymentLink: string } | null>(null)

  const createInvoice = trpc.order.createInvoice.useMutation()
  const { data: categories, isLoading: categoriesLoading } = trpc.category.list.useQuery()
  const selectedSpot = availableSpots.find((spot) => spot.id === spotId)

  useEffect(() => {
    if (categoryId || !categories?.length) return

    const inquiryCategory = inquiry.businessCategory?.trim().toLowerCase()
    const matchingCategory = categories.find(
      (category) => category.name.trim().toLowerCase() === inquiryCategory
    )
    setCategoryId(matchingCategory?.id || categories[0].id)
  }, [categories, categoryId, inquiry.businessCategory])

  const handleSpotChange = (nextSpotId: string) => {
    const nextSpot = availableSpots.find((spot) => spot.id === nextSpotId)
    setSpotId(nextSpotId)
    if (nextSpot) setAmountDollars(String(nextSpot.price / 100))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selectedSpot || !categoryId || !inquiry.email || !inquiry.phone) {
      setError("An email, phone number, open placement, and business category are required to send an invoice.")
      return
    }

    const amount = Math.round(Number(amountDollars) * 100)
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid invoice amount.")
      return
    }

    try {
      const result = await createInvoice.mutateAsync({
        spotId: selectedSpot.id,
        categoryId,
        contactName: inquiry.name || inquiry.businessName,
        businessName: inquiry.businessName,
        email: inquiry.email,
        phone: inquiry.phone,
        website: inquiry.websiteOrFacebook || undefined,
        amount,
        notes: `Invoice sent from campaign inquiry ${inquiry.id}.`,
      })
      setInvoice(result)
      onInvoiceSent()
    } catch (err) {
      console.error("[INQUIRY INVOICE ERROR]:", err)
      setError(err instanceof Error ? err.message : "Unable to send the invoice. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white border-2 border-[#211D1C] rounded-none p-6 font-sans">
        {invoice ? (
          <div className="space-y-5">
            <DialogHeader>
              <DialogTitle>Invoice sent</DialogTitle>
              <DialogDescription>
                A payment link was emailed to {inquiry.email}. The placement is held for 24 hours.
              </DialogDescription>
            </DialogHeader>

            <div className="border border-rule bg-[#FAF8F4] p-4 space-y-2">
              <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Payment link
              </span>
              <a
                href={invoice.paymentLink}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-primary font-semibold break-all hover:underline"
              >
                {invoice.paymentLink}
              </a>
            </div>

            <DialogFooter className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/orders/${invoice.orderId}`}>View order</Link>
              </Button>
              <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Send invoice</DialogTitle>
              <DialogDescription>
                Send a 24-hour payment invoice to this inquiry&apos;s business email using the existing invoice workflow.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 border border-rule bg-[#FAF8F4] p-4 text-sm">
              <p className="font-bold text-press">{inquiry.businessName}</p>
              <p className="text-xs text-warm">{inquiry.name || "No contact name"}</p>
              <p className="text-xs text-warm">Invoice recipient: {inquiry.email || "No email provided"}</p>
            </div>

            {availableSpots.length === 0 ? (
              <p className="border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                This campaign has no open placements available for an invoice.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="invoice-spot" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                    Placement
                  </label>
                  <select
                    id="invoice-spot"
                    value={spotId}
                    onChange={(event) => handleSpotChange(event.target.value)}
                    className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {availableSpots.map((spot) => (
                      <option key={spot.id} value={spot.id}>
                        {spot.label} ({formatPrice(spot.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invoice-category" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                    Business category
                  </label>
                  <select
                    id="invoice-category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    disabled={categoriesLoading || !categories?.length}
                    className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {!categories?.length ? (
                      <option value="">No active categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))
                    )}
                  </select>
                  <p className="text-[11px] text-warm">
                    This is assigned for the invoice; it does not lock the placement to that category.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="invoice-amount" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                    Invoice amount
                  </label>
                  <Input
                    id="invoice-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountDollars}
                    onChange={(event) => setAmountDollars(event.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!inquiry.email || !inquiry.phone || !selectedSpot || !categoryId || createInvoice.isPending}
              >
                {createInvoice.isPending ? "Sending..." : "Send invoice"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
