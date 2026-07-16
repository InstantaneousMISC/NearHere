"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { formatDate, formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PREPOPULATED_SERVICES, GENERAL_SERVICES } from "@/lib/constants"

interface BusinessDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = use(params)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [statusNotes, setStatusNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editSlug, setEditSlug] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [editLogoUrl, setEditLogoUrl] = useState("")
  const [editCoverImageUrl, setEditCoverImageUrl] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editCity, setEditCity] = useState("")
  const [editState, setEditState] = useState("")
  const [editZipCode, setEditZipCode] = useState("")
  const [editServiceArea, setEditServiceArea] = useState("")
  const [editHours, setEditHours] = useState("")
  const [editPreferredCta, setEditPreferredCta] = useState("")
  const [editFacebook, setEditFacebook] = useState("")
  const [editInstagram, setEditInstagram] = useState("")
  const [editTwitter, setEditTwitter] = useState("")
  const [editEstablishedYear, setEditEstablishedYear] = useState("")
  const [editLicenseNumber, setEditLicenseNumber] = useState("")
  const [editServices, setEditServices] = useState<string[]>([])
  const [editCustomService, setEditCustomService] = useState("")

  // Queries
  const { data: businessData, isLoading, error, refetch } = trpc.business.getById.useQuery({ id })

  // Mutations
  const updateStandingMutation = trpc.business.updateGoodStanding.useMutation()
  const regenerateTokenMutation = trpc.business.regenerateClaimToken.useMutation()
  const updateBusinessMutation = trpc.business.update.useMutation()

  const openEditDialog = () => {
    if (!businessData) return
    setEditName(businessData.name || "")
    setEditSlug(businessData.slug || "")
    setEditDescription(businessData.description || "")
    setEditPhone(businessData.phone || "")
    setEditEmail(businessData.email || "")
    setEditWebsite(businessData.website || "")
    setEditLogoUrl(businessData.logoUrl || "")
    setEditCoverImageUrl(businessData.coverImageUrl || "")
    setEditAddress(businessData.address || "")
    setEditCity(businessData.city || "")
    setEditState(businessData.state || "")
    setEditZipCode(businessData.zipCode || "")
    setEditServiceArea(businessData.serviceArea || "")
    setEditHours(businessData.hours || "")
    setEditPreferredCta(businessData.preferredCta || "")
    setEditEstablishedYear(businessData.establishedYear || "")
    setEditLicenseNumber(businessData.licenseNumber || "")

    const loadedServices = businessData.services && Array.isArray(businessData.services) ? (businessData.services as string[]) : []
    setEditServices(loadedServices)
    setEditCustomService("")
    
    const socials = businessData.socialLinks && typeof businessData.socialLinks === "object" ? (businessData.socialLinks as any) : null
    setEditFacebook(socials?.facebook || "")
    setEditInstagram(socials?.instagram || "")
    setEditTwitter(socials?.twitter || "")
    
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessData) return
    setIsSubmitting(true)
    try {
      await updateBusinessMutation.mutateAsync({
        id: businessData.id,
        name: editName.trim(),
        slug: editSlug.trim().toLowerCase(),
        description: editDescription.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim() || null,
        website: editWebsite.trim() || null,
        logoUrl: editLogoUrl.trim() || null,
        coverImageUrl: editCoverImageUrl.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim() || null,
        state: editState.trim() || null,
        zipCode: editZipCode.trim() || null,
        serviceArea: editServiceArea.trim() || null,
        hours: editHours.trim() || null,
        preferredCta: editPreferredCta.trim() || null,
        facebook: editFacebook.trim() || null,
        instagram: editInstagram.trim() || null,
        twitter: editTwitter.trim() || null,
        services: editServices,
        establishedYear: editEstablishedYear.trim() || null,
        licenseNumber: editLicenseNumber.trim() || null,
      })
      setIsEditDialogOpen(false)
      refetch()
    } catch (err: any) {
      alert(err.message || "Failed to update business profile.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStanding = async () => {
    if (!businessData) return
    setIsSubmitting(true)
    try {
      await updateStandingMutation.mutateAsync({
        id: businessData.id,
        goodStanding: !businessData.goodStanding,
        notes: statusNotes.trim() || `Toggled good standing status to ${!businessData.goodStanding}`,
      })
      setIsStatusDialogOpen(false)
      setStatusNotes("")
      refetch()
    } catch (err: any) {
      alert(err.message || "Failed to update business standing status.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetClaimToken = async () => {
    if (!businessData) return
    const reason = prompt("Enter a reason for resetting/generating the claim token:")
    if (reason === null) return // cancelled
    if (!reason.trim()) {
      alert("A reason is required.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await regenerateTokenMutation.mutateAsync({
        businessId: businessData.id,
        reason: reason.trim(),
        sendEmailNotification: true,
      })
      alert(`Claim token successfully reset! New Claim Link:\n${res.claimLink}`)
      refetch()
    } catch (err: any) {
      alert(err.message || "Failed to reset claim token.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-warm italic">Loading business details...</div>
  }

  if (error || !businessData) {
    return (
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-500 font-mono">Business Not Found</h2>
        <p className="text-xs text-warm">We couldn't retrieve the details for this business ID.</p>
        <Link href="/admin/businesses" className="inline-block text-xs font-bold uppercase tracking-wider text-primary underline">
          Back to directory
        </Link>
      </Card>
    )
  }

  const advertiser = businessData.advertiser
  const orders = advertiser?.orders || []
  const qrCodes = businessData.qrCodes || []
  const auditLogs = businessData.auditLogs || []

  // Resolve directory profile path if it exists
  const directoryProfile = (businessData as any).directoryProfile
  
  const bState = businessData.state?.trim().toLowerCase() || "tx"
  const bCity = businessData.city?.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "converse"
  let publicProfileUrl = `/directory/${bState}/${bCity}/businesses/${businessData.slug}`

  if (directoryProfile && directoryProfile.locations?.length > 0) {
    const primaryLoc = directoryProfile.locations[0]
    const stateSlug = primaryLoc.city?.state?.slug
    const citySlug = primaryLoc.city?.slug
    if (stateSlug && citySlug) {
      publicProfileUrl = `/directory/${stateSlug}/${citySlug}/businesses/${directoryProfile.slug || businessData.slug}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Top Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-warm uppercase">
            <Link href="/admin/businesses" className="hover:text-primary hover:underline">
              Businesses
            </Link>
            <span>/</span>
            <span className="text-press">{businessData.name}</span>
          </div>
          <h1 className="text-3xl font-headline font-black uppercase text-[#211D1C] tracking-tight mt-1">
            {businessData.name}
          </h1>
          <p className="text-xs font-mono text-warm mt-1.5 uppercase flex items-center gap-2 flex-wrap">
            <span>Slug: <span className="text-primary font-bold">{businessData.slug}</span></span>
            <span>•</span>
            <a
              href={publicProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-bold"
            >
              View Public Profile ↗
            </a>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={openEditDialog}
            disabled={isSubmitting}
            variant="outline"
            className="cursor-pointer uppercase tracking-wider text-xs border-primary text-primary hover:bg-primary/5 font-bold"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            onClick={handleResetClaimToken}
            disabled={isSubmitting}
            className="cursor-pointer uppercase tracking-wider text-xs border-[#211D1C] text-[#211D1C]"
          >
            Reset Claim / Unlink Owner
          </Button>
          <Button
            onClick={() => setIsStatusDialogOpen(true)}
            disabled={isSubmitting}
            variant={businessData.goodStanding ? "destructive" : "default"}
            className="cursor-pointer uppercase tracking-wider text-xs"
          >
            {businessData.goodStanding ? "Suspend Business" : "Activate Business"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info & Linked Owner */}
        <div className="lg:col-span-1 space-y-6">
          {/* Standing Banner */}
          {!businessData.goodStanding && (
            <Card className="border-red-200 bg-red-50 p-4 text-red-800 text-xs">
              <span className="font-bold uppercase block mb-1">⚠️ Suspended Profile</span>
              This profile has been deactivated. The live directory page is offline, and all active campaign QR redirects are temporarily held.
            </Card>
          )}

          {/* Profile Details Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
              Live Profile Details
            </h3>

            <div className="space-y-3 text-xs">
              {businessData.logoUrl && (
                <div className="flex justify-center border-b border-[#E7E0D8] pb-3">
                  <img
                    src={businessData.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 object-contain border border-[#E7E0D8] bg-[#FAF8F4]"
                  />
                </div>
              )}
              <div>
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Description</span>
                <p className="text-[#4A4542] leading-relaxed mt-0.5 whitespace-pre-line">
                  {businessData.description || <span className="text-warm italic">No description provided</span>}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-[#E7E0D8] pt-2">
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Phone</span>
                  <span>{businessData.phone || "—"}</span>
                </div>
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Email</span>
                  <span className="break-all">{businessData.email || "—"}</span>
                </div>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2">
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Website</span>
                {businessData.website ? (
                  <a
                    href={businessData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold break-all"
                  >
                    {businessData.website}
                  </a>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="border-t border-[#E7E0D8] pt-2">
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Address</span>
                <span>
                  {businessData.address ? (
                    <>
                      {businessData.address}
                      {businessData.city && `, ${businessData.city}`}
                      {businessData.state && `, ${businessData.state.toUpperCase()}`}
                      {businessData.zipCode && ` ${businessData.zipCode}`}
                    </>
                  ) : (
                    "No address set"
                  )}
                </span>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Preferred CTA</span>
                  <span className="font-semibold text-primary">{businessData.preferredCta || "DEFAULT"}</span>
                </div>
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Service Area</span>
                  <span>{businessData.serviceArea || "Not specified"}</span>
                </div>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Hours</span>
                  <span>{businessData.hours || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Established Year</span>
                  <span>{businessData.establishedYear || "Not specified"}</span>
                </div>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">License Number</span>
                  <span>{businessData.licenseNumber || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[#77706A] block font-mono text-[9px] uppercase">Social Links</span>
                  <span>
                    {(() => {
                      const socials = businessData.socialLinks && typeof businessData.socialLinks === "object" ? (businessData.socialLinks as any) : null
                      const links = []
                      if (socials?.facebook) links.push("FB")
                      if (socials?.instagram) links.push("IG")
                      if (socials?.twitter) links.push("TW")
                      return links.length > 0 ? links.join(", ") : "None"
                    })()}
                  </span>
                </div>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2">
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Services Offered</span>
                {Array.isArray(businessData.services) && (businessData.services as string[]).length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(businessData.services as string[]).map((service) => (
                      <span
                        key={service}
                        className="inline-block bg-[#E7E0D8]/40 text-[#4A4542] text-[9px] px-1.5 py-0.5 rounded font-mono"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-warm italic">None specified</span>
                )}
              </div>
            </div>
          </Card>

          {/* Connected Account Owner Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
              Account Ownership
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Advertiser Account</span>
                <span className="font-bold text-press">{advertiser?.contactName || "No contact"}</span>
                <span className="text-warm block">{advertiser?.email}</span>
              </div>
              <div className="border-t border-[#E7E0D8] pt-2">
                <span className="text-[#77706A] block font-mono text-[9px] uppercase">Claim Status</span>
                {businessData.ownerUserId ? (
                  <div className="space-y-1">
                    <Badge variant="success">Claimed Profile</Badge>
                    <span className="text-[10px] text-warm block">Linked User ID: {businessData.ownerUserId}</span>
                    {businessData.claimedAt && (
                      <span className="text-[10px] text-warm block">Claimed: {formatDate(new Date(businessData.claimedAt))}</span>
                    )}
                  </div>
                ) : businessData.claimToken ? (
                  <div className="space-y-1">
                    <Badge variant="warning">Pending Claim Setup</Badge>
                    <span className="text-[10px] text-warm block">Token: {businessData.claimToken}</span>
                    {businessData.claimTokenExpiresAt && (
                      <span className="text-[10px] text-red-600 block">
                        Expires: {formatDate(new Date(businessData.claimTokenExpiresAt))}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Badge variant="outline">Unclaimed</Badge>
                    <span className="text-[10px] text-warm block">No active claim tokens or owners connected.</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Campaigns & Placements + Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Placements & Campaigns Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
              Campaign Ad Placements
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Category / Label</TableHead>
                  <TableHead>Spot Type</TableHead>
                  <TableHead className="text-right">Order status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-warm italic py-4">
                      No ad placements booked.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-bold text-press">
                        <Link href={`/admin/campaigns/${o.campaign.id}`} className="hover:text-primary hover:underline">
                          {o.campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs uppercase block">{o.campaignSpot?.label}</span>
                        <span className="text-[10px] text-warm uppercase font-mono">{o.campaignSpot?.category?.name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs uppercase">
                        {o.campaignSpot?.spotType}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={o.status === "PAID" ? "success" : "secondary"}>{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Orders & Invoices History Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
              Invoice History
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Invoice Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-warm italic py-4">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs font-bold text-press">
                        <Link href={`/invoice/${o.id}`} target="_blank" className="hover:text-primary hover:underline">
                          {o.id.slice(0, 12)}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-xs">
                        {formatPrice(o.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.status === "PAID" ? "success" : o.status === "PENDING" ? "warning" : "destructive"}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-warm">
                        {formatDate(new Date(o.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* QR Codes Wide Section */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
          QR Code Redirections ({qrCodes.length})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR Slug</TableHead>
              <TableHead>Target Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Total Scans</TableHead>
              <TableHead className="text-right">Expires At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-warm italic py-4">
                  No QR codes active.
                </TableCell>
              </TableRow>
            ) : (
              qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell className="font-mono text-xs font-bold">
                    <Link href={`/q/${qr.slug}`} target="_blank" className="text-primary hover:underline font-bold">
                      {qr.slug}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#4A4542]">
                    {qr.destinationPath}
                  </TableCell>
                  <TableCell>
                    <Badge variant={qr.status === "ACTIVE" ? "success" : "destructive"}>{qr.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">
                    {qr._count.scans}
                  </TableCell>
                  <TableCell className="text-right text-xs text-warm">
                    {qr.expiresAt ? formatDate(new Date(qr.expiresAt)) : "Never"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Audit Logs Wide Section */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold text-[#77706A] uppercase tracking-wider border-b border-[#E7E0D8] pb-1.5">
          Admin Audit Logs
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Admin User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-warm italic py-4">
                  No audit logs recorded for this business.
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-warm font-mono">
                    {formatDate(new Date(log.createdAt))}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-press">
                    {log.adminEmail}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[9px]">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#4A4542]">
                    {log.notes}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Standing Deactivation Notes Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#211D1C] rounded-none p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black uppercase text-[#211D1C] tracking-tight">
              Update Business Standing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77706A]">
              Provide notes explaining this status update. This action will toggle the business good standing status.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2">
            <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">
              Reason / Standing Notes
            </label>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="e.g. Suspending due to billing non-payment or deactivated at merchant request."
              className="w-full min-h-[100px] text-xs p-3 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false)
                setStatusNotes("")
              }}
              className="cursor-pointer uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleStanding}
              disabled={isSubmitting}
              className="cursor-pointer uppercase tracking-wider text-xs bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold"
            >
              Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Business Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-2 border-[#211D1C] rounded-none p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-headline font-black uppercase text-[#211D1C] tracking-tight">
              Edit Business Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-[#77706A]">
              Modify the business profile details. These changes will reflect immediately on the public directory page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Business Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Website */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Website URL</label>
                <input
                  type="text"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Service Area */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Service Area</label>
                <input
                  type="text"
                  value={editServiceArea}
                  onChange={(e) => setEditServiceArea(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. San Antonio Metro"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Logo Image URL</label>
                <input
                  type="text"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Cover Image URL</label>
                <input
                  type="text"
                  value={editCoverImageUrl}
                  onChange={(e) => setEditCoverImageUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">State</label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. TX"
                />
              </div>

              {/* Zip Code */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Zip Code</label>
                <input
                  type="text"
                  value={editZipCode}
                  onChange={(e) => setEditZipCode(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                />
              </div>

              {/* Hours */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Hours of Operation</label>
                <input
                  type="text"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. Mon-Fri 9am-5pm"
                />
              </div>

              {/* Preferred CTA */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Preferred CTA</label>
                <input
                  type="text"
                  value={editPreferredCta}
                  onChange={(e) => setEditPreferredCta(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. Call Now, Visit Website"
                />
              </div>

              {/* Facebook */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Facebook Page URL</label>
                <input
                  type="url"
                  value={editFacebook}
                  onChange={(e) => setEditFacebook(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="https://facebook.com/..."
                />
              </div>

              {/* Instagram */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Instagram URL</label>
                <input
                  type="url"
                  value={editInstagram}
                  onChange={(e) => setEditInstagram(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="https://instagram.com/..."
                />
              </div>

              {/* Twitter / X */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Twitter / X URL</label>
                <input
                  type="url"
                  value={editTwitter}
                  onChange={(e) => setEditTwitter(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="https://x.com/..."
                />
              </div>

              {/* Established Year */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Established Year</label>
                <input
                  type="text"
                  value={editEstablishedYear}
                  onChange={(e) => setEditEstablishedYear(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. 2016"
                />
              </div>

              {/* License Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">License Number</label>
                <input
                  type="text"
                  value={editLicenseNumber}
                  onChange={(e) => setEditLicenseNumber(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  placeholder="e.g. M-42678"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider">Business Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full min-h-[80px] text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
              />
            </div>

            {/* Services Offered */}
            <div className="space-y-2 border-t border-[#E7E0D8] pt-4 mt-2 text-left">
              <label className="text-[10px] font-mono font-bold text-[#77706A] uppercase tracking-wider block">Services Offered</label>
              
              {/* Prepopulated Services */}
              {(() => {
                const categorySlug = orders?.[0]?.campaignSpot?.category?.slug || "general"
                const categoryServices = PREPOPULATED_SERVICES[categorySlug] || GENERAL_SERVICES
                return (
                  <div className="grid grid-cols-2 gap-2 bg-[#FAF8F4] p-3 border border-[#E7E0D8]">
                    {categoryServices.map((serviceName) => {
                      const isChecked = editServices.includes(serviceName)
                      return (
                        <label key={serviceName} className="flex items-center gap-2 text-xs text-press select-none cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            className="rounded border-[#E7E0D8] text-primary focus:ring-primary h-4 w-4"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditServices([...editServices, serviceName])
                              } else {
                                setEditServices(editServices.filter((s) => s !== serviceName))
                              }
                            }}
                          />
                          <span>{serviceName}</span>
                        </label>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Add Custom Service Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a custom service..."
                  value={editCustomService}
                  onChange={(e) => setEditCustomService(e.target.value)}
                  className="flex-1 text-xs p-2 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] rounded-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const trimmed = editCustomService.trim()
                      if (trimmed && !editServices.includes(trimmed)) {
                        setEditServices([...editServices, trimmed])
                        setEditCustomService("")
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const trimmed = editCustomService.trim()
                    if (trimmed && !editServices.includes(trimmed)) {
                      setEditServices([...editServices, trimmed])
                      setEditCustomService("")
                    }
                  }}
                  className="bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold"
                >
                  Add
                </Button>
              </div>

              {/* Display dynamic tags */}
              {editServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editServices.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200">
                      {s}
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 font-bold ml-1 text-sm font-sans"
                        onClick={() => setEditServices(editServices.filter((item) => item !== s))}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="cursor-pointer uppercase tracking-wider text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer uppercase tracking-wider text-xs bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
