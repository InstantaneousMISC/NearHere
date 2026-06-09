export interface MockAdvertiser {
  id: string
  category: string
  businessName: string
  description: string
  offer: string
  phone: string
  qrCodeUrl: string
  qrLabel?: string
  redemptionNote?: string
  accentColor?: string
  variant?: "standard" | "compact" | "premium" | "half" | "double"
  iconType?: string
  imageUrl?: string
}

export const mock9x12AdvertisersFront: { left: MockAdvertiser[]; right: MockAdvertiser[]; divider?: MockAdvertiser } = {
  left: [
    {
      id: "9x12-front-l1",
      category: "PLUMBING",
      businessName: "RIVERDALE PLUMBING",
      description: "Fast, reliable plumbing when you need it most.",
      offer: "$50 OFF",
      qrLabel: "ANY SERVICE CALL",
      phone: "(210) 555-1001",
      qrCodeUrl: "/qr/riverdale-plumbing",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "standard"
    },
    {
      id: "9x12-front-l2",
      category: "ELECTRICAL",
      businessName: "BRIGHT WAY ELECTRIC",
      description: "Residential & commercial electrical services.",
      offer: "$50 OFF",
      qrLabel: "ANY SERVICE CALL",
      phone: "(210) 555-1005",
      qrCodeUrl: "/qr/bright-way-electric",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "standard"
    },
    {
      id: "9x12-front-l3",
      category: "GARAGE DOORS",
      businessName: "LIFTMASTER GARAGE DOORS",
      description: "Repairs, openers, & new installations.",
      offer: "$50 OFF",
      qrLabel: "ANY REPAIR",
      phone: "(210) 555-1009",
      qrCodeUrl: "/qr/liftmaster-garage",
      redemptionNote: "Mention this card.",
      accentColor: "#77706A",
      variant: "standard"
    },
    {
      id: "9x12-front-l4",
      category: "HVAC",
      businessName: "COMFORT AIR SOLUTIONS",
      description: "Heating & cooling installation & repair.",
      offer: "$75 OFF",
      qrLabel: "NEW REPAIR",
      phone: "(210) 555-1004",
      qrCodeUrl: "/qr/comfort-air",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "standard"
    },
    {
      id: "9x12-front-l5",
      category: "PEST CONTROL",
      businessName: "SAFEGUARD PEST CONTROL",
      description: "Protect your home from pests.",
      offer: "$25 OFF",
      qrLabel: "INITIAL SERVICE",
      phone: "(210) 555-1006",
      qrCodeUrl: "/qr/safeguard",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "standard"
    },
    {
      id: "9x12-front-l6",
      category: "POOL SERVICE",
      businessName: "AQUA BLUE POOL CARE",
      description: "Keep your pool clean & clear.",
      offer: "$25 OFF",
      qrLabel: "FIRST MONTH",
      phone: "(210) 555-1011",
      qrCodeUrl: "/qr/aquablue",
      redemptionNote: "Mention this card.",
      accentColor: "#77706A",
      variant: "standard"
    }
  ],
  right: [
    {
      id: "9x12-front-r1",
      category: "ROOFING",
      businessName: "SUMMIT ROOFING",
      description: "Quality roofs. Built to last.",
      offer: "$100 OFF",
      qrLabel: "NEW ROOF",
      phone: "(210) 555-1002",
      qrCodeUrl: "/qr/summit-roofing",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "half"
    },
    {
      id: "9x12-front-r2",
      category: "LANDSCAPING",
      businessName: "GREENSCAPE SOLUTIONS",
      description: "Beautiful yards. Built with care.",
      offer: "10% OFF",
      qrLabel: "ANY SERVICE",
      phone: "(210) 555-1003",
      qrCodeUrl: "/qr/greenscape",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "half"
    },
    {
      id: "9x12-front-r3",
      category: "CONCRETE",
      businessName: "CUSTOM CONCRETE",
      description: "Driveways, patios, sidewalks & more.",
      offer: "$100 OFF",
      qrLabel: "ANY PROJECT",
      phone: "(210) 555-1007",
      qrCodeUrl: "/qr/custom-concrete",
      redemptionNote: "Mention this card.",
      accentColor: "#77706A",
      variant: "half"
    },
    {
      id: "9x12-front-r4",
      category: "JUNK REMOVAL",
      businessName: "CLEAR OUT HAULING",
      description: "We haul it all. You relax.",
      offer: "$25 OFF",
      qrLabel: "ANY LOAD",
      phone: "(210) 555-1008",
      qrCodeUrl: "/qr/clearout-hauling",
      redemptionNote: "Mention this card.",
      accentColor: "#C9993E",
      variant: "half"
    },
    {
      id: "9x12-front-r5",
      category: "REMODELING",
      businessName: "BETTER BUILT REMODELING",
      description: "Kitchens, baths, & full remodels.",
      offer: "$100 OFF",
      qrLabel: "ANY PROJECT",
      phone: "(210) 555-1011",
      qrCodeUrl: "/qr/betterbuilt-remodel",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "half"
    },
    {
      id: "9x12-front-r6",
      category: "TREE SERVICE",
      businessName: "TEXAS TREE CARE",
      description: "Tree trimming, removal & cleanup.",
      offer: "$25 OFF",
      qrLabel: "ANY SERVICE",
      phone: "(210) 555-1012",
      qrCodeUrl: "/qr/texas-tree-care",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "half"
    }
  ],
  divider: {
    id: "9x12-front-divider",
    category: "EVENTS & VENUES",
    businessName: "Harvest Festival",
    description: "Annual Autumn Harvest Festival & Market. Food, fun, & live music!",
    offer: "FREE ADMISSION",
    phone: "(210) 555-4001",
    qrCodeUrl: "/qr/harvest-fest",
    qrLabel: "GET DIRECTIONS",
    accentColor: "#C9993E",
    variant: "half"
  }
}

export const mock9x12AdvertisersBack: { top: MockAdvertiser[]; bottom: MockAdvertiser[]; premium?: MockAdvertiser } = {
  top: [
    {
      id: "9x12-back-t1",
      category: "WINDOWS",
      businessName: "CLIMITE WINDOWS",
      description: "Energy efficient windows & doors.",
      offer: "$100 OFF",
      qrLabel: "NEW ROOF",
      phone: "(210) 555-1010",
      qrCodeUrl: "/qr/climite-windows",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "standard"
    },
    {
      id: "9x12-back-t2",
      category: "HANDYMAN",
      businessName: "FIX-IT ALL SERVICES",
      description: "Small jobs. Big difference.",
      offer: "$15 OFF",
      qrLabel: "FIRST HOUR",
      phone: "(210) 555-1004",
      qrCodeUrl: "/qr/fixit-handyman",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "standard"
    },
    {
      id: "9x12-back-t3",
      category: "FENCE COMPANY",
      businessName: "STRONGHOLD FENCING",
      description: "Quality fences built right.",
      offer: "$50 OFF",
      qrLabel: "ANY FENCE",
      phone: "(210) 555-1006",
      qrCodeUrl: "/qr/stronghold-fencing",
      redemptionNote: "Mention this card.",
      accentColor: "#77706A",
      variant: "standard"
    },
    {
      id: "9x12-back-t4",
      category: "HOUSE CLEANING",
      businessName: "SPARKLE CLEANING",
      description: "A cleaner home. A better life.",
      offer: "$50 OFF",
      qrLabel: "FIRST LEAGUE",
      phone: "(210) 555-1014",
      qrCodeUrl: "/qr/sparkle-cleaning",
      redemptionNote: "Mention this card.",
      accentColor: "#C9993E",
      variant: "standard"
    }
  ],
  bottom: [
    {
      id: "9x12-back-b1",
      category: "SOLAR",
      businessName: "SUN POWER SOLAR",
      description: "Lower bills. Cleaner energy.",
      offer: "$100 OFF",
      qrLabel: "ANY PROVIDER",
      phone: "(210) 555-1013",
      qrCodeUrl: "/qr/sunpower-solar",
      redemptionNote: "Mention this card.",
      accentColor: "#D13F1F",
      variant: "standard"
    },
    {
      id: "9x12-back-b2",
      category: "PAINTING",
      businessName: "BRUSHSTROKE PAINTING",
      description: "Kitchens, interior, & full remodels.",
      offer: "$100 OFF",
      qrLabel: "ANY PROJECT",
      phone: "(210) 555-1015",
      qrCodeUrl: "/qr/brushstroke-painting",
      redemptionNote: "Mention this card.",
      accentColor: "#0B2F4A",
      variant: "standard"
    },
    {
      id: "9x12-back-b3",
      category: "WATER HEATERS",
      businessName: "HOT FLOW WATER HEATERS",
      description: "Installation, repair & maintenance.",
      offer: "$30 OFF",
      qrLabel: "ANY REPLACEMENT",
      phone: "(210) 555-1016",
      qrCodeUrl: "/qr/hotflow-heaters",
      redemptionNote: "Mention this card.",
      accentColor: "#77706A",
      variant: "standard"
    },
    {
      id: "9x12-back-b4",
      category: "GUTTERS",
      businessName: "CLEAN FLOW CARE",
      description: "Protect your home from water damage.",
      offer: "$25 OFF",
      qrLabel: "ANY SERVICE",
      phone: "(210) 555-1017",
      qrCodeUrl: "/qr/cleanflow-gutters",
      redemptionNote: "Mention this card.",
      accentColor: "#C9993E",
      variant: "standard"
    }
  ],
  premium: {
    id: "9x12-back-premium",
    category: "PREMIUM SPOTLIGHT",
    businessName: "Mama Rosa's Italian Kitchen",
    description: "Authentic family recipes. Hand-crafted pasta & brick oven pizza. Voted best local Italian!",
    offer: "15% OFF SAVINGS",
    phone: "(210) 555-2001",
    qrCodeUrl: "/qr/mamarosas",
    qrLabel: "CLAIM SAVINGS",
    redemptionNote: "Mention this card.",
    accentColor: "#D13F1F",
    variant: "premium"
  }
}

export const mock6x11AdvertisersFront: { spotlight: MockAdvertiser & { imageUrl?: string; subName?: string }; right: MockAdvertiser[]; bottom: MockAdvertiser[] } = {
  spotlight: {
    id: "6x11-front-spotlight",
    category: "FEATURED SPOTLIGHT!",
    businessName: "Mama Rosa's",
    subName: "ITALIAN KITCHEN",
    description: "Family recipes. Made fresh daily. Dine in • Takeout • Catering.",
    offer: "10% OFF YOUR MEAL",
    phone: "(210) 555-2001",
    qrCodeUrl: "/qr/mamarosas",
    redemptionNote: "Mention this card.",
    accentColor: "#D13F1F",
    variant: "premium",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60"
  },
  right: [
    {
      id: "6x11-front-r1",
      category: "COFFEE SHOP",
      businessName: "Brewed Awakenings",
      description: "Artisanal coffees & pastries.",
      offer: "FREE COOKIE WITH DRINK",
      phone: "(210) 555-2002",
      qrCodeUrl: "/qr/brewed-awakenings",
      accentColor: "#C9993E",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-front-r2",
      category: "BAKERY",
      businessName: "Sweet Crumbs Bakery",
      description: "Fresh baked goodness every day.",
      offer: "10% OFF",
      phone: "(210) 555-2003",
      qrCodeUrl: "/qr/sweet-crumbs",
      accentColor: "#77706A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=60"
    }
  ],
  bottom: [
    {
      id: "6x11-front-b1",
      category: "PIZZERIA",
      businessName: "Tony's Pizza",
      description: "Hand tossed. Fresh ingredients.",
      offer: "$3 OFF ANY LARGE",
      phone: "(210) 555-2004",
      qrCodeUrl: "/qr/tonys-pizza",
      accentColor: "#D13F1F",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-front-b2",
      category: "TACOS",
      businessName: "Taco Street",
      description: "Authentic, fast, delicious.",
      offer: "10% OFF",
      phone: "(210) 555-2005",
      qrCodeUrl: "/qr/taco-street",
      accentColor: "#0B2F4A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-front-b3",
      category: "DESSERT",
      businessName: "The Treat Spot",
      description: "Cookies, cakes, & more!",
      offer: "BUY 1 GET 1 50% OFF",
      phone: "(210) 555-2006",
      qrCodeUrl: "/qr/treat-spot",
      accentColor: "#C9993E",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&auto=format&fit=crop&q=60"
    }
  ]
}

export const mock6x11AdvertisersBack: { top: MockAdvertiser[]; bottom: MockAdvertiser[] } = {
  top: [
    {
      id: "6x11-back-t1",
      category: "FITNESS",
      businessName: "Elevate Fitness",
      description: "Group classes, personal training, nutrition coaching.",
      offer: "7 DAY FREE PASS",
      phone: "(210) 555-2007",
      qrCodeUrl: "/qr/elevate-fitness",
      accentColor: "#0B2F4A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-back-t2",
      category: "SALON",
      businessName: "Bella Salon",
      description: "Hair, skin, nails. You deserve it.",
      offer: "20% OFF",
      phone: "(210) 555-2008",
      qrCodeUrl: "/qr/bella-salon",
      accentColor: "#D13F1F",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-back-t3",
      category: "DENTIST",
      businessName: "Bright Smile Dental",
      description: "Gentle care for the whole family.",
      offer: "$59 EXAM & X-RAY",
      phone: "(210) 555-2009",
      qrCodeUrl: "/qr/bright-smile",
      accentColor: "#77706A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&auto=format&fit=crop&q=60"
    }
  ],
  bottom: [
    {
      id: "6x11-back-b1",
      category: "BOUTIQUE",
      businessName: "Wildflower Boutique",
      description: "Trendy styles. Local shop.",
      offer: "10% OFF",
      phone: "(210) 555-2010",
      qrCodeUrl: "/qr/wildflower-boutique",
      accentColor: "#77706A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-back-b2",
      category: "EVENTS",
      businessName: "Converse Night Market",
      description: "Local vendors, food trucks, & live music.",
      offer: "SEE YOU THERE!",
      phone: "(210) 555-2011",
      qrCodeUrl: "/qr/night-market",
      accentColor: "#C9993E",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&auto=format&fit=crop&q=60"
    },
    {
      id: "6x11-back-b3",
      category: "CAFE",
      businessName: "Corner Café",
      description: "Breakfast, lunch, good vibes.",
      offer: "FREE COOKIE",
      phone: "(210) 555-2012",
      qrCodeUrl: "/qr/corner-cafe",
      accentColor: "#0B2F4A",
      variant: "compact",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&auto=format&fit=crop&q=60"
    }
  ]
}
