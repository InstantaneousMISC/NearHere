"use client"

interface ValuePropsProps {
  city?: string
  state?: string
}

export default function ValueProps({ city = "" }: ValuePropsProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : "local"

  const benefits = [
    {
      title: "Postcard Placement",
      description: "Mailed directly to nearby households in the campaign area.",
    },
    {
      title: "QR Tracking",
      description: "Your unique QR code connects residents to your campaign destination.",
    },
    {
      title: "Business Profile",
      description: "Your public NearHere profile includes your offer, contact info, service area, and CTA.",
    },
    {
      title: "Website Backlink",
      description: "Your profile can link back to your website to support local online visibility.",
    },
    {
      title: "Done-for-You Setup",
      description: "NearHere handles layout, QR setup, print preparation, and mailing coordination.",
    },
  ]

  return (
    <section id="included" className="border-t border-rule bg-paper text-press">
      <div className="mx-auto grid max-w-7xl gap-8 border-x border-rule px-6 py-20 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label-mono">Inclusions</p>
        </div>
        <div className="md:col-span-8">
          <h2 className="headline-xl text-4xl text-press md:text-5xl">
            What's Included With Every Placement
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-press/75">
            Your placement includes more than postcard exposure. Every advertiser receives a public NearHere Business Profile with their business details, offer, contact information, QR destination, and a link back to their website. This helps customers learn more after scanning the postcard while giving your business another local online presence.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-x border-rule px-6 pb-20">
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit, index) => (
            <div key={benefit.title} className="bg-paper p-6 flex flex-col justify-between h-48">
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] text-nh-red uppercase font-bold">
                  Feature {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="headline-xl mt-3 text-xl text-press">{benefit.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-press/70">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
