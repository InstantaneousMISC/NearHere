"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  category: { id: string; name: string } | null
  campaignId: string
  zipCode: string
}

export default function WaitlistModal({
  isOpen,
  onClose,
  category,
  campaignId,
  zipCode,
}: WaitlistModalProps) {
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLeadMutation = trpc.lead.create.useMutation()

  if (!isOpen || !category) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await createLeadMutation.mutateAsync({
        businessName: businessName.trim() ? businessName : undefined,
        email: email.trim(),
        zipCode,
        campaignId,
        categoryId: category.id,
      })
      setSuccess(true)
      setBusinessName("")
      setEmail("")
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card border border-border p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in rounded-none font-sans z-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-mono text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
              Category Reserved
            </span>
            <h3 className="text-xl font-extrabold uppercase text-foreground">
              {category.name} Waitlist
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This business category is currently reserved in this campaign. Join the waitlist and
              we will contact you when a compatible placement becomes available.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 font-mono font-bold uppercase tracking-wider text-center">
                Successfully joined the waitlist. We will contact you when a placement becomes available.
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest text-xs py-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-none cursor-pointer"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-500 font-mono uppercase">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="modalBusinessName" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Business Name (Optional)
                </label>
                <input
                  id="modalBusinessName"
                  type="text"
                  disabled={loading}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Converse Plumbing Pros"
                  className="w-full bg-background border border-border px-3 py-2 text-sm outline-none text-foreground rounded-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modalEmail" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  id="modalEmail"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@converseplumbing.com"
                  className="w-full bg-background border border-border px-3 py-2 text-sm outline-none text-foreground rounded-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider leading-relaxed">
                📍 Target Zone: ZIP {zipCode}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest text-xs py-3.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-none cursor-pointer disabled:opacity-50"
              >
                {loading ? "JOINING..." : "JOIN CATEGORY WAITLIST"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
