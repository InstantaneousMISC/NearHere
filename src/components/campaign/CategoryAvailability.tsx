import Link from "next/link"

interface CategoryDisplay {
  id: string
  name: string
  slug: string
  price: number // cents
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  isAvailable: boolean
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
}

interface CategoryAvailabilityProps {
  spots: Array<{
    id: string
    label: string
    price: number
    spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
    status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
    category: {
      name: string
      slug: string
    }
  }>
  state: string
  city: string
  slug: string
}

export default function CategoryAvailability({ spots, state, city, slug }: CategoryAvailabilityProps) {
  const categoryList: CategoryDisplay[] = spots.map(s => ({
    id: s.id,
    name: s.label,
    slug: s.category.slug,
    price: s.price,
    spotType: s.spotType,
    isAvailable: s.status === "OPEN",
    status: s.status
  }))

  const availableCategories = categoryList.filter(c => c.isAvailable)
  const reservedCategories = categoryList.filter(c => !c.isAvailable)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getSpotTypeBadge = (type: string) => {
    return (
      <span className="bg-stone-bg border border-border text-[8px] font-mono tracking-widest px-2 py-0.5">
        {type}
      </span>
    )
  }

  return (
    <section id="categories" className="py-24 font-sans bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Category Availability
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            One spot per business category.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Lock out your competitors in your target territory. First-come, first-served.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Available Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-primary border-b border-border pb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-none" />
              Available Categories ({availableCategories.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCategories.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold tracking-tight text-slate-900">{cat.name}</span>
                      {getSpotTypeBadge(cat.spotType)}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                      {formatPrice(cat.price)}
                    </div>
                  </div>
                  <Link
                    href={`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/checkout/${cat.id}`}
                    className="inline-flex items-center justify-center bg-foreground text-background font-bold text-xs px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0 uppercase tracking-wider"
                  >
                    Reserve Now
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Reserved Sidebars */}
          <div className="space-y-8">
            {/* Reserved List */}
            <div className="space-y-6">
              <h3 className="text-lg font-mono font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-border rounded-none" />
                Reserved ({reservedCategories.length})
              </h3>
              {reservedCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground italic bg-card border border-dashed border-border p-6 text-center">
                  No categories reserved yet. Be the first to book!
                </p>
              ) : (
                <div className="space-y-3">
                  {reservedCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border border-border bg-stone-bg/50 p-4 opacity-50 font-mono text-xs uppercase"
                    >
                      <span className="font-semibold text-slate-800">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {cat.status === "HELD" ? "HELD" : cat.status === "UNAVAILABLE" ? "CLOSED" : "RESERVED"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restaurant Exclusivity Exemption Info */}
            <div className="border border-foreground bg-card p-6 space-y-4">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                🍽️ Restaurant & Food Rules
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Food and dining categories (restaurants, bakeries, and coffee shops) are the one exception to our single-business category exclusivity rule. 
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Postcard recipients respond best to a choice of dining options, which increases overall engagement and coupon usage for all advertisers on the card.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
