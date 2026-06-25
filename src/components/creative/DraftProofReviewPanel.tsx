"use client"

import React, { useState } from "react"
import { trpc } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface DraftProofReviewPanelProps {
  submissionId: string
  token: string
  draftProofUrl: string
  currentStatus: string
  draftFeedback: string | null
}

export default function DraftProofReviewPanel({
  submissionId,
  token,
  draftProofUrl,
  currentStatus,
  draftFeedback,
}: DraftProofReviewPanelProps) {
  const [feedback, setFeedback] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [feedbackSaved, setFeedbackSaved] = useState(draftFeedback || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const approveMutation = trpc.creative.approveDraft.useMutation()
  const rejectMutation = trpc.creative.rejectDraft.useMutation()

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this postcard design proof? This will lock the creative for printing.")) return
    setLoading(true)
    setError(null)
    try {
      await approveMutation.mutateAsync({ token })
      setStatus("APPROVED")
      alert("🎉 Postcard design proof approved successfully!")
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || "Failed to approve design proof.")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) {
      setError("Please enter details on what needs to be changed.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await rejectMutation.mutateAsync({ token, feedback })
      setStatus("REJECTED")
      setFeedbackSaved(feedback)
      setShowRejectForm(false)
      setFeedback("")
      alert("Design revision request submitted to our design team.")
      window.location.reload()
    } catch (err: any) {
      setError(err?.message || "Failed to submit revision request.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-none border-2 border-press bg-card p-6 space-y-6 font-sans text-left">
      <div className="border-b border-border pb-3">
        <h2 className="font-headline font-black text-lg uppercase text-press tracking-tight">
          Postcard Design Proof Review
        </h2>
        <p className="text-xs text-warm font-medium">
          Our design team has prepared a layout proof for your postcard ad space. Please review the layout and details below.
        </p>
      </div>

      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-500 font-mono font-bold uppercase">
          ⚠️ {error}
        </div>
      )}

      {/* Proof Image View */}
      <div className="border border-border p-4 bg-press/5 flex justify-center items-center">
        <div className="max-w-full overflow-hidden border-2 border-press bg-white shadow-md">
          {draftProofUrl.toLowerCase().endsWith('.pdf') ? (
            <div className="p-8 text-center">
              <span className="text-4xl">📄</span>
              <p className="font-bold text-sm text-press mt-2">Design Proof PDF Document</p>
              <a href={draftProofUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline text-xs mt-1 block">
                Open PDF Proof in New Tab ↗
              </a>
            </div>
          ) : (
            <img src={draftProofUrl} alt="Ad Design Proof" className="max-h-[400px] w-auto object-contain" />
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="space-y-4">
        {status === "NEEDS_REVIEW" && (
          <>
            {!showRejectForm ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                >
                  ❌ Request Design Revisions
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 hover:bg-emerald-755 text-white border-emerald-700 font-bold"
                >
                  ✓ Approve Proof & Lock for Print
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReject} className="space-y-3 bg-red-500/5 border border-red-200 p-4 text-left animate-fade-up">
                <label htmlFor="feedbackInput" className="block text-xs font-bold text-red-700 font-headline uppercase tracking-wider mb-1">
                  Required Changes / Revision Feedback *
                </label>
                <Textarea
                  id="feedbackInput"
                  rows={3}
                  required
                  placeholder="e.g. Please increase the font size of the phone number and use a darker color for the headline..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !feedback.trim()}
                    variant="destructive"
                  >
                    Submit Revision Request
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </>
        )}

        {status === "APPROVED" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-800 font-semibold text-center uppercase tracking-wider font-mono">
            🎉 Design Proof Approved & Locked for Print Layout.
          </div>
        )}

        {status === "REJECTED" && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 space-y-2 text-left font-mono">
            <span className="font-bold block uppercase tracking-wider">⚠️ Design Revision Requested</span>
            <p className="italic">"{feedbackSaved || "No feedback logged."}"</p>
            <p className="text-[10px] text-warm font-semibold">Our design team is reviewing your comments and will upload a revised proof soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
