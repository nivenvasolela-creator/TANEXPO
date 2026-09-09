import { DestinationPlace } from '../types';

export const initialDestinations: DestinationPlace[] = [
  {
    id: 'serengeti',
    name: 'Serengeti National Park',
    region: 'Mara & Simiyu Regions (Northern Circuit)',
    categoryId: 'safari',
    tagline: 'Endless Savanna, Great Wildebeest Migration & Predator Capital',
    description: 'A UNESCO World Heritage Site covering 14,763 km², the Serengeti is one of the most celebrated wildlife sanctuaries on earth. Millions of blue wildebeest, zebras, and Thomson gazelles thunder across the golden plains in an endless circular trek following seasonal rainfall, stalked by Africa’s densest lion prides, leopards, and cheetahs.',
    bestTimeToVisit: 'June to October (Dry season river crossings) & January to March (Southern calving season in Ndutu)',
    typicalCostRangeTZS: 'TZS 850,000 – TZS 2,650,000 per person / day',
    highlights: [
      'Mara River crossing viewing (July - September)',
      'Big Five game drives across Central Seronera',
      'Over 500 cataloged bird species',
      'Hot air balloon bush flights at sunrise'
    ],
    travelTips: [
      'Park conservation fees are USD 70-80 + 18% VAT per 24 hours (included in licensed package quotes).',
      'Dust masks or bandanas are helpful during dry season drives in open-top 4x4s.',
      'Pack neutral bush clothing (khaki, olive, brown); avoid bright blue and black which attract tsetse flies.'
    ],
    heroGradient: 'from-[#2A1D13] via-[#4A2F1B] to-[#1C2C24]',
    popularPackageHint: '3 to 5-day private 4x4 safari with bush lodge or mobile luxury tented camp',
    featuredImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        caption: 'Serengeti lion pride resting along granite kopjes in Seronera Valley',
        tag: 'Predator Wildlife'
      },
      {
        url: 'https://images.unsplash.com/photo-1547970810-dc739818816c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Great Migration: Thousands of wildebeests thundering across Mara River',
        tag: 'Great Migration'
      },
      {
        url: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunrise hot air balloon flight drifting gently over acacia savanna canopy',
        tag: 'Balloon Safari'
      },
      {
        url: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80',
        caption: 'Acacia tree predator vantage point with cheetah surveying golden plains',
        tag: 'Savanna Landscapes'
      }
    ],
    parkFees: {
      authority: 'Tanzania National Parks Authority (TANAPA)',
      conservationFeePerDay: 'USD 70.00 (Peak) / USD 60.00 (Low) + 18% VAT (TZS ~218,000 / day) for Non-Residents; TZS 11,800 for EAC Citizens',
      concessionOrCampFee: 'USD 59.00 / night (Special luxury tented campsite) or USD 35.40 / night (Public campsite)',
      vehicleOrDescentPermit: 'TZS 41,300 per day for locally registered 4x4 Land Cruiser (up to 3,000 kg)',
      vatApplicable: '18% statutory Tanzania VAT included in official licensed operator packages',
      currencyNote: 'All local safari operators on TANEXPO quote and settle park permits in official TZS.'
    },
    logisticsInfo: {
      accessRoute: 'Fly-in via Seronera Airstrip (SEU), Kogatende, or 7-8 hr overland safari drive from Arusha via Ngorongoro Gate.',
      nearestAirport: 'Seronera Airstrip (Central) / Kilimanjaro International Airport (JRO)',
      driveTimeFromHub: '6-8 hours from Arusha town (with game drive en-route)',
      requiredVehicles: 'Strictly 4WD high-clearance safari vehicles (Toyota Land Cruiser with pop-up roof)',
      healthAndSafety: [
        'Yellow fever card recommended if arriving from endemic transit zones',
        'Malaria prophylaxis strongly advised (lowland savanna territory)',
        'Do not exit safari vehicles outside designated fenced picnic sites (active predator zone)'
      ],
      mandatoryRegulations: [
        'Speed limit is strictly 50 km/h on main transit roads and 25 km/h on game tracks',
        'Off-road driving is strictly prohibited to preserve delicate savanna soils (fine: TZS 500,000+)',
        'Drones are strictly forbidden inside TANAPA national parks without prior Ministry & Military authorization'
      ],
      recommendedGear: [
        'Neutral safari clothing (khaki, beige, olive; avoid dark blue and black which attract tsetse flies)',
        'High-magnification binoculars (8x42 or 10x42) for predator tracking',
        'Dust buff/bandana and polarized sunglasses for dry season drives',
        'Camera with telephoto lens (min. 300mm recommended)'
      ]
    }
  },
  {
    id: 'ngorongoro',
    name: 'Ngorongoro Crater Conservation Area',
    region: 'Arusha Region',
    categoryId: 'safari',
    tagline: 'The World’s Largest Intact Volcanic Caldera & Wildlife Haven',
    description: 'Often referred to as the "Eighth Wonder of the World," this 600m-deep volcanic crater creates a natural enclosed amphitheater teeming with more than 25,000 large mammals. It offers Tanzania’s highest statistical likelihood of spotting the critically endangered black rhinoceros alongside massive tusker elephants and crater-dwelling lion prides.',
    bestTimeToVisit: 'Year-round. Dry season (June - October) offers thinner vegetation; green season (November - May) brings lush caldera flowers and flamingos.',
    typicalCostRangeTZS: 'TZS 750,000 – TZS 1,950,000 per person / day',
    highlights: [
      'Guaranteed sightings of dense wildlife inside a 260 km² caldera',
      'Critical refuge for endangered black rhinos',
      'Lake Magadi soda lake with thousands of pink flamingos',
      'Coexistence with Maasai pastoralists in the buffer highlands'
    ],
    travelTips: [
      'A special Crater Descent Permit (TZS ~780,000 per vehicle) is strictly required by the NCAA authority.',
      'Morning temperatures on the crater rim (2,200m altitude) drop to near freezing; bring a warm fleece jacket.',
      'Descent is limited to 6 hours per vehicle to reduce ecological congestion.'
    ],
    heroGradient: 'from-[#192B21] via-[#284435] to-[#142019]',
    popularPackageHint: 'Full-day crater floor descent combined with Serengeti or Tarangire',
    featuredImage: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Panoramic rim overlook peering down 600 meters onto the 260 km² volcanic caldera floor',
        tag: 'Caldera Vista'
      },
      {
        url: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
        caption: 'Legendary big tusker bull elephant wandering through fever-tree forest swamp',
        tag: 'Big Tuskers'
      },
      {
        url: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Burchell zebras and wildebeests gathered around Lake Magadi soda lake',
        tag: 'Crater Floor'
      }
    ],
    parkFees: {
      authority: 'Ngorongoro Conservation Area Authority (NCAA)',
      conservationFeePerDay: 'USD 70.80 per adult / 24 hours for Non-Residents (TZS ~187,000); TZS 11,800 for EAC Citizens',
      vehicleOrDescentPermit: 'Crater Descent Permit: USD 295.00 (TZS ~780,000) per vehicle / descent (valid for max 6 hours)',
      vatApplicable: 'Included in NCAA tariffs',
      currencyNote: 'NCAA electronic smart card payments are handled directly by your licensed TANEXPO operator.'
    },
    logisticsInfo: {
      accessRoute: 'Paved highway from Arusha to Loduare Gate (160 km, ~3 hours), followed by crater rim dirt ascent.',
      nearestAirport: 'Lake Manyara Airstrip (LKY) or Kilimanjaro International (JRO)',
      driveTimeFromHub: '3 hours paved road from Arusha to Crater Rim',
      requiredVehicles: 'Heavy-duty 4x4 with low-range transfer case required for steep 600m caldera descent roads',
      healthAndSafety: [
        'Crater rim altitude is 2,200m; temperatures drop to 5°C at dawn (pack heavy fleece)',
        'Stay inside vehicle at all times except designated Lerai Forest picnic site',
        'Wild tuskers and buffaloes roam unfenced lodge grounds at night'
      ],
      mandatoryRegulations: [
        'Descent duration strictly capped at 6 hours per vehicle per day to prevent congestion',
        'Maximum 5 vehicles allowed simultaneously at any single predator sighting',
        'Littering or feeding baboons at viewpoints carries immediate expulsion'
      ],
      recommendedGear: [
        'Layered warm clothing (fleece jacket, thermal base, windbreaker)',
        'Telephoto lens for black rhino sightings across the soda lake',
        'Sturdy walking shoes for rim nature walks accompanied by armed NCAA rangers'
      ]
    }
  },
  {
    id: 'kilimanjaro',
    name: 'Mount Kilimanjaro (Roof of Africa)',
    region: 'Kilimanjaro Region (Moshi)',
    categoryId: 'mountain',
    tagline: '5,895m Free-Standing Continental Summit & Glacial Volcano',
    description: 'The highest mountain in Africa and the world’s tallest free-standing volcano, Mount Kilimanjaro rises dramatically from agricultural farmland through five ecological climate zones: montane rainforest, heather moorland, alpine desert, and Arctic glacial ice cap at Uhuru Peak.',
    bestTimeToVisit: 'July to October (clearest skies, cooler nights) and late December to March (warmer climbing conditions)',
    typicalCostRangeTZS: 'TZS 5,200,000 – TZS 8,900,000 per full expedition (6-8 days)',
    highlights: [
      'Summit Uhuru Peak (5,895 meters above sea level)',
      'Scenic routes: Machame ("Whiskey"), Lemosho, and Rongai',
      'Trek through 5 distinct ecological bio-zones in one week',
      'KPAP-ethical treatment of Tanzanian porters and guides'
    ],
    travelTips: [
      'Choose an itinerary with at least 6 or 7 days for proper altitude acclimatization ("climb high, sleep low").',
      'Check that your operator is a certified Kilimanjaro Porters Assistance Project (KPAP) partner.',
      'Ensure your personal gear includes a 4-season sleeping bag (-10°C rated) and broken-in waterproof trekking boots.'
    ],
    heroGradient: 'from-[#1E293B] via-[#334155] to-[#1E3A2F]',
    popularPackageHint: '7-Day Lemosho or 6-Day Machame route with high summit success rate',
    featuredImage: 'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Glacial summit of Uhuru Peak (5,895m) bathed in morning golden light above the clouds',
        tag: 'Roof of Africa'
      },
      {
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
        caption: 'Alpine desert ridge crossing on the scenic Lemosho route approaching Lava Tower',
        tag: 'Alpine Trek'
      },
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Sunrise over Barranco Wall and mountain base camp above sea of mist',
        tag: 'Barranco Camp'
      }
    ],
    parkFees: {
      authority: 'Kilimanjaro National Park (KINAPA / TANAPA)',
      conservationFeePerDay: 'Conservation fee USD 70/day + Camping fee USD 50/night + Rescue fee USD 20/trip (TZS ~3,200,000 for 7-day climb)',
      vehicleOrDescentPermit: 'Mandatory licensed mountain guide ratio (1 guide per 2 climbers) + certified porter quota',
      vatApplicable: '18% VAT included in all ethical operator quotes',
      currencyNote: 'Fair porter tips (KPAP standard: TZS 25,000 - 35,000/day per porter) paid directly in TZS.'
    },
    logisticsInfo: {
      accessRoute: 'Direct highway from Moshi town (45 mins to Machame/Marangu Gate) or Arusha (2 hrs).',
      nearestAirport: 'Kilimanjaro International Airport (JRO) - 45 mins from Moshi trailhead hotels',
      driveTimeFromHub: '45 mins from Moshi / 1.5 hrs from Arusha',
      requiredVehicles: 'Operator shuttle transfer van or 4WD to trailhead gates',
      healthAndSafety: [
        'High altitude pulmonary & cerebral edema (HAPE/HACE) risk; acclimatization days essential',
        'Daily pulse oximeter monitoring by chief guide is mandatory',
        'Drink 4-5 liters of purified water daily on the trail'
      ],
      mandatoryRegulations: [
        'Climbers must be accompanied by certified KINAPA mountain guides and licensed porters',
        'KPAP Porter weight limit: strictly 20 kg maximum per porter bag (enforced at park scales)',
        'All single-use plastic bottles are banned; bring refillable insulated hydration flasks'
      ],
      recommendedGear: [
        '4-Season sleeping bag (-10°C to -15°C comfort rating)',
        'Broken-in waterproof high-ankle trekking boots + gaiters',
        'Trekking poles with rubber tips',
        'Headlamp with spare lithium batteries for midnight summit push'
      ]
    }
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar Archipelago (Stone Town & Coast)',
    region: 'Zanzibar Semi-Autonomous Region',
    categoryId: 'beach',
    tagline: 'Historic Swahili Stone Town, Spices & Turquoise Indian Ocean',
    description: 'Zanzibar merges centuries of Arab, Persian, Portuguese, Indian, and Swahili maritime civilization with idyllic Indian Ocean beaches. Wander the labyrinthine coral-stone alleys of Stone Town, inhale fresh cloves and vanilla on spice farm tours, and sail mahogany dhows across the crystalline waters of Mnemba Atoll.',
    bestTimeToVisit: 'June to October (dry, sunny, and breezy) and December to February (warm sea temperatures, perfect for diving)',
    typicalCostRangeTZS: 'TZS 180,000 – TZS 650,000 per person / day',
    highlights: [
      'Traditional wooden dhow sunset sailing with fresh Swahili snacks',
      'Snorkeling with dolphins and tropical coral at Mnemba Atoll marine reserve',
      'Historic Stone Town UNESCO walking tour (House of Wonders, Slave Market site)',
      'Forodhani Gardens night seafood street food market'
    ],
    travelTips: [
      'Dress respectfully when walking through Stone Town and rural villages (cover shoulders and knees).',
      'Inquire whether your dhow cruise uses traditional sail power or engine backup for safety.',
      'Always negotiate or verify prices in official TZS or card terminals compliant with local licensing.'
    ],
    heroGradient: 'from-[#0C3540] via-[#155E75] to-[#1A382B]',
    popularPackageHint: 'Full-day blue safari dhow cruise + Stone Town cultural walking immersion',
    featuredImage: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=1200&q=80',
        caption: 'Handcrafted wooden dhow sailing across crystal-clear turquoise waters of Kendwa',
        tag: 'Dhow Sailing'
      },
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        caption: 'Vibrant coral reef snorkeling and dolphin pods around Mnemba Atoll marine sanctuary',
        tag: 'Mnemba Atoll'
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        caption: 'Powdery white sands and coastal palm trees lining the tranquil Paje lagoon',
        tag: 'Indian Ocean Beach'
      }
    ],
    parkFees: {
      authority: 'Zanzibar Commission for Tourism (ZCT) & Marine Conservation Department',
      conservationFeePerDay: 'Infrastructure Tax USD 5.00/person/night at registered hotels; Marine Park permit TZS 25,000 - 50,000',
      vehicleOrDescentPermit: 'ZCT Maritime vessel inspection certificate & passenger manifest required for all dhow charters',
      vatApplicable: 'Zanzibar Revenue Board (ZRB) tariffs included in local quotes',
      currencyNote: 'All local island excursions settle directly in Tanzanian Shillings (TZS).'
    },
    logisticsInfo: {
      accessRoute: 'Azam Marine high-speed ferry from Dar es Salaam (1 hr 45 min) or direct flights to Abeid Amani Karume (ZNZ).',
      nearestAirport: 'Abeid Amani Karume International Airport (ZNZ)',
      driveTimeFromHub: 'Stone Town is 15 mins from airport; Nungwi/Kendwa is 1 hr 15 mins north',
      requiredVehicles: 'Private air-conditioned minibus for island transfers; traditional sailing dhow for ocean legs',
      healthAndSafety: [
        'Reef shoes recommended to prevent sea urchin punctures when wading at low tide',
        'Sun protection: reef-safe biodegradable sunscreen (SPF 50+)',
        'Drink only bottled or UV-filtered water'
      ],
      mandatoryRegulations: [
        'Respectful dress code in Stone Town & villages (shoulders and knees covered)',
        'Touching or chasing green sea turtles and dolphins at Mnemba is strictly prohibited',
        'Collecting live coral or sea shells from the ocean floor is illegal under ZCT regulations'
      ],
      recommendedGear: [
        'Lightweight linen or breathable cotton clothing',
        'Waterproof dry bag (10L - 20L) for dhow cruises',
        'High-quality snorkel mask and snorkel (provided by operators or bring personal)',
        'Slip-resistant boat sandals or deck shoes'
      ]
    }
  },
  {
    id: 'eyasi',
    name: 'Lake Eyasi & Hadzabe Indigenous Lands',
    region: 'Karatu District (Arusha)',
    categoryId: 'culture',
    tagline: 'Ancient Hunter-Gatherer Heritage, Bushcraft & Living Traditions',
    description: 'Lake Eyasi is home to the Hadzabe, one of the last remaining hunter-gatherer communities in Africa, who have inhabited this soda lake rift valley for over 10,000 years speaking a unique click-consonant language. Alongside the blacksmith Datoga tribe, this cultural expedition provides rare, non-commercialized human insight.',
    bestTimeToVisit: 'June to November (dry season makes bush trails accessible for dawn hunting walks)',
    typicalCostRangeTZS: 'TZS 280,000 – TZS 750,000 per person / day',
    highlights: [
      'Join Hadzabe hunters at dawn on traditional bow-and-arrow tracks',
      'Learn ancestral fire-making using friction sticks and wild baobab foraging',
      'Visit Datoga pastoralist blacksmiths hand-forging arrowheads from scrap metal',
      'Scenic soda lake backdrop with pelicans and flamingos'
    ],
    travelTips: [
      'Trips must be accompanied by an authorized cultural interpreter from the local community.',
      'Never give money directly to individuals; community fees are distributed via the village council.',
      'Bring closed-toe bush boots as morning walks cover thorny acacia scrub.'
    ],
    heroGradient: 'from-[#3A2818] via-[#593D22] to-[#25382B]',
    popularPackageHint: 'Early morning hunting & foraging cultural excursion from Karatu',
    featuredImage: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Traditional bowmen and tracker elders sharing stories by morning embers',
        tag: 'Hadzabe Heritage'
      },
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
        caption: 'Acacia savanna valley and dramatic Great Rift Valley wall encircling Lake Eyasi',
        tag: 'Rift Valley'
      },
      {
        url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Datoga artisan blacksmiths heating brass and iron arrowheads on hand-pumped forges',
        tag: 'Datoga Blacksmiths'
      }
    ],
    parkFees: {
      authority: 'Karatu District Council & Hadzabe Indigenous Community Trust',
      conservationFeePerDay: 'Community Cultural Fee: TZS 65,000 - 120,000 per person (distributed directly to village healthcare & water boreholes)',
      vehicleOrDescentPermit: 'Authorized Hadzabe community interpreter escort fee required (TZS 50,000 per group)',
      vatApplicable: 'Local district levy included in package',
      currencyNote: 'All village disbursements managed through certified community bank accounts.'
    },
    logisticsInfo: {
      accessRoute: 'Gravel and murram road from Karatu town descending through the rift valley escarpment (2 hours).',
      nearestAirport: 'Lake Manyara Airstrip (LKY) or Arusha Airport (ARK)',
      driveTimeFromHub: '2 hours from Karatu town / 4 hours from Arusha',
      requiredVehicles: '4WD vehicle essential during wet months due to black cotton soils along lake basin',
      healthAndSafety: [
        'Thorny acacia bush: long durable hiking trousers and closed boots essential for dawn walks',
        'Carry personal rehydration salts; mid-day rift valley heat reaches 34°C',
        'Respectful photography: always ask permission through community guide before taking close-up portraits'
      ],
      mandatoryRegulations: [
        'Never give direct cash tips to individual community members (distorts village social fabric)',
        'All hunting walks are strictly observational; firearms and unauthorized tools strictly banned',
        'Visitors must remain with their licensed local interpreter at all times'
      ],
      recommendedGear: [
        'Tough canvas or ripstop safari pants (thorns penetrate thin leggings)',
        'Sturdy closed-toe hiking boots with thick soles',
        'Wide-brim safari hat and sunblock',
        'Compact camera or prime lens for dawn campfire light'
      ]
    }
  },
  {
    id: 'mafia',
    name: 'Mafia Island Marine Sanctuary',
    region: 'Pwani Region (Southern Coast)',
    categoryId: 'marine',
    tagline: 'Whale Sharks, Pristine Coral Atolls & Serene Eco-Tourism',
    description: 'Far quieter than Zanzibar, Mafia Island and its Marine Park comprise the largest protected marine sanctuary in the Indian Ocean. From October through March, juvenile and adult whale sharks feed peacefully in Kilindoni Bay, allowing swimmers to snorkel alongside these gentle leviathans under strict ecological codes of conduct.',
    bestTimeToVisit: 'October to March (peak whale shark aggregation season in Kilindoni Bay)',
    typicalCostRangeTZS: 'TZS 350,000 – TZS 1,200,000 per person / day',
    highlights: [
      'Ethical swimming encounters with wild whale sharks',
      'Scuba diving through hard coral gardens in Chole Bay',
      'Sunset excursions to disappearing sandbanks in the Indian Ocean',
      'Green sea turtle nesting conservation sites on Juani Island'
    ],
    travelTips: [
      'Strictly observe the 3-meter distance rule when snorkeling with whale sharks.',
      'Marine park conservation fee is USD 23.60 per person per 24 hours.',
      'Access is by scheduled 30-minute light aircraft flights from Dar es Salaam.'
    ],
    heroGradient: 'from-[#0B253A] via-[#103D5D] to-[#133026]',
    popularPackageHint: 'Half-day whale shark snorkel expedition + Chole Bay reef dive',
    featuredImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
        caption: 'Gentle whale shark cruising calmly through plankton-rich waters of Kilindoni Bay',
        tag: 'Whale Shark Encounter'
      },
      {
        url: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=1200&q=80',
        caption: 'Pristine untouched coral formations and reef biodiversity inside Chole Bay Marine Park',
        tag: 'Coral Gardens'
      },
      {
        url: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Disappearing tidal sandbanks in the Indian Ocean surrounded by crystalline turquoise waters',
        tag: 'Tidal Sandbanks'
      }
    ],
    parkFees: {
      authority: 'Mafia Island Marine Park Authority (MIMPA)',
      conservationFeePerDay: 'Marine Park Conservation Fee: USD 23.60 per person / 24 hours (TZS ~62,500)',
      vehicleOrDescentPermit: 'Licensed whale shark spotter boat permit & certified marine guide required',
      vatApplicable: 'Included in official MIMPA park fee receipts',
      currencyNote: 'Local dive centers and boat skippers operate strictly in official TZS.'
    },
    logisticsInfo: {
      accessRoute: 'Scheduled 30-minute domestic flights from Dar es Salaam (DAR) via Auric Air or Coastal Aviation.',
      nearestAirport: 'Kilindoni Airstrip (MFA) on Mafia Island',
      driveTimeFromHub: '30 min flight from Dar es Salaam; 20 min transfer to Utende Bay',
      requiredVehicles: 'Local island transfers via safari open 4x4 or coastal bajaji; dive RIB boats for marine park',
      healthAndSafety: [
        'Maintain at least 3-4 meters clearance from whale sharks; never touch or ride them',
        'Do not use camera flash when swimming near whale shark eyes',
        'Swim with a buddy and listen closely to boat skipper instructions in tidal channels'
      ],
      mandatoryRegulations: [
        'Whale Shark Code of Conduct strictly enforced by MIMPA rangers (heavy fines for violations)',
        'Spearfishing is strictly illegal within the marine park boundaries',
        'Anchoring on coral reefs is prohibited; boats must use designated mooring buoys'
      ],
      recommendedGear: [
        'Rash guard / UV swim shirt to protect against sun and jellyfish stings',
        'Own well-fitting silicone snorkel mask and comfortable long fins',
        'Underwater camera / GoPro with float strap',
        'Lightweight waterproof pouch for boat trips'
      ]
    }
  }
];
