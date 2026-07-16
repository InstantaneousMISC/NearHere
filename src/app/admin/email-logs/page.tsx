"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EmailLogsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [templateKey, setTemplateKey] = useState("")

  // Queries
  const { data: logs, isLoading, refetch } = trpc.emailLog.list.useQuery({
    search: search.trim() || undefined,
    status: status || undefined,
    templateKey: templateKey || undefined,
  })

  const { data: templateKeys } = trpc.emailLog.getUniqueTemplateKeys.useQuery()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-black uppercase text-[#211D1C] tracking-tight">
          System Email Logs
        </h1>
        <p className="text-xs text-warm font-mono uppercase tracking-widest mt-1">
          Monitor outbound merchant emails, delivery status, and template actions
        </p>
      </div>

      {/* Filter Controls Card */}
      <Card className="p-4 bg-white border border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] font-bold text-[#77706A] uppercase tracking-wider block">
              Search Email or Entity ID
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. merchant@gmail.com or order_..."
              className="w-full h-10 px-3 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] text-xs rounded-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] font-bold text-[#77706A] uppercase tracking-wider block">
              Delivery Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] text-xs rounded-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* Template Key */}
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] font-bold text-[#77706A] uppercase tracking-wider block">
              Email Template / Action
            </label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full h-10 px-3 border border-[#E7E0D8] bg-[#FAF8F4] focus:outline-none focus:border-[#211D1C] text-xs rounded-none cursor-pointer"
            >
              <option value="">All Templates</option>
              {templateKeys?.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Results Table Card */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center text-warm italic">Loading email logs...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-4">Recipient Email</TableHead>
                <TableHead className="px-6 py-4">Template Action</TableHead>
                <TableHead className="px-6 py-4">Linked Entity</TableHead>
                <TableHead className="px-6 py-4">Delivery Status</TableHead>
                <TableHead className="px-6 py-4">Provider Reference</TableHead>
                <TableHead className="px-6 py-4 text-right">Logged Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-warm italic">
                    No email logs found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="px-6 py-4 font-bold text-press text-left text-xs break-all">
                      {log.toEmail}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left font-mono text-xs font-bold text-primary">
                      {log.templateKey}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[10px] uppercase font-bold text-[#77706A]">
                          {log.entityType}
                        </span>
                        <span className="block font-mono text-[10px] text-press">{log.entityId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left">
                      <Badge
                        variant={
                          log.status === "SENT"
                            ? "success"
                            : log.status === "PENDING"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {log.status}
                      </Badge>
                      {log.error && (
                        <span className="block text-[10px] text-red-600 font-medium mt-1 leading-tight max-w-[200px] break-words">
                          {log.error}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-left font-mono text-xs text-[#77706A]">
                      {log.providerId || <span className="italic text-warm">None</span>}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-xs text-warm font-mono">
                      {formatDate(new Date(log.createdAt))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
