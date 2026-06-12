export type ParentCategory =
  | "home-services"
  | "real-estate-financial"
  | "health-wellness-beauty"
  | "food-beverage-hospitality"
  | "automotive"
  | "family-kids-education"
  | "pets"
  | "professional-local-services"
  | "retail-specialty"
  | "senior-community-services";

export interface AdvertiserCategory {
  slug: string;
  label: string;
  parentCategory: ParentCategory;
  headline: string;
  subheadline: string;
  description: string;
  whyItWorks: string[];
  idealOffers: string[];
  benefits: string[];
  exampleAdCopy: {
    headline: string;
    offer: string;
    description: string;
    cta: string;
  };
  suggestedCTA: string;
  seoTitle: string;
  seoDescription: string;
  relatedCategories: string[];
}

export interface CategoryInput {
  slug: string;
  label: string;
  parentCategory: ParentCategory;
  headline?: string;
  subheadline?: string;
  description?: string;
  whyItWorks?: string[];
  idealOffers?: string[];
  exampleAdCopy?: {
    headline: string;
    offer: string;
    description: string;
    cta: string;
  };
  relatedCategories?: string[];
}

// Slug Aliases Map (handles singular/plural variations and common typos)
export const categoryAliases: Record<string, string> = {
  plumbing: "plumbers",
  roofing: "roofers",
  electrical: "electricians",
  realtor: "realtors",
  "real-estate": "realtors",
  "real-estate-team": "real-estate-teams",
  restaurant: "restaurants",
  "med-spa": "med-spas",
  dentist: "dentists",
  dentistry: "dentists",
  "home-cleaning": "house-cleaning",
  "bakery-coffee": "coffee-shops",
  "events-venues": "event-venues",
  "event-venue": "event-venues",
  barbershop: "barbershops",
  gym: "gyms",
  daycare: "daycares",
  veterinarian: "veterinarians",
  attorney: "attorneys",
  accountant: "accountants",
  cpa: "cpas",
  florist: "florists",
  boutique: "boutiques",
  nursery: "nurseries",
};

// Parent Category Templates for generating content dynamically
const parentTemplates: Record<
  ParentCategory,
  {
    needs: string;
    whyItWorks: string[];
    offers: string[];
    adCopy: { headline: string; offer: string; description: string; cta: string };
  }
> = {
  "home-services": {
    needs: "seasonal maintenance, emergency repairs, renovations, and household service visibility",
    whyItWorks: [
      "Home services are highly local and driven by neighborhood proximity and trust.",
      "Physical postcards keep your business details in the home for when repair needs arise.",
      "Direct mail establishes a strong, professional local presence in your target neighborhoods.",
      "QR codes provide a friction-free path to view seasonal specials or request quotes."
    ],
    offers: [
      "$50 off your first service call",
      "10% off any repair or installation",
      "Free initial consultation & estimate",
      "Priority scheduling for NearHere customers"
    ],
    adCopy: {
      headline: "Professional [Label] Services",
      offer: "Mention this card for $50 off your first service.",
      description: "Serving your neighborhood with quality workmanship, reliable scheduling, and expert local professionals.",
      cta: "Scan to claim offer"
    }
  },
  "real-estate-financial": {
    needs: "expert consultations, local market knowledge, and client-focused services",
    whyItWorks: [
      "Real estate and financial services depend on local trust and community credibility.",
      "Direct mail establishes a professional physical presence in your target neighborhoods.",
      "Staying top-of-mind ensures you are called first when major financial decisions arise.",
      "QR codes make it simple for prospects to schedule a call or request market reports."
    ],
    offers: [
      "Free home valuation & market report",
      "No-obligation initial consultation",
      "Complimentary neighborhood sales analysis",
      "Special local resident package discount"
    ],
    adCopy: {
      headline: "Your Local [Label] Specialists",
      offer: "Scan to schedule a free consultation today.",
      description: "Helping our neighbors navigate major life decisions with experienced guidance, local insight, and personal care.",
      cta: "Scan for free consultation"
    }
  },
  "health-wellness-beauty": {
    needs: "personalized care, wellness options, and professional treatments",
    whyItWorks: [
      "Health, wellness, and beauty services are deeply personal and highly local.",
      "A clean, curated postcard layout positions your brand as premium and trustworthy.",
      "Homeowners love discovering high-quality local practitioners and salons near them.",
      "QR codes make scheduling appointments or claiming new client specials seamless."
    ],
    offers: [
      "$20 off your first visit",
      "Free initial consultation for new clients",
      "15% off first treatment or package",
      "Complimentary wellness check with booking"
    ],
    adCopy: {
      headline: "Your Local [Label] Studio",
      offer: "Get $20 off your first appointment.",
      description: "Dedicated to helping you look, feel, and live your best with professional, personalized care in your community.",
      cta: "Scan to book appointment"
    }
  },
  "food-beverage-hospitality": {
    needs: "great flavors, welcoming atmospheres, and local community spaces",
    whyItWorks: [
      "Dining decisions are highly local, and households love supporting neighborhood spots.",
      "Postcard coupons keep your menu top-of-mind when planning lunch or dinner.",
      "QR codes let hungry residents view your menu, order online, or reserve a table instantly.",
      "Combining a print offer with a digital profile maximizes restaurant traffic."
    ],
    offers: [
      "Free appetizer with purchase of two entrees",
      "Buy one entree, get one 50% off",
      "15% off your first online order",
      "Free regular drink with breakfast purchase"
    ],
    adCopy: {
      headline: "Delicious [Label] Nearby",
      offer: "Scan code for a free appetizer with two entrees.",
      description: "Serving fresh ingredients, friendly service, and a welcoming community atmosphere for you and your family.",
      cta: "Scan to view menu"
    }
  },
  "automotive": {
    needs: "reliable auto care, maintenance, and expert local repairs",
    whyItWorks: [
      "Automotive maintenance is a constant requirement for local vehicle owners.",
      "Physical cards are often kept in vehicles or kitchens for the next service due date.",
      "Building local visibility means they call you first when unexpected problems arise.",
      "QR codes connect drivers to book service or claim maintenance discounts easily."
    ],
    offers: [
      "$10 off your next oil change or inspection",
      "10% off any repair or service",
      "Free multi-point safety check",
      "$25 off any service over $150"
    ],
    adCopy: {
      headline: "Reliable [Label] Care",
      offer: "Get $10 off your next service call.",
      description: "Keeping your vehicles safe and running smoothly with expert auto services, repairs, and diagnostics.",
      cta: "Scan to book service"
    }
  },
  "family-kids-education": {
    needs: "trusted instructors, quality care, enrichment programs, and family support",
    whyItWorks: [
      "Parents prioritize nearby, highly-trusted programs for their families.",
      "Postcard mailings introduce your services directly to neighborhood households.",
      "A clean editorial format builds credibility with parents and families.",
      "QR codes give parents a direct path to book a trial or schedule a tour."
    ],
    offers: [
      "Free trial lesson or assessment",
      "Waived registration fee for new families",
      "10% off your first month",
      "Free consultation or evaluation"
    ],
    adCopy: {
      headline: "Trusted [Label] Programs",
      offer: "Scan code for a free trial class.",
      description: "Helping children learn, grow, and thrive with safe, fun, and educational programs near you.",
      cta: "Scan for free trial"
    }
  },
  "pets": {
    needs: "gentle pet care, grooming, training, and veterinary support",
    whyItWorks: [
      "Pet owners treat their pets like family and look for trusted local services.",
      "Direct mail gets your pet services seen in homes with animals.",
      "Staying visible in the community builds long-term client loyalty.",
      "QR codes let pet parents book appointments or view services in seconds."
    ],
    offers: [
      "$15 off your first service or visit",
      "Free pet treat with grooming appointment",
      "10% off your first boarding stay",
      "First exam discount for new clients"
    ],
    adCopy: {
      headline: "Caring [Label] Near You",
      offer: "Get $15 off your first appointment.",
      description: "Dedicated to keeping your pets happy, healthy, and clean with professional care and love.",
      cta: "Scan to book now"
    }
  },
  "professional-local-services": {
    needs: "professional consulting, custom services, and trusted business support",
    whyItWorks: [
      "Local businesses and residents prefer working with service providers in their area.",
      "Direct mail establishes you as a credible, professional local resource.",
      "Staying top-of-mind ensures you get called when professional needs arise.",
      "QR codes offer a friction-free way to schedule a consultation or download guides."
    ],
    offers: [
      "Free initial consultation",
      "$50 off your first project",
      "Complimentary initial audit or review",
      "10% off standard service package"
    ],
    adCopy: {
      headline: "Expert [Label] Services",
      offer: "Scan code for a free initial consultation.",
      description: "Providing experienced, reliable, and professional services to support your personal or business goals.",
      cta: "Scan for free consultation"
    }
  },
  "retail-specialty": {
    needs: "unique products, local shopping options, and resident discounts",
    whyItWorks: [
      "Local shops and stores rely on neighborhood residents for regular foot traffic.",
      "Postcards with discounts encourage residents to visit your physical store.",
      "Curated cards highlight your unique offerings without looking like junk mail.",
      "QR codes connect print readers to browse your online store or claim discounts."
    ],
    offers: [
      "15% off any single item",
      "$10 off purchases of $50 or more",
      "Free gift with first purchase",
      "Exclusive local resident discount"
    ],
    adCopy: {
      headline: "Shop Local at [Label]",
      offer: "Mention this card for 15% off any single item.",
      description: "Featuring a curated selection of quality products, friendly service, and unique local items for you.",
      cta: "Scan to shop now"
    }
  },
  "senior-community-services": {
    needs: "supportive care, community activities, and specialized local support",
    whyItWorks: [
      "Families look for trusted, highly-rated services in their immediate area.",
      "Direct mail reaches households with family members who need local care.",
      "A respectful, clean postcard format builds security and reassurance.",
      "QR codes make it simple for family members to request details or assessments."
    ],
    offers: [
      "Free consultation or home assessment",
      "Waived setup or registration fee",
      "First month discount",
      "Complimentary informational booklet"
    ],
    adCopy: {
      headline: "Compassionate [Label]",
      description: "Providing caring, professional, and reliable support to enrich lives and help our neighbors.",
      offer: "Scan for a free initial consultation.",
      cta: "Scan for free consult"
    }
  }
};

// Raw category entries (150+ categories)
export const rawCategories: CategoryInput[] = [
  // ================= HOME SERVICES =================
  {
    slug: "hvac",
    label: "HVAC Companies",
    parentCategory: "home-services",
    headline: "Postcard Advertising for HVAC Companies",
    subheadline: "Reach nearby homeowners with a trackable local postcard placement built for seasonal tune-ups, repair offers, replacement estimates, and emergency service visibility.",
    description: "NearHere helps HVAC companies get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "HVAC service is often urgent, seasonal, or high-ticket.",
      "Homeowners are more likely to call a company they have seen before.",
      "Direct mail keeps your brand visible before the moment of need.",
      "QR codes give homeowners a fast way to view your offer or contact your team."
    ],
    idealOffers: [
      "$50 off any repair",
      "$49 seasonal tune-up",
      "Free second opinion",
      "Free replacement estimate",
      "Priority scheduling for NearHere customers"
    ],
    exampleAdCopy: {
      headline: "Reliable HVAC Service Near You",
      offer: "Mention this card for $50 off your next repair.",
      description: "Family-owned heating and cooling service for tune-ups, repairs, and replacements that keep your home comfortable year-round.",
      cta: "Scan to claim offer"
    },
    relatedCategories: ["plumbing", "electrical", "roofing", "pest-control"]
  },
  {
    slug: "plumbers",
    label: "Plumbers",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Plumbing Services",
    subheadline: "Reach nearby households with a trackable local postcard placement built for emergency repairs, seasonal inspections, drain cleaning, and local service visibility.",
    description: "NearHere helps plumbing companies get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Plumbing issues are often urgent, requiring immediate local help.",
      "Having your brand physically visible in the home ensures they call you first in an emergency.",
      "Direct mail cuts through online noise and builds long-term local name recognition.",
      "QR codes connect offline mail directly to your booking or emergency hotline page."
    ],
    idealOffers: [
      "$50 off any plumbing repair",
      "$99 drain cleaning special",
      "Free water heater inspection",
      "10% off water filtration systems",
      "Priority scheduling for NearHere customers"
    ],
    exampleAdCopy: {
      headline: "Fast, Reliable Local Plumbing",
      offer: "Mention this card for $50 off any repair.",
      description: "Family-owned plumbing service specializing in repairs, drain cleaning, water heaters, and emergency services.",
      cta: "Scan to request service"
    },
    relatedCategories: ["hvac", "electrical", "water-damage-restoration", "septic-services"]
  },
  {
    slug: "roofers",
    label: "Roofers",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Roofing Contractors",
    subheadline: "Reach nearby homeowners with a trackable local postcard placement built for storm damage inspections, roof repairs, replacements, and local visibility.",
    description: "NearHere helps roofing companies get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Roofing is a high-ticket service where trust and proximity are critical.",
      "Direct mail establishes a strong, professional local presence in your target neighborhoods.",
      "Postcards are ideal for post-storm outreach or seasonal maintenance promotions.",
      "QR codes give homeowners an instant link to request a free roof inspection."
    ],
    idealOffers: [
      "Free roof inspection & storm damage assessment",
      "$250 off complete roof replacement",
      "$100 off any roof repair service",
      "Free gutter inspection with any roof service",
      "Flexible financing options available"
    ],
    exampleAdCopy: {
      headline: "Your Local Roofing Experts",
      offer: "Scan code for a free roof inspection.",
      description: "Licensed & insured roofers specializing in replacements, leak repairs, and storm damage assessments. Quality guaranteed.",
      cta: "Scan for free inspection"
    },
    relatedCategories: ["gutter-cleaning", "siding-contractors", "home-remodeling", "fence-contractors"]
  },
  {
    slug: "electricians",
    label: "Electricians",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Electricians",
    subheadline: "Reach nearby households with a trackable local postcard placement built for safety inspections, panel upgrades, EV charger installations, and repair services.",
    description: "NearHere helps electrical contractors get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Electrical service requires certified, trustworthy local professionals.",
      "Homeowners keep your card handy for future upgrades or unexpected electrical issues.",
      "Exclusive category spots prevent competitor clutter in local mailings.",
      "QR codes make scheduling an inspection or booking a service appointment simple."
    ],
    idealOffers: [
      "$50 off any electrical repair",
      "Free electrical safety inspection",
      "$100 off panel upgrades",
      "$75 off EV charger installation",
      "10% off new lighting installations"
    ],
    exampleAdCopy: {
      headline: "Safe & Certified Local Electricians",
      offer: "Get $50 off your first service call.",
      description: "Specializing in panel upgrades, wiring, lighting installation, and smart home setup. Safe, clean, and reliable.",
      cta: "Scan to book online"
    },
    relatedCategories: ["hvac", "plumbing", "security-systems", "home-remodeling"]
  },
  {
    slug: "pest-control",
    label: "Pest Control",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Pest Control",
    subheadline: "Reach nearby households with a trackable local postcard placement built for seasonal bug treatments, termite inspections, rodent control, and mosquito prevention.",
    description: "NearHere helps pest control companies get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Pest control requires regular seasonal treatments to keep homes pest-free.",
      "Physical postcards remind homeowners of seasonal pest threats (termites, mosquitoes).",
      "Route density helps lower travel costs and increase local profitability.",
      "QR codes allow residents to instantly schedule an inspection or claim a seasonal offer."
    ],
    idealOffers: [
      "$50 off initial pest control service",
      "Free termite inspection",
      "First mosquito treatment for $39",
      "10% off annual pest protection plans",
      "Free pest evaluation for NearHere customers"
    ],
    exampleAdCopy: {
      headline: "Keep Your Home Pest-Free",
      offer: "Mention this card for $50 off your first service.",
      description: "Safe, effective pest control solutions for ants, termites, rodents, and spiders. Family and pet friendly treatments.",
      cta: "Scan to claim offer"
    },
    relatedCategories: ["lawn-care", "landscaping", "tree-service", "home-inspectors"]
  },
  {
    slug: "lawn-care",
    label: "Lawn Care",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Lawn Care",
    subheadline: "Reach nearby homeowners with a trackable local postcard placement built for seasonal cleanups, weekly maintenance, fertilization, and landscape projects.",
    description: "NearHere helps lawn care companies get mailed into target neighborhoods with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Lawn care services benefit heavily from neighborhood density and route efficiency.",
      "Homeowners see your trucks in the neighborhood and receive your postcard in the mail.",
      "Direct mail is perfect for seasonal promotions (spring cleanup, fall prep, weed control).",
      "QR codes connect homeowners directly to request an instant lawn service estimate."
    ],
    idealOffers: [
      "First lawn mow for only $19.99",
      "10% off seasonal yard cleanup",
      "Free lawn fertilization with monthly service",
      "Free aeration with annual agreement",
      "Priority scheduling for NearHere customers"
    ],
    exampleAdCopy: {
      headline: "Greener Lawns, Simpler Living",
      offer: "Scan code for a free lawn care quote.",
      description: "Professional lawn maintenance, aeration, fertilization, and custom mowing schedules tailored for your home.",
      cta: "Scan for free quote"
    },
    relatedCategories: ["landscaping", "tree-service", "pest-control", "pressure-washing"]
  },
  {
    slug: "landscaping",
    label: "Landscaping",
    parentCategory: "home-services",
    headline: "Postcard Advertising for Landscaping Services",
    subheadline: "Reach nearby homeowners with a trackable local postcard placement built for custom design, sod installation, seasonal mulch, and hardscape construction.",
    description: "NearHere helps landscaping companies get mailed into target neighborhoods with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Landscaping is a visual, high-ticket home improvement service.",
      "Physical postcards keep your portfolio and offers in front of local homeowners.",
      "Targeted neighborhood mailings allow you to build route density.",
      "QR codes connect readers directly to your project request page."
    ],
    idealOffers: [
      "10% off mulching and flowerbed cleanup",
      "$100 off any project over $1,000",
      "$250 off custom patio or hardscape construction",
      "Free custom landscape design consultation",
      "Free sod installation estimate"
    ],
    exampleAdCopy: {
      headline: "Beautiful Local Landscaping",
      offer: "Scan code for a free landscape design consult.",
      description: "Custom landscape design, mulching, sod installation, and hardscape construction to transform your outdoor living spaces.",
      cta: "Scan for free consult"
    },
    relatedCategories: ["lawn-care", "tree-service", "outdoor-living-contractors", "deck-builders"]
  },

  // Other Home Services (using template generator)
  { slug: "tree-service", label: "Tree Service", parentCategory: "home-services" },
  { slug: "pool-service", label: "Pool Service", parentCategory: "home-services" },
  { slug: "garage-door-repair", label: "Garage Door Repair", parentCategory: "home-services" },
  { slug: "pressure-washing", label: "Pressure Washing", parentCategory: "home-services" },
  { slug: "window-cleaning", label: "Window Cleaning", parentCategory: "home-services" },
  { slug: "house-cleaning", label: "House Cleaning", parentCategory: "home-services" },
  { slug: "carpet-cleaning", label: "Carpet Cleaning", parentCategory: "home-services" },
  { slug: "gutter-cleaning", label: "Gutter Cleaning", parentCategory: "home-services" },
  { slug: "handyman-services", label: "Handyman Services", parentCategory: "home-services" },
  { slug: "home-remodeling", label: "Home Remodeling", parentCategory: "home-services" },
  { slug: "kitchen-remodeling", label: "Kitchen Remodeling", parentCategory: "home-services" },
  { slug: "bathroom-remodeling", label: "Bathroom Remodeling", parentCategory: "home-services" },
  { slug: "flooring", label: "Flooring Contractors", parentCategory: "home-services" },
  { slug: "painting", label: "Painting Contractors", parentCategory: "home-services" },
  { slug: "fence-contractors", label: "Fence Contractors", parentCategory: "home-services" },
  { slug: "deck-builders", label: "Deck Builders", parentCategory: "home-services" },
  { slug: "concrete-contractors", label: "Concrete Contractors", parentCategory: "home-services" },
  { slug: "masonry", label: "Masonry Contractors", parentCategory: "home-services" },
  { slug: "siding-contractors", label: "Siding Contractors", parentCategory: "home-services" },
  { slug: "solar-installers", label: "Solar Installers", parentCategory: "home-services" },
  { slug: "security-systems", label: "Security Systems", parentCategory: "home-services" },
  { slug: "locksmiths", label: "Locksmiths", parentCategory: "home-services" },
  { slug: "appliance-repair", label: "Appliance Repair", parentCategory: "home-services" },
  { slug: "septic-services", label: "Septic Services", parentCategory: "home-services" },
  { slug: "water-damage-restoration", label: "Water Damage Restoration", parentCategory: "home-services" },
  { slug: "mold-remediation", label: "Mold Remediation", parentCategory: "home-services" },
  { slug: "junk-removal", label: "Junk Removal", parentCategory: "home-services" },
  { slug: "moving-companies", label: "Moving Companies", parentCategory: "home-services" },
  { slug: "storage-facilities", label: "Storage Facilities", parentCategory: "home-services" },
  { slug: "home-inspectors", label: "Home Inspectors", parentCategory: "home-services" },
  { slug: "insulation-contractors", label: "Insulation Contractors", parentCategory: "home-services" },
  { slug: "foundation-repair", label: "Foundation Repair", parentCategory: "home-services" },
  { slug: "irrigation-services", label: "Irrigation Services", parentCategory: "home-services" },
  { slug: "holiday-light-installation", label: "Holiday Light Installation", parentCategory: "home-services" },
  { slug: "chimney-sweeps", label: "Chimney Sweeps", parentCategory: "home-services" },
  { slug: "window-replacement", label: "Window Replacement", parentCategory: "home-services" },
  { slug: "door-installation", label: "Door Installation", parentCategory: "home-services" },
  { slug: "custom-shelving", label: "Custom Shelving", parentCategory: "home-services" },
  { slug: "garage-storage", label: "Garage Storage", parentCategory: "home-services" },
  { slug: "shed-builders", label: "Shed Builders", parentCategory: "home-services" },
  { slug: "outdoor-living-contractors", label: "Outdoor Living Contractors", parentCategory: "home-services" },

  // ================= REAL ESTATE & FINANCIAL =================
  {
    slug: "realtors",
    label: "Realtors",
    parentCategory: "real-estate-financial",
    headline: "Postcard Advertising for Realtors",
    subheadline: "Reach nearby homeowners with a trackable local postcard placement built for local listings, market updates, home valuations, and neighborhood expertise.",
    description: "NearHere helps real estate agents build hyper-local presence in target neighborhoods with public business profiles, backlinks, and postcard campaigns.",
    whyItWorks: [
      "Real estate is built on hyper-local presence and community trust.",
      "Mailing consistent neighborhoods positions you as the default listing agent.",
      "QR tracking allows homeowners to easily view active listings or request a home value report.",
      "Your backlink and profile strengthen your local digital footprint."
    ],
    idealOffers: [
      "Free home valuation & market report",
      "Free home staging consultation",
      "Detailed neighborhood sales report",
      "Complimentary professional photography package",
      "No-obligation real estate consultation"
    ],
    exampleAdCopy: {
      headline: "Your Local Real Estate Expert",
      offer: "Scan to see what your home is worth today.",
      description: "Helping neighbors buy and sell homes with dedicated service, local expertise, and proven marketing strategies.",
      cta: "Scan for free valuation"
    },
    relatedCategories: ["real-estate-teams", "mortgage-brokers", "property-managers", "home-stagers"]
  },
  { slug: "real-estate-teams", label: "Real Estate Teams", parentCategory: "real-estate-financial" },
  { slug: "mortgage-brokers", label: "Mortgage Brokers", parentCategory: "real-estate-financial" },
  { slug: "insurance-agents", label: "Insurance Agents", parentCategory: "real-estate-financial" },
  { slug: "title-companies", label: "Title Companies", parentCategory: "real-estate-financial" },
  { slug: "property-managers", label: "Property Managers", parentCategory: "real-estate-financial" },
  { slug: "home-stagers", label: "Home Stagers", parentCategory: "real-estate-financial" },
  { slug: "real-estate-photographers", label: "Real Estate Photographers", parentCategory: "real-estate-financial" },
  { slug: "apartment-locators", label: "Apartment Locators", parentCategory: "real-estate-financial" },
  { slug: "financial-advisors", label: "Financial Advisors", parentCategory: "real-estate-financial" },
  { slug: "tax-preparers", label: "Tax Preparers", parentCategory: "real-estate-financial" },
  { slug: "bookkeepers", label: "Bookkeepers", parentCategory: "real-estate-financial" },
  { slug: "credit-repair", label: "Credit Repair", parentCategory: "real-estate-financial" },
  { slug: "estate-planning-attorneys", label: "Estate Planning Attorneys", parentCategory: "real-estate-financial" },
  { slug: "local-banks", label: "Local Banks", parentCategory: "real-estate-financial" },
  { slug: "credit-unions", label: "Credit Unions", parentCategory: "real-estate-financial" },

  // ================= HEALTH, WELLNESS & BEAUTY =================
  {
    slug: "dentists",
    label: "Dentists",
    parentCategory: "health-wellness-beauty",
    headline: "Postcard Advertising for Dental Practices",
    subheadline: "Reach nearby families with a trackable local postcard placement built for new patient specials, routine cleaning packages, and emergency dental care.",
    description: "NearHere helps dentists get mailed to nearby households with a clear offer, QR code, website backlink, and custom business profile.",
    whyItWorks: [
      "Dentistry is highly local; families prefer dentists within a 10-minute drive.",
      "Shared postcards build local name recognition before an oral care emergency occurs.",
      "QR codes make it simple for busy parents to request an appointment instantly.",
      "One dentist per category protects your market share in the neighborhood drop."
    ],
    idealOffers: [
      "$79 new patient exam, x-rays, and cleaning",
      "Free cosmetic dentistry consultation",
      "Complimentary professional whitening for new patients",
      "$500 off Invisalign treatment packages",
      "Free dental evaluation for emergency visits"
    ],
    exampleAdCopy: {
      headline: "Gentle Dental Care for Families",
      offer: "Scan code for $79 new patient special.",
      description: "Providing friendly, comprehensive dental care, routine cleanings, teeth whitening, and emergency dentistry near you.",
      cta: "Scan for new patient offer"
    },
    relatedCategories: ["pediatric-dentists", "orthodontists", "chiropractors", "eye-care-clinics"]
  },
  {
    slug: "med-spas",
    label: "Med Spas",
    parentCategory: "health-wellness-beauty",
    headline: "Postcard Advertising for Med Spas",
    subheadline: "Reach nearby households with a trackable local postcard placement built for skin treatments, cosmetic procedures, facial injectables, and wellness services.",
    description: "NearHere helps med spas get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Med spa clients are loyal, local, and look for premium, trusted providers.",
      "Shared postcards present your services in a high-end, uncluttered layout.",
      "QR codes let clients easily book consults, view before-and-afters, or buy packages.",
      "Establishing local digital presence with backlinks supports local search visibility."
    ],
    idealOffers: [
      "$50 off your first treatment",
      "Complimentary skin analysis & consultation",
      "15% off laser hair removal packages",
      "Free upgrade to premium facial",
      "Special introductory pricing on injectables"
    ],
    exampleAdCopy: {
      headline: "Rejuvenate Your Skin Locally",
      offer: "Get $50 off your first treatment.",
      description: "Professional aesthetic treatments, laser therapies, facial rejuvenation, and wellness programs designed for you.",
      cta: "Scan to book consult"
    },
    relatedCategories: ["hair-salons", "nail-salons", "massage-therapy", "dermatology-clinics"]
  },
  { slug: "orthodontists", label: "Orthodontists", parentCategory: "health-wellness-beauty" },
  { slug: "chiropractors", label: "Chiropractors", parentCategory: "health-wellness-beauty" },
  { slug: "physical-therapy-clinics", label: "Physical Therapy Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "hair-salons", label: "Hair Salons", parentCategory: "health-wellness-beauty" },
  { slug: "barbershops", label: "Barbershops", parentCategory: "health-wellness-beauty" },
  { slug: "nail-salons", label: "Nail Salons", parentCategory: "health-wellness-beauty" },
  { slug: "massage-therapy", label: "Massage Therapy", parentCategory: "health-wellness-beauty" },
  { slug: "fitness-studios", label: "Fitness Studios", parentCategory: "health-wellness-beauty" },
  { slug: "gyms", label: "Gyms & Fitness Centers", parentCategory: "health-wellness-beauty" },
  { slug: "yoga-studios", label: "Yoga Studios", parentCategory: "health-wellness-beauty" },
  { slug: "personal-trainers", label: "Personal Trainers", parentCategory: "health-wellness-beauty" },
  { slug: "weight-loss-clinics", label: "Weight Loss Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "nutritionists", label: "Nutritionists", parentCategory: "health-wellness-beauty" },
  { slug: "eye-care-clinics", label: "Eye Care Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "hearing-aid-clinics", label: "Hearing Aid Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "dermatology-clinics", label: "Dermatology Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "urgent-care-clinics", label: "Urgent Care Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "pediatric-clinics", label: "Pediatric Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "mental-health-counselors", label: "Mental Health Counselors", parentCategory: "health-wellness-beauty" },
  { slug: "iv-therapy-clinics", label: "IV Therapy Clinics", parentCategory: "health-wellness-beauty" },
  { slug: "cryotherapy", label: "Cryotherapy Centers", parentCategory: "health-wellness-beauty" },
  { slug: "tattoo-shops", label: "Tattoo Shops", parentCategory: "health-wellness-beauty" },

  // ================= FOOD, BEVERAGE & HOSPITALITY =================
  {
    slug: "restaurants",
    label: "Restaurants",
    parentCategory: "food-beverage-hospitality",
    headline: "Postcard Advertising for Restaurants",
    subheadline: "Reach nearby households with a trackable local postcard placement built for special menus, neighborhood dining offers, catering, and local food visibility.",
    description: "NearHere helps restaurants and cafes get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.",
    whyItWorks: [
      "Dining decisions are highly local, and households love supporting neighborhood spots.",
      "Postcard coupons keep your restaurant top-of-mind when planning lunch or dinner.",
      "QR codes let hungry residents view your menu, order online, or reserve a table instantly.",
      "Combining a print offer with a digital profile maximizes restaurant traffic."
    ],
    idealOffers: [
      "Free appetizer with purchase of two entrees",
      "Buy one entree, get one 50% off",
      "15% off your first online order",
      "Free regular coffee with any breakfast plate",
      "Complimentary dessert on your birthday"
    ],
    exampleAdCopy: {
      headline: "Fresh Local Flavors Nearby",
      offer: "Scan to view menu & get a free appetizer.",
      description: "Family-friendly dining featuring fresh ingredients, daily specials, craft beers, and delicious desserts.",
      cta: "Scan for free appetizer"
    },
    relatedCategories: ["coffee-shops", "breweries", "pizza-shops", "catering-companies"]
  },
  { slug: "coffee-shops", label: "Coffee Shops", parentCategory: "food-beverage-hospitality" },
  { slug: "bakeries", label: "Bakeries", parentCategory: "food-beverage-hospitality" },
  { slug: "pizza-shops", label: "Pizza Shops", parentCategory: "food-beverage-hospitality" },
  { slug: "food-trucks", label: "Food Trucks", parentCategory: "food-beverage-hospitality" },
  { slug: "ice-cream-shops", label: "Ice Cream Shops", parentCategory: "food-beverage-hospitality" },
  { slug: "juice-bars", label: "Juice Bars", parentCategory: "food-beverage-hospitality" },
  { slug: "smoothie-shops", label: "Smoothie Shops", parentCategory: "food-beverage-hospitality" },
  { slug: "bars", label: "Bars & Pubs", parentCategory: "food-beverage-hospitality" },
  { slug: "breweries", label: "Breweries", parentCategory: "food-beverage-hospitality" },
  { slug: "catering-companies", label: "Catering Companies", parentCategory: "food-beverage-hospitality" },
  { slug: "meal-prep-services", label: "Meal Prep Services", parentCategory: "food-beverage-hospitality" },
  { slug: "event-venues", label: "Event Venues", parentCategory: "food-beverage-hospitality" },
  { slug: "hotels", label: "Hotels", parentCategory: "food-beverage-hospitality" },
  { slug: "bed-and-breakfasts", label: "Bed & Breakfasts", parentCategory: "food-beverage-hospitality" },

  // ================= AUTOMOTIVE =================
  {
    slug: "auto-repair",
    label: "Auto Repair Shops",
    parentCategory: "automotive",
    headline: "Postcard Advertising for Auto Repair Shops",
    subheadline: "Reach local vehicle owners with a trackable postcard placement built for oil changes, brake repairs, diagnostics, and routine maintenance.",
    description: "NearHere helps local mechanics get mailed to nearby households with exclusive category placements, QR tracking, and public business profiles.",
    whyItWorks: [
      "Most drivers choose repair shops within a 5-mile radius of their home or work.",
      "Physical postcards keep your shop's contact information visible in the kitchen drawer.",
      "QR codes provide a fast booking path for vehicle service, oil changes, or alignments.",
      "Category exclusivity blocks competitors from mailing on the same card."
    ],
    idealOffers: [
      "$15 off any oil change and filter service",
      "Free brake inspection with any service",
      "10% off mechanical repair services",
      "$50 off diagnostic and electrical check",
      "Special seasonal package pricing"
    ],
    exampleAdCopy: {
      headline: "Quality Auto Repair Nearby",
      offer: "Mention this card for $15 off your next service.",
      description: "ASE-certified technicians for oil changes, brake service, tune-ups, and emergency repairs. Fair pricing and quality guaranteed.",
      cta: "Scan to schedule repair"
    },
    relatedCategories: ["oil-change-shops", "tire-shops", "car-washes", "towing-companies"]
  },
  { slug: "oil-change-shops", label: "Oil Change Shops", parentCategory: "automotive" },
  { slug: "tire-shops", label: "Tire Shops", parentCategory: "automotive" },
  { slug: "car-washes", label: "Car Washes", parentCategory: "automotive" },
  { slug: "auto-detailers", label: "Auto Detailers", parentCategory: "automotive" },
  { slug: "collision-repair", label: "Collision Repair", parentCategory: "automotive" },
  { slug: "window-tinting", label: "Window Tinting", parentCategory: "automotive" },
  { slug: "car-audio-shops", label: "Car Audio Shops", parentCategory: "automotive" },
  { slug: "used-car-dealers", label: "Used Car Dealers", parentCategory: "automotive" },
  { slug: "motorcycle-repair", label: "Motorcycle Repair", parentCategory: "automotive" },
  { slug: "rv-repair", label: "RV Repair Shops", parentCategory: "automotive" },
  { slug: "towing-companies", label: "Towing Companies", parentCategory: "automotive" },
  { slug: "mobile-mechanics", label: "Mobile Mechanics", parentCategory: "automotive" },
  { slug: "auto-glass-repair", label: "Auto Glass Repair", parentCategory: "automotive" },

  // ================= FAMILY, KIDS & EDUCATION =================
  {
    slug: "daycares",
    label: "Daycares",
    parentCategory: "family-kids-education",
    headline: "Postcard Advertising for Daycare & Preschools",
    subheadline: "Reach nearby families with a trackable local postcard placement built for early education enrollments, infant care, and after-school programs.",
    description: "NearHere helps child care providers reach local families with targeted postcard drops, unique booking links, and digital business profiles.",
    whyItWorks: [
      "Parents prefer local child care close to home for simpler morning commutes.",
      "Physical postcards establish a friendly, professional presence directly in family mailboxes.",
      "QR codes make it simple for busy parents to schedule facility tours online.",
      "Digital backlinks and profiles help parents research and read about your center."
    ],
    idealOffers: [
      "Waived registration fee ($100 value) for new enrollments",
      "Free trial day for preschool placement",
      "10% off your first month of child care",
      "Free parent informational pack & curriculum guide",
      "Priority registration slot booking"
    ],
    exampleAdCopy: {
      headline: "Trusted Local Child Care",
      offer: "Scan code to book a tour & waive registration.",
      description: "Safe, nurturing environment with educational programs, certified teachers, and flexible child care schedules.",
      cta: "Scan to schedule tour"
    },
    relatedCategories: ["preschools", "private-schools", "tutoring-services", "swim-schools"]
  },
  { slug: "preschools", label: "Preschools", parentCategory: "family-kids-education" },
  { slug: "private-schools", label: "Private Schools", parentCategory: "family-kids-education" },
  { slug: "tutoring-services", label: "Tutoring Services", parentCategory: "family-kids-education" },
  { slug: "music-lessons", label: "Music Lessons", parentCategory: "family-kids-education" },
  { slug: "dance-studios", label: "Dance Studios", parentCategory: "family-kids-education" },
  { slug: "martial-arts-schools", label: "Martial Arts Schools", parentCategory: "family-kids-education" },
  { slug: "swim-schools", label: "Swim Schools", parentCategory: "family-kids-education" },
  { slug: "sports-training", label: "Sports Training", parentCategory: "family-kids-education" },
  { slug: "kids-party-venues", label: "Kids Party Venues", parentCategory: "family-kids-education" },
  { slug: "pediatric-dentists", label: "Pediatric Dentists", parentCategory: "family-kids-education" },
  { slug: "family-photographers", label: "Family Photographers", parentCategory: "family-kids-education" },

  // ================= PETS =================
  {
    slug: "veterinarians",
    label: "Veterinarians",
    parentCategory: "pets",
    headline: "Postcard Advertising for Veterinary Clinics",
    subheadline: "Reach local pet parents with a trackable postcard placement built for new client exams, preventative care plans, and dental hygiene checkups.",
    description: "NearHere helps vet clinics mail to surrounding neighborhoods, establishing local trust with digital profiles and backlink listings.",
    whyItWorks: [
      "Pet parents seek top-quality, convenient veterinary care in their local community.",
      "Postcards highlight new client specials and display your contact info where owners see it daily.",
      "QR codes make scheduling appointments or registering new pets friction-free.",
      "Your backlink helps build a strong local web presence to rank in map searches."
    ],
    idealOffers: [
      "$25 off your first comprehensive vet exam",
      "Free dental health evaluation for pets",
      "10% off preventative care annual plans",
      "Free initial consultation for new clients",
      "Complimentary pet treats with first appointment"
    ],
    exampleAdCopy: {
      headline: "Compassionate Veterinary Care",
      offer: "Scan code for $25 off first comprehensive exam.",
      description: "Dedicated to keeping your pets healthy with wellness exams, vaccines, dental cleanings, and urgent care services.",
      cta: "Scan to book appointment"
    },
    relatedCategories: ["pet-groomers", "dog-daycare", "pet-boarding", "dog-trainers"]
  },
  { slug: "pet-groomers", label: "Pet Groomers", parentCategory: "pets" },
  { slug: "dog-trainers", label: "Dog Trainers", parentCategory: "pets" },
  { slug: "dog-daycare", label: "Dog Daycare", parentCategory: "pets" },
  { slug: "pet-boarding", label: "Pet Boarding", parentCategory: "pets" },
  { slug: "mobile-pet-grooming", label: "Mobile Pet Grooming", parentCategory: "pets" },
  { slug: "pet-stores", label: "Pet Stores", parentCategory: "pets" },
  { slug: "pet-waste-removal", label: "Pet Waste Removal", parentCategory: "pets" },

  // ================= PROFESSIONAL & LOCAL SERVICES =================
  {
    slug: "attorneys",
    label: "Attorneys",
    parentCategory: "professional-local-services",
    headline: "Postcard Advertising for Law Firms & Attorneys",
    subheadline: "Reach local residents with a trackable postcard placement built for estate planning, family law, personal injury, and business legal consultations.",
    description: "NearHere helps local lawyers build professional name recognition in surrounding communities with direct mail and web backlinks.",
    whyItWorks: [
      "Legal matters are sensitive; clients hire attorneys who feel familiar and accessible.",
      "Direct mail establishes a professional, credible physical presence in the community.",
      "Postcards keep your name visible in the home long before a legal crisis emerges.",
      "QR codes allow readers to request free case evaluations or schedule consultations."
    ],
    idealOffers: [
      "Free initial legal consultation",
      "$100 off estate planning or will packages",
      "Free case valuation & review",
      "Complimentary legal guide on local estate planning",
      "Special local resident package pricing"
    ],
    exampleAdCopy: {
      headline: "Experienced Local Legal Support",
      offer: "Scan code for a free initial consultation.",
      description: "Compassionate, reliable representation for estate planning, wills, trusts, family law, and contract reviews.",
      cta: "Scan for free consultation"
    },
    relatedCategories: ["accountants", "cpas", "notaries", "business-consultants"]
  },
  { slug: "accountants", label: "Accountants", parentCategory: "professional-local-services" },
  { slug: "cpas", label: "CPAs", parentCategory: "professional-local-services" },
  { slug: "notaries", label: "Notaries", parentCategory: "professional-local-services" },
  { slug: "printing-shops", label: "Printing Shops", parentCategory: "professional-local-services" },
  { slug: "marketing-agencies", label: "Marketing Agencies", parentCategory: "professional-local-services" },
  { slug: "web-designers", label: "Web Designers", parentCategory: "professional-local-services" },
  { slug: "it-support", label: "IT Support Services", parentCategory: "professional-local-services" },
  { slug: "computer-repair", label: "Computer Repair", parentCategory: "professional-local-services" },
  { slug: "business-consultants", label: "Business Consultants", parentCategory: "professional-local-services" },
  { slug: "hr-consultants", label: "HR Consultants", parentCategory: "professional-local-services" },
  { slug: "staffing-agencies", label: "Staffing Agencies", parentCategory: "professional-local-services" },
  { slug: "photography-studios", label: "Photography Studios", parentCategory: "professional-local-services" },
  { slug: "videographers", label: "Videographers", parentCategory: "professional-local-services" },
  { slug: "event-planners", label: "Event Planners", parentCategory: "professional-local-services" },
  { slug: "wedding-planners", label: "Wedding Planners", parentCategory: "professional-local-services" },
  { slug: "florists", label: "Florists", parentCategory: "professional-local-services" },

  // ================= RETAIL & SPECIALTY =================
  { slug: "furniture-stores", label: "Furniture Stores", parentCategory: "retail-specialty" },
  { slug: "mattress-stores", label: "Mattress Stores", parentCategory: "retail-specialty" },
  { slug: "appliance-stores", label: "Appliance Stores", parentCategory: "retail-specialty" },
  { slug: "flooring-stores", label: "Flooring Stores", parentCategory: "retail-specialty" },
  { slug: "hardware-stores", label: "Hardware Stores", parentCategory: "retail-specialty" },
  { slug: "garden-centers", label: "Garden Centers", parentCategory: "retail-specialty" },
  { slug: "nurseries", label: "Plant Nurseries", parentCategory: "retail-specialty" },
  { slug: "boutiques", label: "Clothing Boutiques", parentCategory: "retail-specialty" },
  { slug: "gift-shops", label: "Gift Shops", parentCategory: "retail-specialty" },
  { slug: "jewelry-stores", label: "Jewelry Stores", parentCategory: "retail-specialty" },
  { slug: "bike-shops", label: "Bike Shops", parentCategory: "retail-specialty" },
  { slug: "sporting-goods-stores", label: "Sporting Goods", parentCategory: "retail-specialty" },
  { slug: "smoke-shops", label: "Smoke Shops", parentCategory: "retail-specialty" },
  { slug: "cbd-shops", label: "CBD Shops", parentCategory: "retail-specialty" },
  { slug: "thrift-stores", label: "Thrift Stores", parentCategory: "retail-specialty" },
  { slug: "consignment-shops", label: "Consignment Shops", parentCategory: "retail-specialty" },
  { slug: "farmers-markets", label: "Farmers Markets", parentCategory: "retail-specialty" },
  { slug: "local-makers", label: "Local Makers", parentCategory: "retail-specialty" },
  { slug: "art-studios", label: "Art Studios", parentCategory: "retail-specialty" },

  // ================= SENIOR & COMMUNITY SERVICES =================
  { slug: "senior-care", label: "Senior Care Services", parentCategory: "senior-community-services" },
  { slug: "home-health-care", label: "Home Health Care", parentCategory: "senior-community-services" },
  { slug: "assisted-living", label: "Assisted Living Facilities", parentCategory: "senior-community-services" },
  { slug: "hospice-care", label: "Hospice Care", parentCategory: "senior-community-services" },
  { slug: "medical-alert-systems", label: "Medical Alert Systems", parentCategory: "senior-community-services" },
  { slug: "mobility-equipment", label: "Mobility Equipment", parentCategory: "senior-community-services" },
  { slug: "meal-delivery", label: "Meal Delivery", parentCategory: "senior-community-services" },
  { slug: "transportation-services", label: "Transportation Services", parentCategory: "senior-community-services" },
  { slug: "nonprofits", label: "Nonprofit Organizations", parentCategory: "senior-community-services" },
  { slug: "churches", label: "Local Churches", parentCategory: "senior-community-services" },
  { slug: "community-organizations", label: "Community Organizations", parentCategory: "senior-community-services" }
];

// Reusable standard benefits for every placement
export const standardBenefits = [
  "Premium shared postcard placement",
  "Unique QR code & activity tracking page",
  "Public NearHere Business Profile",
  "Website backlink included",
  "Local offer and phone CTA display",
  "Basic scan/activity analytics dashboard",
  "Done-for-you professional design coordination",
  "Printing, postage, and mailing coordination"
];

// Helper to compile Category Input into full AdvertiserCategory data
function compileCategory(input: CategoryInput): AdvertiserCategory {
  const template = parentTemplates[input.parentCategory];
  const label = input.label;

  // Wording generator helpers
  const headline = input.headline || `Postcard Advertising for ${label}`;
  const subheadline =
    input.subheadline ||
    `Reach nearby households with a trackable local postcard placement built for ${template.needs}. Every NearHere placement includes a QR code, public business profile, website backlink, local offer, and basic campaign tracking.`;
  const description =
    input.description ||
    `NearHere helps ${label.toLowerCase()} get mailed into nearby homes with a clear offer, QR code, public business profile, website backlink, and basic campaign tracking.`;

  // Why it works: replace placeholders in parent template
  const whyItWorks =
    input.whyItWorks ||
    template.whyItWorks.map((str) => str.replace("[Label]", label));

  // Ideal offers: fallback to parent template offers
  const idealOffers = input.idealOffers || template.offers;

  // Example Ad copy mapping
  const adCopyInput = input.exampleAdCopy || template.adCopy;
  const exampleAdCopy = {
    headline: adCopyInput.headline.replace("[Label]", label),
    offer: adCopyInput.offer.replace("[Label]", label),
    description: adCopyInput.description.replace("[Label]", label),
    cta: adCopyInput.cta
  };

  const seoTitle = `Postcard Advertising for ${label} | NearHere`;
  const seoDescription = `NearHere helps ${label.toLowerCase()} reach nearby households with shared postcard campaigns, QR tracking, public business profiles, website backlinks, local offers, and done-for-you mailing.`;

  // Related categories fallback
  const relatedCategories =
    input.relatedCategories ||
    rawCategories
      .filter((c) => c.parentCategory === input.parentCategory && c.slug !== input.slug)
      .slice(0, 4)
      .map((c) => c.slug);

  return {
    slug: input.slug,
    label,
    parentCategory: input.parentCategory,
    headline,
    subheadline,
    description,
    whyItWorks,
    idealOffers,
    benefits: standardBenefits,
    exampleAdCopy,
    suggestedCTA: "Find a Campaign Near You",
    seoTitle,
    seoDescription,
    relatedCategories
  };
}

// Compile all categories and build maps for quick lookup
const compiledCategoryMap: Record<string, AdvertiserCategory> = {};

rawCategories.forEach((input) => {
  compiledCategoryMap[input.slug] = compileCategory(input);
});

// Getter helper supporting slug translation & alias lookups
export function getAdvertiserCategory(slug: string): AdvertiserCategory | undefined {
  const normalizedSlug = slug.toLowerCase().trim();
  const targetSlug = categoryAliases[normalizedSlug] || normalizedSlug;
  return compiledCategoryMap[targetSlug];
}

// Listing helper to get all compiled categories
export function getAllAdvertiserCategories(): AdvertiserCategory[] {
  return Object.values(compiledCategoryMap);
}

// Helper to look up a category by arbitrary input name (fuzzy / name matching)
export function findCategoryByName(name: string): AdvertiserCategory | undefined {
  if (!name) return undefined;
  
  const normalized = name.toLowerCase().trim();
  
  // 1. Check exact slug or alias translation
  let cat = getAdvertiserCategory(normalized);
  if (cat) return cat;
  
  // 2. Check exact matching against labels
  const allCategories = getAllAdvertiserCategories();
  cat = allCategories.find((c) => c.label.toLowerCase() === normalized);
  if (cat) return cat;

  // 3. Match on plural/singular forms or sub-string compatibility
  cat = allCategories.find((c) => {
    const labelLower = c.label.toLowerCase();
    const slugLower = c.slug.toLowerCase();
    return (
      normalized.includes(labelLower) ||
      labelLower.includes(normalized) ||
      normalized.includes(slugLower) ||
      slugLower.includes(normalized)
    );
  });
  if (cat) return cat;

  // 4. Match by stripping common suffixes
  const stripped = normalized
    .replace(/(companies|services|contractors|shops|stores|builders|care|repair|specialists)$/g, "")
    .trim();
  if (stripped && stripped !== normalized) {
    cat = allCategories.find((c) => {
      const labelLower = c.label.toLowerCase();
      const slugLower = c.slug.toLowerCase();
      return (
        labelLower.includes(stripped) ||
        stripped.includes(labelLower) ||
        slugLower.includes(stripped) ||
        stripped.includes(slugLower)
      );
    });
    if (cat) return cat;
  }
  
  return undefined;
}
