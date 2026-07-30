"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { trpc } from "@/components/providers"
import { CampaignInquiryStatus } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import InquiryInvoiceDialog from "@/components/admin/InquiryInvoiceDialog"

interface InquiriesListProps {
  inquiries: any[]
  campaigns: any[]
  admins: any[]
  initialFilters: {
    search?: string
    status?: string
    campaignId?: string
  }
}

export default function InquiriesList({
  inquiries: initialInquiries,
  campaigns,
  admins,
  initialFilters,
}: InquiriesListProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialFilters.search || "")
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || "")
  const [campaignFilter, setCampaignFilter] = useState(initialFilters.campaignId || "")

  // Keep track of which inquiry IDs are expanded
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  // Track unsaved local internal notes by inquiry ID
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({})

  // Mutations
  const updateStatusMutation = trpc.campaignInquiry.updateStatus.useMutation()
  const updateAssignedToMutation = trpc.campaignInquiry.updateAssignedTo.useMutation()
  const updateInternalNotesMutation = trpc.campaignInquiry.updateInternalNotes.useMutation()

  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})
  const [invoiceInquiry, setInvoiceInquiry] = useState<any | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleStatusChange = async (id: string, newStatus: CampaignInquiryStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus })
      router.refresh()
    } catch (err) {
      alert("Failed to update status. Please try again.")
      console.error(err)
    }
  }

  const handleAdminChange = async (id: string, adminId: string | null) => {
    try {
      await updateAssignedToMutation.mutateAsync({
        id,
        assignedToAdminId: adminId || null,
      })
      router.refresh()
    } catch (err) {
      alert("Failed to update assigned representative. Please try again.")
      console.error(err)
    }
  }

  const handleSaveNotes = async (id: string) => {
    setSavingNotes(prev => ({ ...prev, [id]: true }))
    try {
      const notes = localNotes[id] ?? ""
      await updateInternalNotesMutation.mutateAsync({ id, internalNotes: notes })
      router.refresh()
      // Remove from modified track since it's saved
      setLocalNotes(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      alert("Failed to save notes. Please try again.")
      console.error(err)
    } finally {
      setSavingNotes(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setCampaignFilter("")
    router.push("/admin/inquiries")
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (campaignFilter && campaignFilter !== "all") params.set("campaignId", campaignFilter)
    
    router.push(`/admin/inquiries?${params.toString()}`)
  }

  // Get status color badge variant
  const getStatusBadgeVariant = (status: CampaignInquiryStatus) => {
    switch (status) {
      case "NEW": return "warning" // yellow
      case "CONTACTED": return "secondary" // gray/purple
      case "QUALIFIED": return "success" // green
      case "CONVERTED": return "success" // green
      case "NOT_INTERESTED": return "outline"
      case "FOLLOW_UP_LATER": return "outline"
      case "SPAM": return "destructive"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Form Card */}
      <Card className="p-6">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div className="space-y-1.5 md:col-span-2 text-left">
            <label htmlFor="search" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Search Business / Contact / Email
            </label>
            <Input
              id="search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="e.g. Acme plumbing, Jane, info@..."
            />
          </div>

          {/* Status filter */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="status" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Inquiry Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(CampaignInquiryStatus).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Filter */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="campaignId" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Postcard Campaign
            </label>
            <select
              id="campaignId"
              value={campaignFilter}
              onChange={e => setCampaignFilter(e.target.value)}
              className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="md:col-span-4 flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Inquiries Table Card */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="py-4 px-6">Business / Contact</TableHead>
              <TableHead className="py-4 px-6">Campaign</TableHead>
              <TableHead className="py-4 px-6">Preferred Contact</TableHead>
              <TableHead className="py-4 px-6">Assigned Rep</TableHead>
              <TableHead className="py-4 px-6">Status</TableHead>
              <TableHead className="py-4 px-6">Created</TableHead>
              <TableHead className="py-4 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialInquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-warm italic">
                  No inquiries match your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              initialInquiries.map((inquiry) => {
                const isExpanded = expandedIds[inquiry.id] || false
                const noteValue = localNotes[inquiry.id] !== undefined
                  ? localNotes[inquiry.id]
                  : (inquiry.internalNotes || "")
                const isNoteModified = localNotes[inquiry.id] !== undefined && localNotes[inquiry.id] !== (inquiry.internalNotes || "")

                return (
                  <>
                    <TableRow key={inquiry.id} className="group hover:bg-muted/10">
                      <TableCell className="text-center py-4 pl-4 pr-0">
                        <button
                          type="button"
                          onClick={() => toggleExpand(inquiry.id)}
                          className="text-warm hover:text-press p-1 cursor-pointer font-bold text-sm"
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="space-y-0.5 text-left">
                          <div className="font-bold text-press flex items-center gap-2">
                            {inquiry.businessName}
                            {inquiry.source && inquiry.source !== "WEBSITE" && (
                              <span className="bg-press/10 text-press/70 text-[8px] font-mono uppercase tracking-wider px-1 py-0.5">
                                {inquiry.source}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-warm font-medium">
                            {inquiry.name} • {inquiry.email} • {inquiry.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-left">
                        <span className="font-headline font-black text-sm uppercase tracking-tight text-press truncate block max-w-[150px]">
                          {inquiry.campaign.name}
                        </span>
                        <span className="text-[10px] text-warm font-mono font-bold uppercase block mt-0.5">
                          {inquiry.campaign.city}, {inquiry.campaign.state}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 px-6 font-mono text-xs uppercase text-warm">
                        {inquiry.preferredContactMethod || "—"}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-left">
                        <select
                          value={inquiry.assignedToAdminId || ""}
                          onChange={e => handleAdminChange(inquiry.id, e.target.value)}
                          className="rounded-none border border-input bg-card text-press text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer max-w-[140px]"
                        >
                          <option value="">Unassigned</option>
                          {admins.map((adm) => (
                            <option key={adm.id} value={adm.id}>
                              {adm.name || adm.email}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <select
                          value={inquiry.status}
                          onChange={e => handleStatusChange(inquiry.id, e.target.value as CampaignInquiryStatus)}
                          className={`rounded-none border border-input bg-card text-press text-xs px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer max-w-[130px]`}
                        >
                          {Object.values(CampaignInquiryStatus).map((stat) => (
                            <option key={stat} value={stat}>
                              {stat}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="py-4 px-6 font-mono text-xs text-warm font-bold">
                        {formatDate(inquiry.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!inquiry.email || !inquiry.phone || inquiry.campaign.spots.length === 0}
                            title={
                              !inquiry.email
                                ? "This inquiry has no email address."
                                : !inquiry.phone
                                  ? "This inquiry has no phone number."
                                  : inquiry.campaign.spots.length === 0
                                    ? "This campaign has no open placements."
                                    : undefined
                            }
                            onClick={() => setInvoiceInquiry(inquiry)}
                          >
                            Send invoice
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpand(inquiry.id)}
                          >
                            {isExpanded ? "Close" : "View"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <TableRow className="bg-[#FAF8F4]/80 hover:bg-[#FAF8F4]/80">
                        <TableCell colSpan={8} className="py-6 px-10 border-t border-rule">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-sm">
                            {/* Left: Submitted Info */}
                            <div className="space-y-4">
                              <h4 className="font-headline font-black text-press uppercase tracking-wider text-sm border-b border-rule pb-2">
                                Submitted Information Details
                              </h4>
                              <div className="grid grid-cols-3 gap-y-2 text-xs">
                                <span className="font-bold text-warm">Business Category:</span>
                                <span className="col-span-2 text-press font-semibold">{inquiry.businessCategory || "—"}</span>
                                
                                <span className="font-bold text-warm">Website or FB:</span>
                                <span className="col-span-2 text-press font-semibold truncate">
                                  {inquiry.websiteOrFacebook ? (
                                    <a
                                      href={inquiry.websiteOrFacebook.startsWith("http") ? inquiry.websiteOrFacebook : `https://${inquiry.websiteOrFacebook}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {inquiry.websiteOrFacebook} ↗
                                    </a>
                                  ) : "—"}
                                </span>

                                <span className="font-bold text-warm">Interest Type:</span>
                                <span className="col-span-2 text-press font-semibold uppercase font-mono">{inquiry.interestType || "—"}</span>

                                <span className="font-bold text-warm">Contact Method:</span>
                                <span className="col-span-2 text-press font-semibold uppercase font-mono">{inquiry.preferredContactMethod || "—"}</span>

                                <span className="font-bold text-warm">Conversion Track:</span>
                                <span className="col-span-2 text-press font-semibold">
                                  {inquiry.convertedOrderId ? (
                                    <span>
                                      Order: <Link href={`/admin/orders/${inquiry.convertedOrderId}`} className="text-primary font-bold hover:underline">{inquiry.convertedOrderId.slice(0, 8)}</Link>
                                      {inquiry.convertedAt && ` at ${formatDate(inquiry.convertedAt)}`}
                                    </span>
                                  ) : (
                                    <span className="text-warm italic">Not converted yet</span>
                                  )}
                                </span>
                              </div>

                              <div className="space-y-1.5 pt-2">
                                <span className="block text-xs font-bold text-warm uppercase tracking-wider font-mono">Prospect Message:</span>
                                <div className="bg-[#FAF2F0] border-l-2 border-primary/45 p-4 text-press text-xs rounded-none font-sans whitespace-pre-wrap leading-relaxed">
                                  {inquiry.message || "—"}
                                </div>
                              </div>
                            </div>

                            {/* Right: Internal Notes */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-rule pb-2">
                                <h4 className="font-headline font-black text-press uppercase tracking-wider text-sm">
                                  Internal Follow-up Notes
                                </h4>
                                {isNoteModified && (
                                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-mono animate-pulse">
                                    Unsaved Changes
                                  </span>
                                )}
                              </div>
                              <div className="space-y-3">
                                <textarea
                                  rows={5}
                                  value={noteValue}
                                  onChange={e => setLocalNotes(prev => ({ ...prev, [inquiry.id]: e.target.value }))}
                                  placeholder="Record follow-up logs, contact notes, and booking progress here..."
                                  className="w-full text-xs rounded-none border border-border bg-background p-3 text-press placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none font-sans"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={!isNoteModified || savingNotes[inquiry.id]}
                                    onClick={() => handleSaveNotes(inquiry.id)}
                                  >
                                    {savingNotes[inquiry.id] ? "Saving..." : "Save Notes"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {invoiceInquiry && (
        <InquiryInvoiceDialog
          key={invoiceInquiry.id}
          inquiry={invoiceInquiry}
          open
          onOpenChange={(open) => {
            if (!open) setInvoiceInquiry(null)
          }}
          onInvoiceSent={() => router.refresh()}
        />
      )}
    </div>
  )
}
