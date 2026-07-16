"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { DirectoryStatus, IndexControl } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

type Tab = "states" | "cities" | "categories" | "profiles"

export default function AdminDirectoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("states")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ─── STATE MANAGEMENT ─────────────────────────────────────────────────────
  const { data: states, refetch: refetchStates } = trpc.directory.listStates.useQuery()
  const upsertStateMutation = trpc.directory.upsertState.useMutation()
  const deleteStateMutation = trpc.directory.deleteState.useMutation()
  
  const [editingState, setEditingState] = useState<any | null>(null)
  const [isAddingState, setIsAddingState] = useState(false)
  const [stateName, setStateName] = useState("")
  const [stateSlug, setStateSlug] = useState("")
  const [stateStatus, setStateStatus] = useState<DirectoryStatus>(DirectoryStatus.DRAFT)
  const [stateIndexed, setStateIndexed] = useState<IndexControl>(IndexControl.INDEX)
  const [stateMetaTitle, setStateMetaTitle] = useState("")
  const [stateMetaDesc, setStateMetaDesc] = useState("")

  const handleStateNameChange = (val: string) => {
    setStateName(val)
    setStateSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, "-"))
  }

  const handleEditState = (state: any) => {
    setEditingState(state)
    setIsAddingState(false)
    setStateName(state.name)
    setStateSlug(state.slug)
    setStateStatus(state.status)
    setStateIndexed(state.isIndexed)
    setStateMetaTitle(state.metaTitle || "")
    setStateMetaDesc(state.metaDescription || "")
    setError(null)
  }

  const handleAddState = () => {
    setIsAddingState(true)
    setEditingState(null)
    setStateName("")
    setStateSlug("")
    setStateStatus(DirectoryStatus.DRAFT)
    setStateIndexed(IndexControl.INDEX)
    setStateMetaTitle("")
    setStateMetaDesc("")
    setError(null)
  }

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await upsertStateMutation.mutateAsync({
        id: editingState?.id,
        name: stateName,
        slug: stateSlug,
        status: stateStatus,
        isIndexed: stateIndexed,
        metaTitle: stateMetaTitle || undefined,
        metaDescription: stateMetaDesc || undefined,
      })
      setSuccess("State saved successfully.")
      setIsAddingState(false)
      setEditingState(null)
      await refetchStates()
    } catch (err: any) {
      setError(err?.message || "Failed to save state.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteState = async (id: string) => {
    if (!confirm("Are you sure? This will delete the state and all related cities.")) return
    try {
      await deleteStateMutation.mutateAsync({ id })
      await refetchStates()
    } catch (err: any) {
      alert(err?.message || "Failed to delete state.")
    }
  }

  // ─── CITY MANAGEMENT ──────────────────────────────────────────────────────
  const { data: cities, refetch: refetchCities } = trpc.directory.listCities.useQuery({})
  const upsertCityMutation = trpc.directory.upsertCity.useMutation()
  const deleteCityMutation = trpc.directory.deleteCity.useMutation()

  const [editingCity, setEditingCity] = useState<any | null>(null)
  const [isAddingCity, setIsAddingCity] = useState(false)
  const [cityName, setCityName] = useState("")
  const [citySlug, setCitySlug] = useState("")
  const [cityStateId, setCityStateId] = useState("")
  const [cityStatus, setCityStatus] = useState<DirectoryStatus>(DirectoryStatus.DRAFT)
  const [cityIndexed, setCityIndexed] = useState<IndexControl>(IndexControl.INDEX)
  const [cityMetaTitle, setCityMetaTitle] = useState("")
  const [cityMetaDesc, setCityMetaDesc] = useState("")
  const [cityIntro, setCityIntro] = useState("")

  const handleCityNameChange = (val: string) => {
    setCityName(val)
    setCitySlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, "-"))
  }

  const handleEditCity = (city: any) => {
    setEditingCity(city)
    setIsAddingCity(false)
    setCityName(city.name)
    setCitySlug(city.slug)
    setCityStateId(city.stateId)
    setCityStatus(city.status)
    setCityIndexed(city.isIndexed)
    setCityMetaTitle(city.metaTitle || "")
    setCityMetaDesc(city.metaDescription || "")
    setCityIntro(city.introCopy || "")
    setError(null)
  }

  const handleAddCity = () => {
    setIsAddingCity(true)
    setEditingCity(null)
    setCityName("")
    setCitySlug("")
    setCityStateId(states?.[0]?.id || "")
    setCityStatus(DirectoryStatus.DRAFT)
    setCityIndexed(IndexControl.INDEX)
    setCityMetaTitle("")
    setCityMetaDesc("")
    setCityIntro("")
    setError(null)
  }

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await upsertCityMutation.mutateAsync({
        id: editingCity?.id,
        name: cityName,
        slug: citySlug,
        stateId: cityStateId,
        status: cityStatus,
        isIndexed: cityIndexed,
        metaTitle: cityMetaTitle || undefined,
        metaDescription: cityMetaDesc || undefined,
        introCopy: cityIntro || undefined,
      })
      setSuccess("City saved successfully.")
      setIsAddingCity(false)
      setEditingCity(null)
      await refetchCities()
    } catch (err: any) {
      setError(err?.message || "Failed to save city.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Are you sure? This will delete the city and all locations.")) return
    try {
      await deleteCityMutation.mutateAsync({ id })
      await refetchCities()
    } catch (err: any) {
      alert(err?.message || "Failed to delete city.")
    }
  }

  // ─── CATEGORY MANAGEMENT ──────────────────────────────────────────────────
  const { data: categories, refetch: refetchCategories } = trpc.directory.listCategories.useQuery()
  const upsertCategoryMutation = trpc.directory.upsertCategory.useMutation()
  const deleteCategoryMutation = trpc.directory.deleteCategory.useMutation()

  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [catName, setCatName] = useState("")
  const [catSlug, setCatSlug] = useState("")
  const [catDesc, setCatDesc] = useState("")
  const [catStatus, setCatStatus] = useState<DirectoryStatus>(DirectoryStatus.DRAFT)
  const [catIndexed, setCatIndexed] = useState<IndexControl>(IndexControl.INDEX)
  const [catMetaTitle, setCatMetaTitle] = useState("")
  const [catMetaDesc, setCatMetaDesc] = useState("")

  const handleCatNameChange = (val: string) => {
    setCatName(val)
    setCatSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, "-"))
  }

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setIsAddingCategory(false)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatDesc(cat.description || "")
    setCatStatus(cat.status)
    setCatIndexed(cat.isIndexed)
    setCatMetaTitle(cat.metaTitle || "")
    setCatMetaDesc(cat.metaDescription || "")
    setError(null)
  }

  const handleAddCategory = () => {
    setIsAddingCategory(true)
    setEditingCategory(null)
    setCatName("")
    setCatSlug("")
    setCatDesc("")
    setCatStatus(DirectoryStatus.DRAFT)
    setCatIndexed(IndexControl.INDEX)
    setCatMetaTitle("")
    setCatMetaDesc("")
    setError(null)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await upsertCategoryMutation.mutateAsync({
        id: editingCategory?.id,
        name: catName,
        slug: catSlug,
        description: catDesc || undefined,
        status: catStatus,
        isIndexed: catIndexed,
        metaTitle: catMetaTitle || undefined,
        metaDescription: catMetaDesc || undefined,
      })
      setSuccess("Category saved successfully.")
      setIsAddingCategory(false)
      setEditingCategory(null)
      await refetchCategories()
    } catch (err: any) {
      setError(err?.message || "Failed to save category.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteCategoryMutation.mutateAsync({ id })
      await refetchCategories()
    } catch (err: any) {
      alert(err?.message || "Failed to delete category.")
    }
  }

  // ─── PROFILE MANAGEMENT ───────────────────────────────────────────────────
  const { data: profiles, refetch: refetchProfiles } = trpc.directory.listProfiles.useQuery()
  const upsertProfileMutation = trpc.directory.upsertProfile.useMutation()
  const deleteProfileMutation = trpc.directory.deleteProfile.useMutation()

  const [editingProfile, setEditingProfile] = useState<any | null>(null)
  const [isAddingProfile, setIsAddingProfile] = useState(false)
  const [profName, setProfName] = useState("")
  const [profSlug, setProfSlug] = useState("")
  const [profDesc, setProfDesc] = useState("")
  const [profPhone, setProfPhone] = useState("")
  const [profEmail, setProfEmail] = useState("")
  const [profWebsite, setProfWebsite] = useState("")
  const [profLogo, setProfLogo] = useState("")
  const [profCover, setProfCover] = useState("")
  const [profAddress, setProfAddress] = useState("")
  const [profServiceArea, setProfServiceArea] = useState("")
  const [profHours, setProfHours] = useState("")
  const [profCta, setProfCta] = useState("")
  const [profStatus, setProfStatus] = useState<DirectoryStatus>(DirectoryStatus.DRAFT)
  const [profIndexed, setProfIndexed] = useState<IndexControl>(IndexControl.INDEX)
  const [profMetaTitle, setProfMetaTitle] = useState("")
  const [profMetaDesc, setProfMetaDesc] = useState("")
  const [profIntroCopy, setProfIntroCopy] = useState("")
  
  // Relations selection
  const [profCityIds, setProfCityIds] = useState<string[]>([])
  const [profCategoryIds, setProfCategoryIds] = useState<string[]>([])

  const handleProfNameChange = (val: string) => {
    setProfName(val)
    setProfSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, "-"))
  }

  const handleEditProfile = (prof: any) => {
    setEditingProfile(prof)
    setIsAddingProfile(false)
    setProfName(prof.name)
    setProfSlug(prof.slug)
    setProfDesc(prof.description || "")
    setProfPhone(prof.phone || "")
    setProfEmail(prof.email || "")
    setProfWebsite(prof.website || "")
    setProfLogo(prof.logoUrl || "")
    setProfCover(prof.coverImageUrl || "")
    setProfAddress(prof.address || "")
    setProfServiceArea(prof.serviceArea || "")
    setProfHours(prof.hours || "")
    setProfCta(prof.preferredCta || "")
    setProfStatus(prof.status)
    setProfIndexed(prof.isIndexed)
    setProfMetaTitle(prof.metaTitle || "")
    setProfMetaDesc(prof.metaDescription || "")
    setProfIntroCopy(prof.introCopy || "")
    setProfCityIds(prof.locations.map((l: any) => l.cityId))
    setProfCategoryIds(prof.categories.map((c: any) => c.directoryCategoryId))
    setError(null)
  }

  const handleAddProfile = () => {
    setIsAddingProfile(true)
    setEditingProfile(null)
    setProfName("")
    setProfSlug("")
    setProfDesc("")
    setProfPhone("")
    setProfEmail("")
    setProfWebsite("")
    setProfLogo("")
    setProfCover("")
    setProfAddress("")
    setProfServiceArea("")
    setProfHours("")
    setProfCta("")
    setProfStatus(DirectoryStatus.DRAFT)
    setProfIndexed(IndexControl.INDEX)
    setProfMetaTitle("")
    setProfMetaDesc("")
    setProfIntroCopy("")
    setProfCityIds([])
    setProfCategoryIds([])
    setError(null)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await upsertProfileMutation.mutateAsync({
        id: editingProfile?.id,
        name: profName,
        slug: profSlug,
        description: profDesc || undefined,
        phone: profPhone || undefined,
        email: profEmail || undefined,
        website: profWebsite || undefined,
        logoUrl: profLogo || undefined,
        coverImageUrl: profCover || undefined,
        address: profAddress || undefined,
        serviceArea: profServiceArea || undefined,
        hours: profHours || undefined,
        preferredCta: profCta || undefined,
        status: profStatus,
        isIndexed: profIndexed,
        metaTitle: profMetaTitle || undefined,
        metaDescription: profMetaDesc || undefined,
        introCopy: profIntroCopy || undefined,
        cityIds: profCityIds,
        categoryIds: profCategoryIds,
      })
      setSuccess("Profile saved successfully.")
      setIsAddingProfile(false)
      setEditingProfile(null)
      await refetchProfiles()
    } catch (err: any) {
      setError(err?.message || "Failed to save profile.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteProfileMutation.mutateAsync({ id })
      await refetchProfiles()
    } catch (err: any) {
      alert(err?.message || "Failed to delete profile.")
    }
  }

  const handleCityCheckboxChange = (cityId: string, checked: boolean) => {
    if (checked) {
      setProfCityIds([...profCityIds, cityId])
    } else {
      setProfCityIds(profCityIds.filter((id) => id !== cityId))
    }
  }

  const handleCategoryCheckboxChange = (catId: string, checked: boolean) => {
    if (checked) {
      setProfCategoryIds([...profCategoryIds, catId])
    } else {
      setProfCategoryIds(profCategoryIds.filter((id) => id !== catId))
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
            Directory Manager
          </h1>
          <p className="text-xs text-warm font-medium">
            Manage the location hierarchy, business categories, and public SEO profiles for NearHere Directory.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border font-headline text-sm uppercase font-bold tracking-tight select-none">
        {(["states", "cities", "categories", "profiles"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setIsAddingState(false)
              setEditingState(null)
              setIsAddingCity(false)
              setEditingCity(null)
              setIsAddingCategory(false)
              setEditingCategory(null)
              setIsAddingProfile(false)
              setEditingProfile(null)
              setError(null)
              setSuccess(null)
            }}
            className={`px-6 py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-warm hover:text-press"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-600 font-bold uppercase tracking-wide text-left">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="rounded-none bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-600 font-bold uppercase tracking-wide text-left">
          ✅ {success}
        </div>
      )}

      {/* ─── TAB CONTENT: STATES ─── */}
      {activeTab === "states" && (
        <div className="space-y-6">
          {!isAddingState && !editingState ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddState}>＋ Add State</Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Cities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!states || states.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center italic text-warm py-8">No states registered.</TableCell>
                      </TableRow>
                    ) : (
                      states.map((state) => (
                        <TableRow key={state.id}>
                          <TableCell className="font-bold text-left">{state.name}</TableCell>
                          <TableCell className="font-mono text-xs">{state.slug}</TableCell>
                          <TableCell>{state._count.cities}</TableCell>
                          <TableCell><Badge variant={state.status === "PUBLISHED" ? "success" : "outline"}>{state.status}</Badge></TableCell>
                          <TableCell><Badge variant={state.isIndexed === "INDEX" ? "default" : "secondary"}>{state.isIndexed}</Badge></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditState(state)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteState(state.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <Card className="p-6 max-w-xl mx-auto text-left">
              <form onSubmit={handleStateSubmit} className="space-y-4">
                <h3 className="font-headline font-black text-lg uppercase pb-2 border-b border-border">
                  {editingState ? `Edit State: ${editingState.name}` : "Add New State"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Name</label>
                    <Input required value={stateName} onChange={(e) => handleStateNameChange(e.target.value)} placeholder="e.g. Texas" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Slug</label>
                    <Input required value={stateSlug} onChange={(e) => setStateSlug(e.target.value)} placeholder="e.g. tx" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Status</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={stateStatus} onChange={(e) => setStateStatus(e.target.value as DirectoryStatus)}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Index Control</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={stateIndexed} onChange={(e) => setStateIndexed(e.target.value as IndexControl)}>
                      <option value="INDEX">Index</option>
                      <option value="NOINDEX">Noindex</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Title (SEO Override)</label>
                    <Input value={stateMetaTitle} onChange={(e) => setStateMetaTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Description (SEO Override)</label>
                    <Textarea value={stateMetaDesc} onChange={(e) => setStateMetaDesc(e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-border">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save State"}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsAddingState(false); setEditingState(null); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: CITIES ─── */}
      {activeTab === "cities" && (
        <div className="space-y-6">
          {!isAddingCity && !editingCity ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddCity}>＋ Add City</Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!cities || cities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center italic text-warm py-8">No cities registered.</TableCell>
                      </TableRow>
                    ) : (
                      cities.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell className="font-bold text-left">{city.name}</TableCell>
                          <TableCell className="font-mono text-xs">{city.slug}</TableCell>
                          <TableCell className="font-bold">{city.state.name}</TableCell>
                          <TableCell>{city._count.locations}</TableCell>
                          <TableCell><Badge variant={city.status === "PUBLISHED" ? "success" : "outline"}>{city.status}</Badge></TableCell>
                          <TableCell><Badge variant={city.isIndexed === "INDEX" ? "default" : "secondary"}>{city.isIndexed}</Badge></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCity(city)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCity(city.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <Card className="p-6 max-w-xl mx-auto text-left">
              <form onSubmit={handleCitySubmit} className="space-y-4">
                <h3 className="font-headline font-black text-lg uppercase pb-2 border-b border-border">
                  {editingCity ? `Edit City: ${editingCity.name}` : "Add New City"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Name</label>
                    <Input required value={cityName} onChange={(e) => handleCityNameChange(e.target.value)} placeholder="e.g. Converse" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Slug</label>
                    <Input required value={citySlug} onChange={(e) => setCitySlug(e.target.value)} placeholder="e.g. converse" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">State</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={cityStateId} onChange={(e) => setCityStateId(e.target.value)}>
                      {states?.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Status</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={cityStatus} onChange={(e) => setCityStatus(e.target.value as DirectoryStatus)}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Index Control</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={cityIndexed} onChange={(e) => setCityIndexed(e.target.value as IndexControl)}>
                      <option value="INDEX">Index</option>
                      <option value="NOINDEX">Noindex</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Introductory Copy (Editorial Description)</label>
                    <Textarea value={cityIntro} onChange={(e) => setCityIntro(e.target.value)} rows={3} placeholder="Local copy to render on the city homepage..." />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Title</label>
                    <Input value={cityMetaTitle} onChange={(e) => setCityMetaTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Description</label>
                    <Textarea value={cityMetaDesc} onChange={(e) => setCityMetaDesc(e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-border">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save City"}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsAddingCity(false); setEditingCity(null); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: CATEGORIES ─── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {!isAddingCategory && !editingCategory ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddCategory}>＋ Add Category</Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Businesses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!categories || categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center italic text-warm py-8">No categories registered.</TableCell>
                      </TableRow>
                    ) : (
                      categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-bold text-left">{cat.name}</TableCell>
                          <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                          <TableCell>{cat._count.businesses}</TableCell>
                          <TableCell><Badge variant={cat.status === "PUBLISHED" ? "success" : "outline"}>{cat.status}</Badge></TableCell>
                          <TableCell><Badge variant={cat.isIndexed === "INDEX" ? "default" : "secondary"}>{cat.isIndexed}</Badge></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCategory(cat)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(cat.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <Card className="p-6 max-w-xl mx-auto text-left">
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <h3 className="font-headline font-black text-lg uppercase pb-2 border-b border-border">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Category"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Name</label>
                    <Input required value={catName} onChange={(e) => handleCatNameChange(e.target.value)} placeholder="e.g. Plumbing" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Slug</label>
                    <Input required value={catSlug} onChange={(e) => setCatSlug(e.target.value)} placeholder="e.g. plumbing" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Description (SEO Copy)</label>
                    <Textarea value={catDesc} onChange={(e) => setCatDesc(e.target.value)} rows={3} placeholder="Write a robust category description for indexation rules (>= 100 chars)..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Status</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={catStatus} onChange={(e) => setCatStatus(e.target.value as DirectoryStatus)}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Index Control</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={catIndexed} onChange={(e) => setCatIndexed(e.target.value as IndexControl)}>
                      <option value="INDEX">Index</option>
                      <option value="NOINDEX">Noindex</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Title</label>
                    <Input value={catMetaTitle} onChange={(e) => setCatMetaTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Description</label>
                    <Textarea value={catMetaDesc} onChange={(e) => setCatMetaDesc(e.target.value)} rows={3} />
                  </div>
                </div>
                <div className="flex gap-4 pt-4 border-t border-border">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Category"}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: PROFILES ─── */}
      {activeTab === "profiles" && (
        <div className="space-y-6">
          {!isAddingProfile && !editingProfile ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddProfile}>＋ Add Profile</Button>
              </div>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Name</TableHead>
                      <TableHead>Locations</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Index</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!profiles || profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center italic text-warm py-8">No profiles found.</TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((prof) => (
                        <TableRow key={prof.id}>
                          <TableCell className="font-bold text-left">
                            <div className="space-y-0.5">
                              <span>{prof.name}</span>
                              <span className="block font-mono text-[9px] text-warm uppercase font-bold">slug: {prof.slug}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {prof.locations.map((loc: any) => (
                                <Badge key={loc.id} variant="secondary">{loc.city.name}</Badge>
                              ))}
                              {prof.locations.length === 0 && <span className="text-xs text-warm italic">None</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {prof.categories.map((c: any) => (
                                <Badge key={c.directoryCategoryId} variant="outline">{c.directoryCategory.name}</Badge>
                              ))}
                              {prof.categories.length === 0 && <span className="text-xs text-warm italic">None</span>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant={prof.status === "PUBLISHED" ? "success" : "outline"}>{prof.status}</Badge></TableCell>
                          <TableCell><Badge variant={prof.isIndexed === "INDEX" ? "default" : "secondary"}>{prof.isIndexed}</Badge></TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditProfile(prof)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(prof.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : (
            <Card className="p-6 max-w-2xl mx-auto text-left">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <h3 className="font-headline font-black text-lg uppercase pb-2 border-b border-border">
                  {editingProfile ? `Edit Profile: ${editingProfile.name}` : "Create New Directory Profile"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Business Name</label>
                    <Input required value={profName} onChange={(e) => handleProfNameChange(e.target.value)} />
                  </div>
                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Slug</label>
                    <Input required value={profSlug} onChange={(e) => setProfSlug(e.target.value)} />
                  </div>
                  
                  {/* Contact details */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Phone</label>
                    <Input value={profPhone} onChange={(e) => setProfPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Email</label>
                    <Input type="email" value={profEmail} onChange={(e) => setProfEmail(e.target.value)} />
                  </div>
                  
                  {/* Website & Media */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Website URL</label>
                    <Input type="url" value={profWebsite} onChange={(e) => setProfWebsite(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Logo Image URL</label>
                    <Input type="url" value={profLogo} onChange={(e) => setProfLogo(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Cover Image URL</label>
                    <Input type="url" value={profCover} onChange={(e) => setProfCover(e.target.value)} />
                  </div>

                  {/* Physical Area details */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Physical Address</label>
                    <Input value={profAddress} onChange={(e) => setProfAddress(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Service Area</label>
                    <Input value={profServiceArea} onChange={(e) => setProfServiceArea(e.target.value)} placeholder="e.g. San Antonio Metro Area" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Hours</label>
                    <Input value={profHours} onChange={(e) => setProfHours(e.target.value)} placeholder="e.g. Mon-Fri 8am-5pm" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Preferred Call-to-Action Text</label>
                    <Input value={profCta} onChange={(e) => setProfCta(e.target.value)} placeholder="e.g. Book Appointment" />
                  </div>

                  {/* Description */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Description</label>
                    <Textarea value={profDesc} onChange={(e) => setProfDesc(e.target.value)} rows={3} />
                  </div>

                  {/* Controls */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Directory Status</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={profStatus} onChange={(e) => setProfStatus(e.target.value as DirectoryStatus)}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Index Control</label>
                    <select className="w-full border border-input p-2.5 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={profIndexed} onChange={(e) => setProfIndexed(e.target.value as IndexControl)}>
                      <option value="INDEX">Index</option>
                      <option value="NOINDEX">Noindex</option>
                    </select>
                  </div>

                  {/* SEO Fields */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Title Override</label>
                    <Input value={profMetaTitle} onChange={(e) => setProfMetaTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">Meta Description Override</label>
                    <Textarea value={profMetaDesc} onChange={(e) => setProfMetaDesc(e.target.value)} rows={3} />
                  </div>

                  {/* Locations Assignments */}
                  <div className="space-y-2 md:col-span-2 border-t border-border pt-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-warm">Locations (Cities) Assignment</h4>
                    {!cities || cities.length === 0 ? (
                      <p className="text-xs text-warm italic">No cities created yet. Create a city first.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {cities.map((city) => (
                          <label key={city.id} className="flex items-center gap-2 text-sm select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profCityIds.includes(city.id)}
                              onChange={(e) => handleCityCheckboxChange(city.id, e.target.checked)}
                              className="w-4 h-4 border border-input focus:ring-1"
                            />
                            <span>{city.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Categories Assignments */}
                  <div className="space-y-2 md:col-span-2 border-t border-border pt-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-warm">Categories Assignment</h4>
                    {!categories || categories.length === 0 ? (
                      <p className="text-xs text-warm italic">No categories created yet. Create a category first.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.map((cat) => (
                          <label key={cat.id} className="flex items-center gap-2 text-sm select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={profCategoryIds.includes(cat.id)}
                              onChange={(e) => handleCategoryCheckboxChange(cat.id, e.target.checked)}
                              className="w-4 h-4 border border-input focus:ring-1"
                            />
                            <span>{cat.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border">
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Profile"}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsAddingProfile(false); setEditingProfile(null); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
