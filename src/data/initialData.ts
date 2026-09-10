import { Category, Provider, ListingPackage, Booking, Review, Transaction, Lead } from '../types';

export const COMMISSION_RATE = 0.15; // 15% TANEXPO platform fee
export const TZS_TO_USD_RATE = 2650; // Approx 1 USD ~ 2,650 TZS (indicative conversion)

export const categories: Category[] = [
  {
    id: 'safari',
    label: 'Safari & Wildlife',
    emoji: '🦁',
    sub: 'Serengeti, Ngorongoro, Tarangire, Manyara',
    description: 'Witness the Great Migration, big cats, and iconic crater safaris with certified local guides and custom 4x4 vehicles.',
    popularDestinations: ['Serengeti National Park', 'Ngorongoro Crater', 'Tarangire', 'Lake Manyara']
  },
  {
    id: 'beach',
    label: 'Beach & Zanzibar',
    emoji: '🏝️',
    sub: 'Stone Town, Nungwi, Paje, Kendwa',
    description: 'Turquoise Indian Ocean lagoons, traditional wooden dhow sunset cruises, spice tours, and world-class diving.',
    popularDestinations: ['Stone Town', 'Nungwi Beach', 'Paje Lagoon', 'Mnemba Atoll']
  },
  {
    id: 'mountain',
    label: 'Kilimanjaro & Treks',
    emoji: '🏔️',
    sub: 'Machame, Lemosho, Marangu, Mt. Meru',
    description: 'Summit the Roof of Africa (5,895m) led by licensed high-altitude mountain leaders and certified porters.',
    popularDestinations: ['Kilimanjaro National Park', 'Mount Meru', 'Usambara Mountains', 'Ol Doinyo Lengai']
  },
  {
    id: 'culture',
    label: 'Culture & Heritage',
    emoji: '🛖',
    sub: 'Maasai Bomas, Hadzabe, Chagga, Swahili',
    description: 'Authentic community-led cultural immersion, traditional crafts, hunter-gatherer walks, and ancestral storytelling.',
    popularDestinations: ['Ngorongoro Highlands', 'Lake Eyasi', 'Moshi Rural Villages', 'Bagamoyo']
  },
  {
    id: 'city',
    label: 'City & Culinary',
    emoji: '🌆',
    sub: 'Dar es Salaam, Arusha Town, Stone Town alleys',
    description: 'Bustling spice markets, Swahili seafood dinners, colonial historical architecture, and vibrant urban vibes.',
    popularDestinations: ['Kariakoo Market', 'Kivukoni Fish Market', 'Arusha Cultural Heritage', 'Zanzibar Forodhani']
  },
  {
    id: 'marine',
    label: 'Marine & Diving',
    emoji: '🐬',
    sub: 'Mafia Island, Mnemba, Pemba channel',
    description: 'Swim with whale sharks in Mafia Island, pristine coral reefs, and untouched blue safari expeditions.',
    popularDestinations: ['Mafia Island Marine Park', 'Pemba Channel', 'Mnemba Reef', 'Chwaka Bay']
  }
];

export const initialProviders: Provider[] = [
  {
    id: 1,
    category: 'safari',
    name: 'Kilimanjaro Wild Safaris',
    tagline: 'Premier Northern Circuit & Serengeti Bush Expeditions',
    location: 'Arusha',
    region: 'Arusha Region (Northern Safari Circuit)',
    rating: 4.9,
    reviewsCount: 142,
    tripsCompleted: 156,
    verified: true,
    talaLicense: 'MNRT/TALA/2021/0491',
    languages: ['English', 'Swahili', 'German', 'French'],
    about: 'Based at the foot of Mount Meru in Arusha, we are a 100% Tanzanian family-owned safari specialist. Our custom modified Toyota Land Cruisers feature 360-degree pop-top viewing roofs, onboard inverters for camera battery charging, and iced water tanks. Our safari driver-guides hold advanced Wilderness First Aid and Tanzania Tour Guides Association (TTGA) licenses.',
    phone: '+255 754 882 109',
    email: 'info@kiliwildsafaris.co.tz',
    establishedYear: 2016,
    fleetInfo: '6x Toyota Land Cruiser 4x4 with open pop-up roof and fridge',
    badges: ['TALA Licensed', 'TTGA Certified Guides', '100% Citizen Owned', 'Carbon Offset Partner'],
    officeAddress: 'Plot 44, Goliondoi Road, Clock Tower Square, Arusha'
  },
  {
    id: 2,
    category: 'beach',
    name: 'Zanzibar Dhow Adventures',
    tagline: 'Traditional Swahili Sailing, Mnemba Atoll & Sunset Voyages',
    location: 'Stone Town & Nungwi',
    region: 'Zanzibar Archipelago',
    rating: 4.9,
    reviewsCount: 218,
    tripsCompleted: 240,
    verified: true,
    talaLicense: 'ZNTB/MAR/2019/0114',
    languages: ['English', 'Swahili', 'Italian', 'Arabic'],
    about: 'Operating handcrafted mahogany dhows built by Zanzibar carpenters, our maritime expeditions connect visitors to Zanzibar’s rich ocean heritage. From dolphins at Matemwe to golden-hour dhow sunset sailing with fresh coconut samosas and spiced tamarind juice, our local crew ensures unforgettable island memories.',
    phone: '+255 777 421 980',
    email: 'captain@zanzibardhow.co.tz',
    establishedYear: 2014,
    fleetInfo: '3x Handcrafted 14m Swahili Sailing Dhows with Yamaha backup outboards',
    badges: ['Zanzibar Commission for Tourism Certified', 'Marine Safety Certified', 'Locally Crafted Dhows'],
    officeAddress: 'Shangani Waterfront, Opposite Old Customs House, Stone Town, Zanzibar'
  },
  {
    id: 3,
    category: 'mountain',
    name: 'Kili Summit Guides',
    tagline: 'Responsible High-Altitude Climbing & Mountain Leadership',
    location: 'Moshi',
    region: 'Kilimanjaro Region',
    rating: 4.8,
    reviewsCount: 114,
    tripsCompleted: 128,
    verified: true,
    talaLicense: 'MNRT/TALA/2018/0772',
    languages: ['English', 'Swahili', 'Spanish'],
    about: 'We lead ethical, high-summit success rate climbs on Mount Kilimanjaro (Machame, Lemosho, Rongai, and Marangu). We take pride in adhering strictly to Kilimanjaro Porters Assistance Project (KPAP) fair-treatment standards, providing fair wages, balanced meals, proper high-altitude gear, and emergency pulse oximetry monitoring for all staff and climbers.',
    phone: '+255 768 339 551',
    email: 'expeditions@kilisummitguides.com',
    establishedYear: 2012,
    fleetInfo: '2x 4WD Support Minibuses + High-altitude Mountain Hardware Geodesic Tents',
    badges: ['KPAP Certified Partner', 'Wilderness First Responder', 'Leave No Trace Champion'],
    officeAddress: 'Boma Road, Moshi Urban, Kilimanjaro'
  },
  {
    id: 4,
    category: 'culture',
    name: 'Maasai Cultural Trails',
    tagline: 'Community-Owned Heritage, Boma Life & Bush Storytelling',
    location: 'Ngorongoro Highlands',
    region: 'Arusha / Manyara',
    rating: 4.7,
    reviewsCount: 75,
    tripsCompleted: 88,
    verified: true,
    talaLicense: 'NCA/COM/2022/0038',
    languages: ['Maa', 'Swahili', 'English'],
    about: '100% community-owned and direct-beneficiary cultural initiative. We invite travelers into our living bomas outside the national park boundaries to participate in authentic Maasai beadwork workshops, medicinal herbal bush walks, warrior jumping ceremonies, and campfire oral history without staged tourist traps.',
    phone: '+255 784 112 003',
    email: 'community@maasaitrails.or.tz',
    establishedYear: 2020,
    fleetInfo: 'Community 4x4 Shuttle from Karatu town',
    badges: ['100% Community Owned', 'Direct Village Dividend', 'Women Beadwork Co-op'],
    officeAddress: 'Nainokanoka Village, Ngorongoro Conservation Area'
  },
  {
    id: 5,
    category: 'city',
    name: 'Dar City Walks & Swahili Kitchen',
    tagline: 'Vibrant Street Food, Kariakoo Markets & Swahili History',
    location: 'Dar es Salaam',
    region: 'Dar es Salaam Coastal Metropolis',
    rating: 4.6,
    reviewsCount: 48,
    tripsCompleted: 54,
    verified: true,
    talaLicense: 'MNRT/TALA/2023/0912',
    languages: ['English', 'Swahili'],
    about: 'Explore East Africa’s largest and most dynamic metropolis with passionate Dar es Salaam historians and foodies. We guide small walking groups through the labyrinth of Kariakoo spice markets, Kivukoni fish auctions at sunrise, and authentic Swahili street-food banquets (mishkaki, urojo, vitumbua, and chapati).',
    phone: '+255 712 908 174',
    email: 'darwalks@tanexpo.co.tz',
    establishedYear: 2022,
    fleetInfo: 'Eco-walking tours & Air-conditioned transfer van',
    badges: ['Certified Urban Historians', 'Street Food Hygiene Inspected', 'Sustainable Tourism'],
    officeAddress: 'Samora Avenue, City Centre, Dar es Salaam'
  },
  {
    id: 6,
    category: 'marine',
    name: 'Mafia Deep Blue & Whale Shark Expeditions',
    tagline: 'Pristine Marine Sanctuary, Coral Atolls & Whale Shark Encounters',
    location: 'Kilindoni, Mafia Island',
    region: 'Mafia Island Marine Park',
    rating: 4.9,
    reviewsCount: 62,
    tripsCompleted: 70,
    verified: true,
    talaLicense: 'MNRT/TALA/2020/0335',
    languages: ['English', 'Swahili', 'French'],
    about: 'Based on the tranquil, untouched shores of Mafia Island, we guide ethical snorkeling encounters with gentle giant whale sharks in Kilindoni Bay, scuba diving on the vibrant reefs of Chole Bay, and boat excursions to sunken sandbanks and mangrove forests.',
    phone: '+255 755 220 894',
    email: 'dive@mafiadeepblue.com',
    establishedYear: 2017,
    fleetInfo: '2x Yamaha-powered rigid inflatable dive boats (RIB)',
    badges: ['PADI Dive Center', 'Marine Sanctuary Steward', 'Whale Shark Code of Conduct'],
    officeAddress: 'Utende Bay Road, Kilindoni, Mafia Island'
  }
];

export const initialListings: ListingPackage[] = [
  // Kilimanjaro Wild Safaris (Provider 1)
  {
    id: 101,
    providerId: 1,
    category: 'safari',
    title: '3-Day Classic Serengeti & Ngorongoro Crater Safari',
    priceTZS: 1850000,
    duration: '3 Days / 2 Nights',
    unit: 'per person',
    description: 'Comprehensive northern circuit safari featuring game drives across Central Serengeti (Seronera) and a full descent into the caldera of Ngorongoro Crater.',
    inclusions: [
      'Private 4x4 pop-top Land Cruiser with unlimited mileage',
      'Professional bilingual Tanzanian driver-guide',
      'Ngorongoro Crater vehicle descent permit',
      'All TANAPA National Park entry and conservation fees',
      'Full-board safari tented lodge accommodation',
      'Chilled bottled drinking water in vehicle throughout'
    ],
    exclusions: ['International flights', 'Tips to driver-guide', 'Travel insurance'],
    active: true,
    maxGroupSize: 6
  },
  {
    id: 102,
    providerId: 1,
    category: 'safari',
    title: 'Full-Day Ngorongoro Crater Big 5 Safari Descent',
    priceTZS: 750000,
    duration: '1 Day (10 Hours)',
    unit: 'per person',
    description: 'Early morning pickup from Arusha or Karatu. Descend 600m to the crater floor for intensive rhino, lion pride, hippo pool, and flamingo viewing.',
    inclusions: [
      '4x4 Land Cruiser transfer from Arusha/Karatu',
      'Crater vehicle permit and conservation fee',
      'Packed hot picnic lunch overlooking Lake Magadi',
      'High-power binoculars provided onboard'
    ],
    active: true,
    maxGroupSize: 6
  },
  {
    id: 103,
    providerId: 1,
    category: 'safari',
    title: '4-Day Great Migration Tracking Safari (Tarangire + Serengeti)',
    priceTZS: 2650000,
    duration: '4 Days / 3 Nights',
    unit: 'per person',
    description: 'Designed specifically to track migratory herds, Tarangire elephant gatherings, and predator hunts in remote savanna territories.',
    inclusions: [
      'All national park & concession fees',
      'Luxury tented camp lodging in central/northern Serengeti',
      '4x4 customized safari vehicle with charging ports',
      'Complimentary airport pickup from Kilimanjaro (JRO)'
    ],
    active: true,
    maxGroupSize: 6
  },

  // Zanzibar Dhow Adventures (Provider 2)
  {
    id: 201,
    providerId: 2,
    category: 'beach',
    title: 'Traditional Wooden Dhow Sunset Cruise & Swahili Tapas',
    priceTZS: 185000,
    duration: '3.5 Hours (Late Afternoon)',
    unit: 'per person',
    description: 'Set sail from Stone Town waterfront on an authentic wooden dhow. Enjoy live taarab flute music, chilled tropical juices, and freshly prepared Swahili snacks.',
    inclusions: [
      '3.5 hour sailing on traditional dhow',
      'Swahili snacks (mishkaki skewers, samosas, spiced nuts)',
      'Fresh coconut water, sodas, and tropical juices',
      'Experienced captain and ocean crew'
    ],
    active: true,
    maxGroupSize: 14
  },
  {
    id: 202,
    providerId: 2,
    category: 'beach',
    title: 'Mnemba Atoll Snorkeling & Dolphin Watching Safari',
    priceTZS: 340000,
    duration: 'Full Day (6.5 Hours)',
    unit: 'per person',
    description: 'Speedboat cruise from Nungwi to the crystal-clear marine reserve of Mnemba Atoll. Encounter green sea turtles and vibrant coral formations.',
    inclusions: [
      'All marine park entry and conservation levies',
      'High-grade snorkel mask, fins, and life jackets',
      'Fresh tropical fruit platter (mangoes, pineapple, watermelon)',
      'Barbecue seafood lunch on the beach'
    ],
    active: true,
    maxGroupSize: 10
  },

  // Kili Summit Guides (Provider 3)
  {
    id: 301,
    providerId: 3,
    category: 'mountain',
    title: '7-Day Machame Route ("Whiskey Route") Kilimanjaro Summit',
    priceTZS: 2550000,
    duration: '7 Days / 6 Nights',
    unit: 'per person',
    description: 'Our highest summit success rate itinerary (94%). Offers scenic diversity and the classic "climb high, sleep low" acclimatization profile up to Uhuru Peak (5,895m).',
    inclusions: [
      'All KINAPA park fees, rescue fees, and camping permits',
      'Certified Chief Guide, Assistant Guide, Cook, and Porters',
      'Three hearty chef-prepared hot meals per day',
      'Double-occupancy mountain expedition tents and foam pads',
      'Twice-daily pulse oximeter and health checks',
      'Portable emergency oxygen cylinder on summit night'
    ],
    active: true,
    maxGroupSize: 10
  },
  {
    id: 302,
    providerId: 3,
    category: 'mountain',
    title: '8-Day Lemosho Route Scenic Wilderness Climb',
    priceTZS: 2950000,
    duration: '8 Days / 7 Nights',
    unit: 'per person',
    description: 'Traverse the wild western flanks of Kilimanjaro through lush rainforest and Shira plateau before reaching the summit.',
    inclusions: [
      'Full mountain team (KPAP certified wages)',
      'Emergency satellite communication device',
      'All meals, private toilet tent, and warm washing water',
      'Return hotel transfers in Moshi'
    ],
    active: true,
    maxGroupSize: 8
  },
  {
    id: 303,
    providerId: 3,
    category: 'safari',
    title: '5-Day Kilimanjaro Base & Serengeti Migration Safari Combo',
    priceTZS: 2150000,
    duration: '5 Days / 4 Nights',
    unit: 'per person',
    description: 'Combine Mount Kilimanjaro foothill walks with central Serengeti big cat game drives and Ngorongoro Crater descent.',
    inclusions: [
      'Private 4x4 Land Cruiser with pop-up roof',
      'TANAPA & NCAA park fees and crater descent permit',
      'Full-board safari tented camps',
      'Expert bilingual mountain & wildlife guide'
    ],
    active: true,
    maxGroupSize: 6
  },

  // Maasai Cultural Trails (Provider 4)
  {
    id: 401,
    providerId: 4,
    category: 'culture',
    title: 'Authentic Maasai Living Boma & Firemaking Immersion',
    priceTZS: 195000,
    duration: 'Half-Day (4 Hours)',
    unit: 'per person',
    description: 'Step into a non-commercial Maasai village. Learn ancestral herbal medicine, participate in wood firemaking, and hear tribal elders share ancient folklore.',
    inclusions: [
      'Direct village community fee (supports local water borehole)',
      'Guided walkthrough with English/Swahili speaking Maasai elder',
      'Traditional tea tasting with boiled milk & mountain spices',
      'Participation in warrior songs and dance'
    ],
    active: true,
    maxGroupSize: 12
  },
  {
    id: 402,
    providerId: 4,
    category: 'culture',
    title: 'Hands-On Maasai Beadwork Workshop with Women Artisans',
    priceTZS: 120000,
    duration: '2.5 Hours',
    unit: 'per person',
    description: 'Learn the geometric and symbolic language of Maasai colors and create your own authentic glass bead bracelet with village artisan women.',
    inclusions: [
      'All beadwork tools, threads, and authentic glass beads',
      'Personalized keepsake bracelet to take home',
      'Direct earnings disbursed to the women’s artisan cooperative'
    ],
    active: true,
    maxGroupSize: 8
  },
  {
    id: 403,
    providerId: 4,
    category: 'culture',
    title: 'Lake Eyasi Hadzabe Hunter-Gatherer Dawn Bushwalk & Datoga Forge',
    priceTZS: 320000,
    duration: 'Full Day (8 Hours)',
    unit: 'per person',
    description: 'Join indigenous Hadzabe hunter-gatherers on dawn bush tracking, followed by Datoga pastoralist blacksmith arrowhead forging at Lake Eyasi.',
    inclusions: [
      'Hadzabe community development fund contribution',
      'Certified local cultural interpreter from Lake Eyasi trust',
      'Traditional archery lesson with hand-crafted bow',
      'Picnic lunch and mineral water'
    ],
    active: true,
    maxGroupSize: 8
  },

  // Dar City Walks (Provider 5)
  {
    id: 501,
    providerId: 5,
    category: 'city',
    title: 'Kariakoo Spices & Swahili Street Food Tasting Trail',
    priceTZS: 95000,
    duration: '3.5 Hours',
    unit: 'per person',
    description: 'Navigate the sensory maze of Kariakoo. Taste fresh Zanzibari urojo soup, grilled beef mishkaki, sugar cane juice, and crispy samosas.',
    inclusions: [
      'All street food and spice tasting portions (7 distinct stops)',
      'Bottled drinking water and fresh coconut water (dafu)',
      'Local urban historian guide'
    ],
    active: true,
    maxGroupSize: 8
  },
  {
    id: 502,
    providerId: 5,
    category: 'beach',
    title: 'Dar es Salaam to Zanzibar Stone Town Day Excursion',
    priceTZS: 280000,
    duration: 'Full Day (10 Hours)',
    unit: 'per person',
    description: 'Return VIP Azam Marine catamaran ferry crossing from Dar to Zanzibar, guided Stone Town UNESCO walking tour, and Forodhani seafood dinner.',
    inclusions: [
      'Return fast ferry tickets (Dar - Zanzibar - Dar)',
      'Stone Town certified heritage guide',
      'Stone Town spice market walkthrough',
      'Evening Swahili street food tasting at Forodhani'
    ],
    active: true,
    maxGroupSize: 10
  },

  // Mafia Deep Blue (Provider 6)
  {
    id: 601,
    providerId: 6,
    category: 'marine',
    title: 'Ethical Whale Shark Snorkel Safari & Sandbank Picnic',
    priceTZS: 360000,
    duration: '5 Hours',
    unit: 'per person',
    description: 'Responsible encounter with resident whale sharks in Kilindoni Bay, followed by a swim on Marimbani disappearing sandbank.',
    inclusions: [
      'Marine park license & boat charter',
      'Snorkeling gear & whale shark spotter crew',
      'Sandbank picnic with fresh fruits & coconut',
      'Underwater digital photos shared post-trip'
    ],
    active: true,
    maxGroupSize: 8
  },
  {
    id: 602,
    providerId: 6,
    category: 'marine',
    title: 'Chole Bay Coral Reef Scuba Diving & Marine Sanctuary Explorer',
    priceTZS: 420000,
    duration: '6 Hours (2 Tanks)',
    unit: 'per person',
    description: 'Scuba diving through pristine hard coral gardens inside Mafia Island Marine Park. Encounter sea turtles, rays, and tropical reef schools.',
    inclusions: [
      'PADI certified divemaster guide',
      'Two tank boat dive inside Chole Bay sanctuary',
      'Full equipment rental (BCD, regulator, wetsuit, computer)',
      'Hot tea, spiced ginger coffee, and snacks on boat'
    ],
    active: true,
    maxGroupSize: 6
  }
];

export const initialBookings: Booking[] = [
  {
    id: 1001,
    providerId: 1,
    providerName: 'Kilimanjaro Wild Safaris',
    touristName: 'Dr. Sarah Jenkins',
    touristContact: '+44 7700 900123',
    listingTitle: '3-Day Classic Serengeti & Ngorongoro Crater Safari',
    date: '2026-09-15',
    amountTZS: 3700000,
    commissionTZS: 555000,
    netPayoutTZS: 3145000,
    status: 'Upcoming',
    referenceCode: 'TNX-26-8941',
    createdAt: '2026-09-02'
  },
  {
    id: 1002,
    providerId: 1,
    providerName: 'Kilimanjaro Wild Safaris',
    touristName: 'Juma Emmanuel',
    touristContact: '+255 715 443 890',
    listingTitle: 'Full-Day Ngorongoro Crater Big 5 Safari Descent',
    date: '2026-08-28',
    amountTZS: 1500000,
    commissionTZS: 225000,
    netPayoutTZS: 1275000,
    status: 'Completed',
    referenceCode: 'TNX-26-7812',
    createdAt: '2026-08-14'
  },
  {
    id: 1003,
    providerId: 2,
    providerName: 'Zanzibar Dhow Adventures',
    touristName: 'Elena Rostova',
    touristContact: '+33 612 345 678',
    listingTitle: 'Traditional Wooden Dhow Sunset Cruise & Swahili Tapas',
    date: '2026-09-18',
    amountTZS: 370000,
    commissionTZS: 55500,
    netPayoutTZS: 314500,
    status: 'Upcoming',
    referenceCode: 'TNX-26-9023',
    createdAt: '2026-09-05'
  },
  {
    id: 1004,
    providerId: 3,
    providerName: 'Kili Summit Guides',
    touristName: 'Markus Lindberg',
    touristContact: '+46 70 123 4567',
    listingTitle: '7-Day Machame Route ("Whiskey Route") Kilimanjaro Summit',
    date: '2026-08-10',
    amountTZS: 5100000,
    commissionTZS: 765000,
    netPayoutTZS: 4335000,
    status: 'Completed',
    referenceCode: 'TNX-26-6734',
    createdAt: '2026-07-22'
  }
];

export const initialReviews: Review[] = [
  {
    id: 501,
    providerId: 1,
    touristName: 'James & Clara Miller',
    rating: 5,
    tripPackage: '3-Day Classic Serengeti Safari',
    date: 'August 2026',
    comment: 'Spectacular experience! Our guide Wilson spotted leopards in the acacia trees and three lion prides in Seronera. The pop-up roof 4x4 was immaculate and made wildlife photography effortless.',
    providerResponse: 'Asante sana James & Clara! Wilson was thrilled to guide you. We look forward to welcoming you back for southern circuit safaris!'
  },
  {
    id: 502,
    providerId: 1,
    touristName: 'Nesta Mrema',
    rating: 5,
    tripPackage: 'Ngorongoro Crater Descent',
    date: 'July 2026',
    comment: 'Very professional, transparent pricing in TZS with no hidden park fee surprises. Truly local experts who care about wildlife conservation.'
  },
  {
    id: 503,
    providerId: 2,
    touristName: 'Sophie Van Dijk',
    rating: 5,
    tripPackage: 'Sunset Dhow Sailing',
    date: 'August 2026',
    comment: 'The golden hour light reflecting over Stone Town while gliding on a wooden dhow was the highlight of our honeymoon. The spiced snacks were delicious.'
  },
  {
    id: 504,
    providerId: 3,
    touristName: 'Carlos Mendonça',
    rating: 5,
    tripPackage: 'Machame 7-Day Climb',
    date: 'August 2026',
    comment: 'Reached Uhuru Peak safely! Kili Summit Guides care deeply for their porters — proper tents, warm clothes, and high morale throughout camp. 10/10.'
  }
];

export const initialTransactions: Transaction[] = [
  {
    id: 'TX-9841',
    bookingId: 1002,
    providerId: 1,
    touristName: 'Juma Emmanuel',
    grossTZS: 1500000,
    platformFeeTZS: 225000,
    netTZS: 1275000,
    paymentRail: 'M-Pesa',
    status: 'Paid',
    payoutRef: 'MPESA-TZ-88491023',
    date: '2026-08-29'
  },
  {
    id: 'TX-9842',
    bookingId: 1004,
    providerId: 3,
    touristName: 'Markus Lindberg',
    grossTZS: 5100000,
    platformFeeTZS: 765000,
    netTZS: 4335000,
    paymentRail: 'CRDB Bank',
    status: 'Paid',
    payoutRef: 'CRDB-IFT-0091823',
    date: '2026-08-12'
  },
  {
    id: 'TX-9843',
    bookingId: 1001,
    providerId: 1,
    touristName: 'Dr. Sarah Jenkins',
    grossTZS: 3700000,
    platformFeeTZS: 555000,
    netTZS: 3145000,
    paymentRail: 'M-Pesa',
    status: 'Processing',
    payoutRef: 'PAYMENT-PENDING-START',
    date: '2026-09-02'
  }
];

export const initialLeads: Lead[] = [
  {
    id: 2001,
    providerId: 1,
    providerName: 'Kilimanjaro Wild Safaris',
    listingId: 101,
    listingTitle: '3-Day Classic Serengeti & Ngorongoro Crater Safari',
    touristName: 'David & Hannah Smith',
    touristContact: '+1 (415) 555-0199',
    date: '2026-10-04',
    groupSize: 2,
    budgetTZS: '4,000,000 TZS',
    message: 'We are celebrating our 10th anniversary. Would love to have private vehicle with binoculars and vegetarian meal options if possible.',
    status: 'Negotiating',
    createdAt: '2026-09-08T09:30:00Z',
    quote: {
      basePrice: 3700000,
      extras: [
        { id: 'ex-1', title: 'Airport transfer from Kilimanjaro Airport (JRO)', amount: 150000 },
        { id: 'ex-2', title: 'Complimentary sparkling wine for anniversary', amount: 0 }
      ],
      discount: 100000,
      total: 3750000,
      validUntil: '2026-09-18',
      note: 'We have reserved your private Land Cruiser with guide Wilson! Included anniversary concession and JRO VIP transfer.',
      sentAt: '2026-09-08T11:15:00Z'
    }
  },
  {
    id: 2002,
    providerId: 1,
    providerName: 'Kilimanjaro Wild Safaris',
    listingId: 102,
    listingTitle: 'Full-Day Ngorongoro Crater Big 5 Safari Descent',
    touristName: 'Tariq Al-Mansoor',
    touristContact: '+971 50 123 4567',
    date: '2026-10-12',
    groupSize: 4,
    budgetTZS: '3,000,000 TZS',
    message: 'Family of four with two teenagers. Interested in seeing black rhinos and big cats. Can you pick us up from our hotel in Karatu?',
    status: 'New',
    createdAt: '2026-09-09T06:15:00Z'
  },
  {
    id: 2003,
    providerId: 1,
    providerName: 'Kilimanjaro Wild Safaris',
    listingId: 103,
    listingTitle: '4-Day Great Migration Tracking Safari',
    touristName: 'Grace Mdee',
    touristContact: '+255 754 332 110',
    date: '2026-10-20',
    groupSize: 3,
    budgetTZS: '8,000,000 TZS',
    message: 'Local Tanzanian residents holidaying with relatives from abroad. Need resident park fee rates applied if possible.',
    status: 'Contacted',
    createdAt: '2026-09-07T14:20:00Z'
  }
];
