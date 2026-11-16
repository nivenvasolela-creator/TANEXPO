import { Language } from '../types';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Navigation
    'brand.sub': 'Tanzania Tourism Marketplace & Operator OS',
    'compliance.badge': 'Bank of Tanzania (BOT) TZS-Mandated Local Pricing Standard',
    'act.compliant': 'Tanzania Tourism Act Compliant',
    'usd.approx': 'USD Indicative',
    'reset.demo': 'Reset Demo',
    'tab.explorer': 'Explorer',
    'tab.provider': 'Operator OS',
    'tab.requests': 'My Requests',
    'operating.as': 'Operating As',
    'explore.tours': 'Explore Tours & Guides',
    'my.requests': 'My Requests',
    'saved': 'Saved',
    'laws': 'TZS & Licensing Laws',
    'nav.explore': 'Explore',
    'nav.requests': 'Requests',
    'nav.saved': 'Saved',
    'nav.laws': 'Laws',
    'nav.more': 'More',
    'nav.signin': 'Sign In',

    // Common Actions
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.dismiss': 'Dismiss',
    'common.loading': 'Loading...',
    'common.reset': 'Reset',

    // PWA & Offline
    'pwa.install': 'Install App',
    'pwa.install_ios': 'Install on iOS',
    'pwa.ios_title': 'Install TANEXPO on iPhone / iPad',
    'pwa.offline': 'Offline — showing saved catalog. Reconnect to send quotes.',
    'pwa.update_ready': 'Update ready',
    'pwa.reload': 'Reload',

    // Tourist Home & Explore
    'hero.badge': 'Direct from Licensed Tanzanian Operators',
    'hero.title': 'Discover Tanzania with verified local specialists.',
    'hero.subtitle': 'Connect directly with TALA-registered safari guides, Kilimanjaro leaders, and Zanzibar dhow captains. No foreign markups. Custom itineraries quoted directly in official Tanzanian Shillings.',
    'search.placeholder': 'Search Serengeti, Kilimanjaro, dhow cruise, walking safaris...',
    'all.regions': 'All Regions',
    'all.categories': 'All Types',
    'explore.by.exp': 'Explore by Experience',
    'explore.sub': 'Select a category to filter Tanzanian operators',
    'verified.operators': 'Verified Local Operators',
    'starting.from': 'Starting from',
    'view.quote': 'View & Quote',
    'compare': 'Compare',
    'compare.btn': 'Compare Providers',
    'saved.wishlist': 'Saved Providers',
    'empty.operators_title': 'No operators listed yet',
    'empty.operators_cta': 'Join as an Operator',

    // Destinations
    'destinations.title': 'Tanzania Destination Guides',
    'destinations.sub': 'Explore iconic national parks, mountain peaks, and marine reserves',
    'best.time': 'Best Time to Visit',
    'typical.cost': 'Typical Daily Cost',
    'view.destination': 'Explore Destination Guide',

    // Quote & Inquiries
    'request.quote': 'Request Custom Quote',
    'trip.requests': 'My Trip Requests',
    'quote.ready': 'Quote Ready!',
    'accept.pay': 'Accept Quote & Confirm Payment',
    'decline': 'Decline',
    'send.message': 'Send message to operator...',

    // Provider OS
    'provider.overview': 'Overview',
    'provider.leads': 'Leads Pipeline',
    'provider.listings': 'Tour Packages',
    'provider.bookings': 'Bookings',
    'provider.financials': 'Financials & Payouts',
    'provider.reviews': 'Reviews',
    'provider.profile': 'Profile & TALA',
    'provider.add_package': 'Add Tour Package',

    // Financials
    'financials.title': 'Financials, Settlements & Payouts',
    'gross.volume': 'Gross Volume (TZS)',
    'platform.fee': 'TANEXPO Fee (15%)',
    'net.payout': 'Net Operator Payout (85%)',
    'bot.compliance.note': 'All transactions legally settled in Tanzanian Shillings (TZS) under BOT Regulations 2025.'
  },
  sw: {
    // Header & Navigation
    'brand.sub': 'Soko Kuu la Utalii Tanzania & Mfumo wa Waendeshaji',
    'compliance.badge': 'Mwongozo Rasmi wa Benki Kuu ya Tanzania (BOT) kwa Sarafu ya TZS',
    'act.compliant': 'Inazingatia Sheria ya Utalii ya Tanzania',
    'usd.approx': 'Kiwango cha USD',
    'reset.demo': 'Rudisha Data',
    'tab.explorer': 'Mtafutaji',
    'tab.provider': 'Mfumo wa Mwendeshaji',
    'tab.requests': 'Maombi Yangu',
    'operating.as': 'Unaendesha Kama',
    'explore.tours': 'Gundua Ziara & Waongozaji',
    'my.requests': 'Maombi Yangu',
    'saved': 'Zilizohifadhiwa',
    'laws': 'Sheria za TZS & Leseni',
    'nav.explore': 'Gundua',
    'nav.requests': 'Maombi',
    'nav.saved': 'Hifadhi',
    'nav.laws': 'Sheria',
    'nav.more': 'Zaidi',
    'nav.signin': 'Ingia',

    // Common Actions
    'common.close': 'Funga',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.dismiss': 'Ondoa',
    'common.loading': 'Inapakia...',
    'common.reset': 'Futa',

    // PWA & Offline
    'pwa.install': 'Weka App',
    'pwa.install_ios': 'Weka kwenye iOS',
    'pwa.ios_title': 'Weka TANEXPO kwenye iPhone / iPad',
    'pwa.offline': 'Hakuna intaneti — tunaonyesha orodha iliyohifadhiwa.',
    'pwa.update_ready': 'Toleo jipya lipo tayari',
    'pwa.reload': 'Sasisha',

    // Tourist Home & Explore
    'hero.badge': 'Moja kwa Moja kutoka kwa Waendeshaji Wenye Leseni',
    'hero.title': 'Gundua Tanzania na wenyeji walioidhinishwa.',
    'hero.subtitle': 'Wasiliana moja kwa moja na waongoza safari wenye leseni ya TALA, wataalamu wa Kilimanjaro, na manahodha wa mashua Zanzibar. Hakuna madalali wa nje. Nukuu rasmi kwa Shilingi ya Tanzania.',
    'search.placeholder': 'Tafuta Serengeti, Kilimanjaro, safari za mashua, matembezi...',
    'all.regions': 'Mikoa Yote',
    'all.categories': 'Aina Zote',
    'explore.by.exp': 'Gundua kwa Uzoefu',
    'explore.sub': 'Chagua kitengo ili kuchuja waendeshaji wa Kitanzania',
    'verified.operators': 'Waendeshaji Walioidhinishwa',
    'starting.from': 'Kuanzia',
    'view.quote': 'Tazama & Omba Nukuu',
    'compare': 'Linganisha',
    'compare.btn': 'Linganisha Waendeshaji',
    'saved.wishlist': 'Uliyohifadhi',
    'empty.operators_title': 'Hakuna waendeshaji bado',
    'empty.operators_cta': 'Jiunge kama Mwendeshaji',

    // Destinations
    'destinations.title': 'Mwongozo wa Maeneo Maarufu Tanzania',
    'destinations.sub': 'Gundua mbuga za wanyama, vilele vya milima, na hifadhi za bahari',
    'best.time': 'Wakati Bora wa Kutembelea',
    'typical.cost': 'Gharama ya Kawaida kwa Siku',
    'view.destination': 'Soma Mwongozo wa Eneo',

    // Quote & Inquiries
    'request.quote': 'Omba Nukuu ya Safari',
    'trip.requests': 'Maombi Yangu ya Safari',
    'quote.ready': 'Nukuu Imetumwa!',
    'accept.pay': 'Kubali Nukuu & Fanya Malipo',
    'decline': 'Kataa Nukuu',
    'send.message': 'Andika ujumbe kwa mwendeshaji...',

    // Provider OS
    'provider.overview': 'Muhtasari',
    'provider.leads': 'Msururu wa Wateja',
    'provider.listings': 'Vifurushi vya Ziara',
    'provider.bookings': 'Safari Zilizothibitishwa',
    'provider.financials': 'Fedha & Malipo',
    'provider.reviews': 'Maoni ya Watalii',
    'provider.profile': 'Wasifu & Leseni ya TALA',
    'provider.add_package': 'Ongeza Kifurushi',

    // Financials
    'financials.title': 'Fedha, Makazi & Malipo',
    'gross.volume': 'Jumla ya Mauzo (TZS)',
    'platform.fee': 'Ada ya TANEXPO (15%)',
    'net.payout': 'Malipo Halisi ya Mwendeshaji (85%)',
    'bot.compliance.note': 'Miamala yote inalipwa kisheria kwa Shilingi ya Tanzania (TZS) chini ya Kanuni za BOT 2025.'
  }
};
