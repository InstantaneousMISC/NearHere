"use client"

import React, { useState } from "react"
import { trpc } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default function AdminNotificationsPage() {
  const { data: notifications, isLoading, refetch } = trpc.notification.list.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds
  })

  const { refetch: refetchUnreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: false,
  })

  const markAsReadMutation = trpc.notification.markAsRead.useMutation()
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation()

  const [isMutating, setIsMutating] = useState(false)

  const handleMarkAsRead = async (id: string) => {
    setIsMutating(true)
    try {
      await markAsReadMutation.mutateAsync({ id })
      await refetch()
      await refetchUnreadCount()
    } catch (err) {
      console.error(err)
    } finally {
      setIsMutating(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMutating(true)
    try {
      await markAllAsReadMutation.mutateAsync()
      await refetch()
      await refetchUnreadCount()
    } catch (err) {
      console.error(err)
    } finally {
      setIsMutating(false)
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INVOICE_PAID":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 uppercase text-[9px] tracking-wider rounded-none">Paid</Badge>
      case "PENDING_ORDER":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase text-[9px] tracking-wider rounded-none">Pending</Badge>
      case "NEW_BUSINESS":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 uppercase text-[9px] tracking-wider rounded-none">New Biz</Badge>
      case "CREATIVE_SUBMISSION":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-200 uppercase text-[9px] tracking-wider rounded-none">Creative</Badge>
      case "PROFILE_CHANGE_REQUEST":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 uppercase text-[9px] tracking-wider rounded-none">Profile Request</Badge>
      case "NEW_INQUIRY":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 uppercase text-[9px] tracking-wider rounded-none">Inquiry</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 uppercase text-[9px] tracking-wider rounded-none">System</Badge>
    }
  }

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-[#211D1C] leading-none">
            Notification Center
          </h1>
          <p className="text-xs text-[#77706A] font-medium">
            Monitor orders, merchant activities, inquiries, and pending profile update requests.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer uppercase tracking-wider text-xs border-[#211D1C] text-[#211D1C] font-bold"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMutating || !notifications?.some(n => !n.read)}
            className="cursor-pointer uppercase tracking-wider text-xs bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold"
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-[#77706A] italic">Loading notifications...</div>
      ) : !notifications || notifications.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-[#E7E0D8] bg-[#FAF8F4] rounded-none">
          <p className="text-[#77706A] text-sm">All quiet! No notifications logged in the center.</p>
        </Card>
      ) : (
        <div className="border border-[#E7E0D8] divide-y divide-[#E7E0D8] bg-white">
          {notifications.map((notif) => {
            const hasLink = !!notif.link
            const isUnread = !notif.read

            return (
              <div
                key={notif.id}
                className={`p-4 flex items-start gap-4 transition-colors ${
                  isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-[#FAF8F4]"
                }`}
              >
                {/* Unread dot */}
                <div className="pt-1.5 shrink-0">
                  <span
                    className={`block w-2.5 h-2.5 rounded-full ${
                      isUnread ? "bg-[#EF4444]" : "bg-transparent"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(notif.type)}
                    <span className="text-xs text-[#77706A] font-mono">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#211D1C]">
                    {notif.title}
                  </h3>
                  <p className="text-xs text-[#77706A] max-w-xl">
                    {notif.message}
                  </p>
                  
                  {hasLink && (
                    <div className="pt-1">
                      <Link
                        href={notif.link!}
                        className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                      >
                        View Details ↗
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mark as read button */}
                {isUnread && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="cursor-pointer uppercase tracking-wider text-[10px] font-bold border-[#E7E0D8] hover:border-[#211D1C] hover:bg-transparent rounded-none"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
