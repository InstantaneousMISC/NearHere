"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function AdminBusinessesPage() {
  const [activeTab, setActiveTab] = useState<"list" | "queue">("list")
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Queries
  const { data: businesses, isLoading: loadingBusinesses, refetch: refetchBusinesses } = trpc.business.list.useQuery()
  const { data: pendingRequests, isLoading: loadingRequests, refetch: refetchRequests } = trpc.business.listPendingProfileChanges.useQuery()

  // Mutations
  const approveMutation = trpc.business.approveProfileChange.useMutation()
  const rejectMutation = trpc.business.rejectProfileChange.useMutation()

  const handleApprove = async (requestId: string) => {
    if (confirm("Are you sure you want to approve this profile update? These changes will go live immediately.")) {
      setIsSubmitting(true)
      try {
        await approveMutation.mutateAsync({ requestId })
        setSelectedRequest(null)
        refetchBusinesses()
        refetchRequests()
      } catch (err: any) {
        alert(err.message || "Failed to approve profile change.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.")
      return
    }
    setIsSubmitting(true)
    try {
      await rejectMutation.mutateAsync({
        requestId: selectedRequest.id,
        rejectionReason: rejectionReason.trim(),
      })
      setIsRejectDialogOpen(false)
      setSelectedRequest(null)
      setRejectionReason("")
      refetchRequests()
    } catch (err: any) {
      alert(err.message || "Failed to reject profile change.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderComparisonRow = (label: string, liveVal: any, requestedVal: any) => {
    const isDifferent = String(liveVal || "").trim() !== String(requestedVal || "").trim()
    return (
      <tr className={`border-b border-[#E7E0D8] ${isDifferent ? "bg-amber-50/50 font-semibold text-amber-900" : "text-[#4A4542]"}`}>
        <td className="px-4 py-2 text-xs font-mono font-bold uppercase text-[#77706A]">{label}</td>
        <td className="px-4 py-2 text-xs break-words">{liveVal || <span className="text-warm italic">None</span>}</td>
        <td className="px-4 py-2 text-xs break-words">{requestedVal || <span className="text-warm italic">None</span>}</td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black uppercase text-[#211D1C] tracking-tight">
            Business Profiles Directory
          </h1>
          <p className="text-xs text-warm font-mono uppercase tracking-widest mt-1">
            Manage merchants, live directories, and change requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border select-none">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "list" ? "border-primary text-primary" : "border-transparent text-warm hover:text-press"
          }`}
        >
          All Businesses ({businesses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === "queue" ? "border-primary text-primary" : "border-transparent text-warm hover:text-press"
          }`}
        >
          Profile Review Queue ({pendingRequests?.length || 0})
        </button>
      </div>

      {/* Tab: Business Directory List */}
      {activeTab === "list" && (
        <Card>
          {loadingBusinesses ? (
            <div className="p-8 text-center text-warm italic">Loading directory list...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-4">Business Name</TableHead>
                  <TableHead className="px-6 py-4">Slug</TableHead>
                  <TableHead className="px-6 py-4">Advertiser Owner Email</TableHead>
                  <TableHead className="px-6 py-4">Location</TableHead>
                  <TableHead className="px-6 py-4">Standing Status</TableHead>
                  <TableHead className="px-6 py-4 text-right">Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!businesses || businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-warm italic">
                      No businesses found in directory.
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses.map((biz) => (
                    <TableRow key={biz.id}>
                      <TableCell className="px-6 py-4 font-bold text-press text-left">
                        <Link href={`/admin/businesses/${biz.id}`} className="hover:text-primary hover:underline">
                          {biz.name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left font-mono text-xs">
                        <Link href={`/b/${biz.slug}`} target="_blank" className="text-primary hover:underline font-bold">
                          {biz.slug}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left text-xs">
                        {biz.advertiser?.email || <span className="text-warm italic">Unlinked</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left text-xs">
                        {biz.city && biz.state ? `${biz.city}, ${biz.state.toUpperCase()}` : biz.address || "—"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-left">
                        <Badge variant={biz.goodStanding ? "success" : "destructive"}>
                          {biz.goodStanding ? "Good Standing" : "Suspended / Deactivated"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs text-warm">
                        {formatDate(new Date(biz.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab: Profile Review Queue */}
      {activeTab === "queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-mono font-bold text-[#77706A] uppercase tracking-wider">
              Pending Change Requests
            </h2>
            {loadingRequests ? (
              <div className="text-warm italic">Loading queue...</div>
            ) : !pendingRequests || pendingRequests.length === 0 ? (
              <Card className="p-6 text-center text-warm italic text-xs">No pending change requests in queue.</Card>
            ) : (
              pendingRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={`w-full text-left p-4 border transition-all rounded-none cursor-pointer block ${
                    selectedRequest?.id === req.id
                      ? "border-[#211D1C] bg-[#FAF8F4] shadow-md"
                      : "border-border bg-white hover:border-[#211D1C]"
                  }`}
                >
                  <h3 className="font-bold text-press text-sm font-headline uppercase leading-tight">
                    {req.business.name}
                  </h3>
                  <p className="text-[10px] text-warm font-mono mt-1 uppercase">
                    Submitted: {formatDate(new Date(req.submittedAt))}
                  </p>
                  <p className="text-xs text-[#4A4542] mt-1 line-clamp-1">
                    {req.description || "Updated profile details."}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Comparison Pane Right Panel */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card className="p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-[#E7E0D8] pb-4">
                  <div>
                    <h3 className="text-lg font-headline font-black uppercase text-[#211D1C] tracking-tight">
                      Compare Changes: {selectedRequest.business.name}
                    </h3>
                    <p className="text-xs text-warm font-mono uppercase tracking-widest mt-1">
                      Highlighting differences between live directory and requested update
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsRejectDialogOpen(true)}
                      disabled={isSubmitting}
                      className="cursor-pointer uppercase tracking-wider text-xs border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Reject Changes
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={isSubmitting}
                      className="cursor-pointer uppercase tracking-wider text-xs bg-[#10B981] hover:bg-[#059669] text-white"
                    >
                      Approve & Publish
                    </Button>
                  </div>
                </div>

                <div className="border border-[#E7E0D8] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF8F4] border-b border-[#E7E0D8] text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">
                        <th className="px-4 py-2">Field</th>
                        <th className="px-4 py-2">Live business details</th>
                        <th className="px-4 py-2">Requested changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderComparisonRow("Name", selectedRequest.business.name, selectedRequest.name)}
                      {renderComparisonRow("Description", selectedRequest.business.description, selectedRequest.description)}
                      {renderComparisonRow("Phone", selectedRequest.business.phone, selectedRequest.phone)}
                      {renderComparisonRow("Email", selectedRequest.business.email, selectedRequest.email)}
                      {renderComparisonRow("Website", selectedRequest.business.website, selectedRequest.website)}
                      {renderComparisonRow("Address", selectedRequest.business.address, selectedRequest.address)}
                      {renderComparisonRow("City", selectedRequest.business.city, selectedRequest.city)}
                      {renderComparisonRow("State", selectedRequest.business.state, selectedRequest.state)}
                      {renderComparisonRow("Zip Code", selectedRequest.business.zipCode, selectedRequest.zipCode)}
                      {renderComparisonRow("Service Area", selectedRequest.business.serviceArea, selectedRequest.serviceArea)}
                      {renderComparisonRow("Hours", selectedRequest.business.hours, selectedRequest.hours)}
                      {renderComparisonRow("Preferred CTA", selectedRequest.business.preferredCta, selectedRequest.preferredCta)}
                      {renderComparisonRow("Logo URL", selectedRequest.business.logoUrl, selectedRequest.logoUrl)}
                      {renderComparisonRow("Cover Image", selectedRequest.business.coverImageUrl, selectedRequest.coverImageUrl)}
                      {renderComparisonRow(
                        "Portfolio Photos", 
                        Array.isArray(selectedRequest.business.photos) ? (selectedRequest.business.photos as string[]).join(", ") : "",
                        Array.isArray(selectedRequest.photos) ? (selectedRequest.photos as string[]).join(", ") : ""
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-warm italic">
                Select a change request from the left sidebar to view side-by-side comparison.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#211D1C] rounded-none p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black uppercase text-[#211D1C] tracking-tight">
              Reject Profile Update
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77706A]">
              Provide a clear reason or edit instructions. This message will be emailed to the business owner so they can fix their profile.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">
              Feedback / Rejection Notes
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please upload a high-resolution logo without background pixelation. CTA URL is missing http:// protocol."
              className="w-full min-h-[100px] text-xs p-3 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false)
                setRejectionReason("")
              }}
              className="cursor-pointer uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectSubmit}
              disabled={isSubmitting}
              className="cursor-pointer uppercase tracking-wider text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Send Rejection Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
