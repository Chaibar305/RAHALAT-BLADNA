import { prisma } from "../src/lib/prisma";

interface DayTranslation {
  dayNumber: number;
  titleEn: string;
  descriptionEn: string;
}

interface TripTranslation {
  slug: string;
  titleEn: string;
  shortDescriptionEn: string;
  overviewEn: string;
  includedServicesEn: string[];
  excludedServicesEn: string[];
  checklistItemsEn: string[];
  days: DayTranslation[];
}

const TRIPS_DATA: TripTranslation[] = [
  {
    slug: "magie-desert-merzouga-todra-3j",
    titleEn: "Desert Magic: Erg Chebbi Dunes & Todra Gorges (3D/2N)",
    shortDescriptionEn: "A breathtaking escape into the highest dunes of Morocco with camel caravan, luxury desert camp and Todra Gorges.",
    overviewEn: "Experience the timeless enchantment of the Moroccan Sahara. From the lush valleys of the Middle Atlas and the breathtaking sheer cliffs of the Todra Gorges to the golden dunes of Erg Chebbi, this journey is crafted for travelers seeking authenticity, serenity under the starry canopy, and the rhythmic warmth of Berber campfires.",
    includedServicesEn: [
      "Comfortable air-conditioned tourist transport (TIST)",
      "1 Night in selected hotel / riad & 1 Night in luxury desert bivouac",
      "Half-board (Traditional dinners and hearty breakfasts)",
      "Sunset camel trek across Erg Chebbi golden dunes",
      "Gnawa musical evening by the campfire under the stars",
      "Certified professional tour guide and local accompaniment",
      "Travel assistance and accident insurance included",
    ],
    excludedServicesEn: [
      "Lunches during transit stops",
      "Personal beverages and souvenirs",
      "Optional 1-hour quad or buggy rental in the dunes",
      "Tips for driver and local guiding team",
      "Single room supplement",
    ],
    checklistItemsEn: [
      "Original National ID Card (CIN) or Passport",
      "Comfortable walking shoes and flip-flops",
      "Warm jacket/fleece for cool desert nights",
      "Sunglasses, sunscreen SPF 50, and desert scarf (Cheche)",
      "Portable power bank and personal first-aid items",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Crossing the Middle Atlas & Arrival at Todra Gorges",
        descriptionEn: "Morning departure from Casablanca and Rabat. Scenic drive across the Middle Atlas with panoramic stop at the Ifrane cedar forest. Guided walking discovery of the spectacular 300m vertical rock cliffs of the Todra Gorges. Dinner and overnight stay.",
      },
      {
        dayNumber: 2,
        titleEn: "Camel Caravan, Golden Sunset & Luxury Saharan Bivouac",
        descriptionEn: "Journey towards Merzouga. Camel caravan ride across the soaring orange dunes of Erg Chebbi as the sun dips below the horizon. Traditional Moroccan feast, live Gnawa drumming around the campfire, and peaceful night under a star-filled sky.",
      },
      {
        dayNumber: 3,
        titleEn: "Sunrise over the Dunes, Khamlia Village & Return Journey",
        descriptionEn: "Rise early to marvel at the magnificent desert sunrise. Visit the historic village of Khamlia, home to the authentic Gnawa music tradition. Comfortable return journey back to Rabat and Casablanca with memories to cherish forever.",
      },
    ],
  },
  {
    slug: "perle-bleue-chefchaouen-akchour",
    titleEn: "The Blue Pearl: Chefchaouen & Akchour Waterfalls (2D/1N)",
    shortDescriptionEn: "A magical weekend blending the cobalt-washed alleys of Chefchaouen with the pristine turquoise streams of Akchour.",
    overviewEn: "Immerse yourself in northern Morocco's most photogenic jewel. Stroll along the soothing indigo-cobbled streets of the Chefchaouen medina, take in panoramic sunsets over the Rif Mountains from the Spanish Mosque, and hike through the lush limestone canyons of Akchour toward natural turquoise pools and God's Bridge.",
    includedServicesEn: [
      "Round-trip tourist transport in grand comfort",
      "1 Night stay in a charming traditional riad in Chefchaouen",
      "Breakfast included with fresh local mountain produce",
      "Guided walking tour of Chefchaouen medina & Spanish Mosque",
      "Guided hiking excursion in the Akchour natural reserve",
      "Certified tour leader throughout the weekend",
      "Travel assistance insurance included",
    ],
    excludedServicesEn: [
      "Lunches along the trail and dinners",
      "Personal drinks and artisan shopping",
      "Tips for driver and local guides",
      "Single room supplement",
    ],
    checklistItemsEn: [
      "Original National ID Card (CIN) or Passport",
      "Hiking boots or sneakers with good grip",
      "Waterproof shoes or aqua sandals for Akchour streams",
      "Swimsuit, microfiber quick-dry towel, and sun protection",
      "Light backpack for daily hike and water bottle",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Blue-Washed Medina & Sunset at the Spanish Mosque",
        descriptionEn: "Early departure toward the Rif Mountains. Check-in at our charming riad in Chefchaouen. Guided walking tour through the serene blue-painted alleys of the medina, Outa El-Hammam square, and panoramic sunset hike to the Spanish Mosque. Free evening to savor local Rif gastronomy.",
      },
      {
        dayNumber: 2,
        titleEn: "Akchour Waterfalls Hike & God's Bridge Exploration",
        descriptionEn: "Hearty breakfast followed by transfer to Talassemtane National Park. Guided hike along crystalline mountain streams to the famous Akchour waterfalls and the dramatic natural stone arch of God's Bridge. Lunch by the natural river pools and evening return drive.",
      },
    ],
  },
  {
    slug: "odyssee-du-sud-merzouga-dades-ouarzazate",
    titleEn: "Southern Odyssey: Merzouga, Dadès & Ouarzazate Grand Tour (5D/4N)",
    shortDescriptionEn: "An unforgettable 5-day journey across the Sahara, the Road of a Thousand Kasbahs, Todra Gorges, and UNESCO's Aït Ben Haddou.",
    overviewEn: "Embark on an epic traverse through southern Morocco's legendary landscapes. From high-altitude flight connections to camel treks across Erg Chebbi, towering clay gorges, ancient subterranean irrigation systems, fragrant rose valleys, and clay fortresses of Hollywood renown, this Grand Tour offers the pinnacle of Moroccan heritage and comfort.",
    includedServicesEn: [
      "Domestic flights or grand-comfort tourist coach transfers",
      "4 Nights in luxury hotels, authentic riads and premium desert camp",
      "Half-board (Exquisite traditional dinners and daily breakfasts)",
      "Private camel trek across the dunes of Erg Chebbi",
      "Visits: Meski Blue Spring, Erfoud fossils, Khattarat, Dadès, Aït Ben Haddou",
      "Official certified guide and dedicated local tour director",
      "Travel insurance and assistance included",
    ],
    excludedServicesEn: [
      "Midday lunches and refreshments",
      "Optional quad/buggy adventure in Merzouga",
      "Cinema museum / Atlas Studios entrance tickets in Ouarzazate",
      "Driver and guide gratuities",
      "Single supplement for solo room occupancy",
    ],
    checklistItemsEn: [
      "Original ID or Passport (mandatory for domestic flights/hotels)",
      "Comfortable trekking shoes and light breathable clothing",
      "Warm outerwear (fleece/jacket) for desert evening temperatures",
      "Sunscreen SPF 50, polarized sunglasses, and sunhat",
      "Camera, extra memory cards, and universal charging pack",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Flight Casablanca → Errachidia & Welcome to Tafilalet",
        descriptionEn: "Direct flight from Casablanca to Errachidia. Warm airport reception by your tour crew and transfer to your prestigious hotel. Welcome Moroccan mint tea, tour orientation briefing, and delicious opening dinner.",
      },
      {
        dayNumber: 2,
        titleEn: "Meski Oasis, Fossil Lands & Starlit Merzouga Bivouac",
        descriptionEn: "Discover the natural springs of Ain Meski, explore Erfoud's prehistoric fossil workshops, and visit the historic trade gates of Rissani. Arrive in Merzouga for a sunset camel trek across the dunes to your luxury tented camp. Stargazing and live nomad music.",
      },
      {
        dayNumber: 3,
        titleEn: "Saharan Dawn, Ancient Khattarat & Majestic Dadès Canyons",
        descriptionEn: "Witness the majestic golden sunrise over the dunes. Explore the ancestral underground irrigation canals (Khattarat) of Tinjdad. Traverse the breathtaking Todra Gorges before driving up the hairpin bends of the Dadès Valley. Overnight in Dadès.",
      },
      {
        dayNumber: 4,
        titleEn: "Road of a Thousand Kasbahs, Skoura & UNESCO's Aït Ben Haddou",
        descriptionEn: "Scenic drive along the Valley of the Roses and the Skoura palm grove. Guided exploration of the UNESCO World Heritage ksar of Aït Ben Haddou, legendary backdrop to Gladiator and Game of Thrones. Evening arrival in Ouarzazate.",
      },
      {
        dayNumber: 5,
        titleEn: "Return Flight Ouarzazate → Casablanca & Farewell",
        descriptionEn: "Morning visit of the historic Kasbah Taourirt. Transfer to Ouarzazate Airport for your return flight to Casablanca, concluding an awe-inspiring Southern Odyssey.",
      },
    ],
  },
  {
    slug: "taghia-passage-berbere-zaouiat-ahansal",
    titleEn: "Taghia, The Berber Pass & Zaouiat Ahansal Trek (3D/2N)",
    shortDescriptionEn: "A legendary mountain trek through the limestone amphitheaters, timber cliff paths, and hidden canyons of the High Atlas.",
    overviewEn: "Tucked away in the secluded heart of the Central High Atlas, Taghia is world-renowned among climbers and adventurers for its vertical 800m limestone monoliths and awe-inspiring river canyons. Tread the dizzying wooden cliff bridges crafted by Berber shepherds, sleep in authentic village lodges, and experience untouched wilderness.",
    includedServicesEn: [
      "Grand-comfort tourist transportation from Rabat & Casablanca",
      "2 Nights full lodge accommodation in authentic Berber mountain gîtes",
      "Full board in Taghia (Traditional homecooked Berber meals)",
      "Certified High Mountain guide & local trail safety leaders",
      "Muleteers for heavy baggage transport up to the village",
      "Mountain search, rescue and travel assistance insurance",
    ],
    excludedServicesEn: [
      "Personal drinks, bottled mineral water and snacks",
      "Technical climbing gear (if undertaking rock climbs)",
      "Gratuities for mountain guides and mule drivers",
    ],
    checklistItemsEn: [
      "Sturdy hiking boots with ankle support",
      "Trekking backpack (30-40L) and trekking poles",
      "Warm thermal layers, windbreaker jacket, and rain poncho",
      "Headlamp with extra batteries and personal pharmacy",
      "High-energy snacks (dried fruits, nuts, energy bars)",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Night Departure from Rabat & Casablanca — Onwards to Zaouiat Ahansal",
        descriptionEn: "Late evening rendezvous at train stations. Overnight scenic journey through the Atlas foothills. Early morning arrival in Zaouiat Ahansal, hearty mountain breakfast, and luggage handover to the mule team for the hike up to Taghia.",
      },
      {
        dayNumber: 2,
        titleEn: "Berber Cliff Pass Hike (5h), Taghia Waterfalls & Lodge Warmth",
        descriptionEn: "A thrilling guided trek crossing the famous timber cliff passages suspended high above the canyon. Marvel at the dramatic natural amphitheater of Taghia and crystal-clear cascading springs. Evening mint tea, Berber tagine, and storytelling around the stove.",
      },
      {
        dayNumber: 3,
        titleEn: "Taghia Gorges Exploration, Ahansal Riverhead & Return Journey",
        descriptionEn: "Morning exploration of the deep limestone slot canyons and the sacred springs of Oued Ahansal. Gentle descent back to the valley, farewell lunch, and comfortable coach transfer back to Casablanca and Rabat.",
      },
    ],
  },
  {
    slug: "voyage-azrou-zaouiat-ifrane",
    titleEn: "Middle Atlas Escape: Cedar Forests, Lakes & Zaouiat Ifrane (3D/2N)",
    shortDescriptionEn: "A rejuvenating mountain getaway among cedar sanctuaries, Barbary macaque monkeys, crystal waterfalls, and scenic lakes.",
    overviewEn: "Escape the bustling cities and breathe in the crisp, resinous pine air of the Middle Atlas. Stay in a boutique mountain park retreat, visit the whispering springs of Oum Er-Rbia, admire the cascade amphitheater of Zaouiat Ifrane, and explore the charming architecture of Ifrane, Morocco's Little Switzerland.",
    includedServicesEn: [
      "Tourist transport in modern air-conditioned vehicle",
      "2 Nights at Auberge Jomana Park or selected boutique country lodge",
      "Half-board (Hearty mountain breakfasts and authentic dinners)",
      "Guided visits to Oum Er-Rbia springs & Zaouiat Ifrane waterfalls",
      "Stop at the ancient Gouraud Cedar tree & monkey forest",
      "Dedicated tour coordinator throughout the retreat",
      "Travel assistance insurance included",
    ],
    excludedServicesEn: [
      "Midday lunches at mountain food stalls",
      "Personal expenses and artisanal cedarwood purchases",
      "Tips for guiding team and drivers",
      "Single supplement for private room",
    ],
    checklistItemsEn: [
      "Valid National ID Card or Passport",
      "Comfortable trainers or light walking boots",
      "Sweater / jacket for cool mountain mornings and evenings",
      "Camera / smartphone with plenty of storage",
      "Hat, sunscreen, and personal toiletries",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Departure, Check-in at Jomana Park & Evening in Azrou",
        descriptionEn: "Departure from Casablanca and Rabat. Scenic drive into the cedar-forested plateaus of the Middle Atlas. Check-in at Auberge Jomana Park, stroll through the vibrant craft market of Azrou, and enjoy a warm welcoming dinner.",
      },
      {
        dayNumber: 2,
        titleEn: "Oum Er-Rbia Springs, Zaouiat Ifrane Cascades & Ifrane Town",
        descriptionEn: "Full-day excursion to the roaring forty springs of Oum Er-Rbia. Continue to the idyllic cliffside village of Zaouiat Ifrane and its crystalline waterfalls. Evening walk through the clean, alpine-style streets and gardens of Ifrane.",
      },
      {
        dayNumber: 3,
        titleEn: "Relaxed Poolside Morning, Gouraud Cedar & Return Drive",
        descriptionEn: "Leisurely breakfast and relaxation at the lodge pool or gardens. Short walk into the cedar forest to greet the famous Barbary macaques near the historic Gouraud Cedar. Afternoon return journey to Rabat and Casablanca.",
      },
    ],
  },
  {
    slug: "ascension-jbel-moussa-belyounech",
    titleEn: "Jbel Moussa Summit & Belyounech Turquoise Bay (3D/2N)",
    shortDescriptionEn: "Climb the northern Pillar of Hercules (851m) with jaw-dropping views of Gibraltar, followed by snorkeling in Belyounech.",
    overviewEn: "Where the Mediterranean kisses the Atlantic and Africa gazes upon Europe. Ascend the legendary peak of Jbel Moussa (851m), one of the ancient Pillars of Hercules, commanding unmatched views over the Strait of Gibraltar. Then unwind in the crystal-clear turquoise waters and secret coves of the fishing hamlet of Belyounech.",
    includedServicesEn: [
      "Round-trip tourist transport from Casablanca and Rabat",
      "2 Nights accommodation in a seaside guesthouse / hostel",
      "Breakfasts included with fresh Mediterranean produce",
      "Certified mountain guide for the ascent of Jbel Moussa (851m)",
      "Snorkeling masks & fins provided for Belyounech bay exploration",
      "Campfire / evening gathering with team leadership",
      "Complete mountain and aquatic travel insurance",
    ],
    excludedServicesEn: [
      "Lunches, fresh fish barbecues and dinners",
      "Boat rental or scuba diving sessions",
      "Driver and mountain guide tips",
      "Single room supplement",
    ],
    checklistItemsEn: [
      "Original National ID Card (CIN) or Passport",
      "High-traction hiking boots for steep rocky trails",
      "Aqua shoes for rocky coves and beach exploration",
      "Swimwear, beach towel, waterproof phone pouch",
      "Sunscreen SPF 50, sunglasses, and 2L water capacity",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Friday Night — Coastal Drive to the Northern Tip",
        descriptionEn: "Evening departure from Casablanca and Rabat. Comfortable drive along the Atlantic and Mediterranean coasts. Late night arrival at our seaside guesthouse in Belyounech. Room allocation and good night's rest.",
      },
      {
        dayNumber: 2,
        titleEn: "Saturday — Jbel Moussa Summit Hike (851m) & Evening Fire",
        descriptionEn: "Early breakfast and departure for the ascent of Jbel Moussa (the legendary southern Pillar of Hercules). Conquer the 851m summit with sensational 360-degree vistas overlooking the Spanish coast, Ceuta, and passing container ships. Descend for a convivial seafood dinner and seaside evening.",
      },
      {
        dayNumber: 3,
        titleEn: "Sunday — Aquatic Paradise of Belyounech, Snorkeling & Return",
        descriptionEn: "Morning relaxation on the secluded pebble shores of Belyounech. Snorkeling in the transparent turquoise waters and optional sea kayaking. Fresh grilled fish lunch by the water before our smooth return drive home.",
      },
    ],
  },
  {
    slug: "barrage-asfalou-ghadir-hamma-kayak",
    titleEn: "Asfalou Dam Lake, Ghadir Hamma Natural Pools & Kayak (3D/2N)",
    shortDescriptionEn: "Wild nature camping, thrilling kayak session on Asfalou Lake, and river hiking through the emerald pools of Ghadir Hamma.",
    overviewEn: "Venture off the beaten track into the untouched landscapes of the Pre-Rif mountains. Paddle across the mirror-like waters of the Asfalou Dam Lake surrounded by pine-covered hills, spend an enchanting night in comfortable tents by the water, and trek up the wild river canyons of Ghadir Hamma with its natural rock jacuzzis.",
    includedServicesEn: [
      "Round-trip tourist transportation from Casablanca & Rabat",
      "2 Nights in furnished camping tents or local eco-lodge",
      "Full kayaking gear (Sit-on-top kayaks, certified life vests, paddles)",
      "Half-board meals (Campfire barbecues and mountain breakfasts)",
      "Professional outdoor guides and water safety instructors",
      "Assistance and adventure sports travel insurance",
    ],
    excludedServicesEn: [
      "Lunches during travel pauses",
      "Personal drinks and snacks",
      "Sleeping bag (can be rented on request)",
      "Tips for guiding crew and camp staff",
    ],
    checklistItemsEn: [
      "Valid National ID Card or Passport",
      "Aqua shoes / water shoes with solid soles (mandatory)",
      "Dry-bag for electronic devices while kayaking",
      "Light fleece for camp nights and casual sportswear",
      "Sunscreen, polarized sunglasses, hat, and powerbank",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Departure & Setup at Bab Asfalou Lakeside Camp",
        descriptionEn: "Depart from Casablanca and Rabat heading north into the Taher Souk region. Arrive at Bab Asfalou by the lake, settle into your equipped tents, and enjoy a warm welcoming Moroccan dinner under the stars.",
      },
      {
        dayNumber: 2,
        titleEn: "Kayak Session on Asfalou Lake & Evening Campfire",
        descriptionEn: "After a lakeside breakfast, safety briefing and paddle demonstration. Spend the day kayaking across the serene waters of Asfalou Dam Lake, exploring hidden creeks and islets. Sunset swim followed by a lively campfire feast with music.",
      },
      {
        dayNumber: 3,
        titleEn: "Aquatic River Trek to Ghadir Hamma Pools & Return",
        descriptionEn: "Exhilarating aquatic hike through the river gorge of Ghadir Hamma. Swim in the deep emerald rock pools and natural whirlpools. Outdoor picnic lunch before packing up and heading back to Rabat and Casablanca.",
      },
    ],
  },
  {
    slug: "escapade-imlil-agafay-marrakech",
    titleEn: "Imlil High Atlas, Agafay Desert & Marrakech (3D/2N)",
    shortDescriptionEn: "A journey combining High Atlas peaks, Agafay desert sunset, and the vibrant red city of Marrakech.",
    overviewEn: "Immerse yourself in three iconic facets of Morocco in a single weekend. From the alpine freshness of Imlil under Mount Toubkal's shadow to the moon-like stone dunes and luxury nomadic lounges of the Agafay Desert, culminating in the cultural vibrancy and palaces of Marrakech.",
    includedServicesEn: [
      "Air-conditioned tourist transport throughout the itinerary",
      "1 Night in mountain lodge in Imlil & 1 Night in central riad in Marrakech",
      "Half-board (Breakfasts and traditional Moroccan dinners)",
      "Guided trek to the waterfalls and walnut orchards of Imlil",
      "Agafay Desert sunset experience with musical lounge gathering",
      "Official tour coordinator and certified local mountain guide",
      "Travel assistance insurance included",
    ],
    excludedServicesEn: [
      "Lunches during excursions",
      "Optional sunrise hot air balloon flight in Marrakech",
      "Optional 1-hour quad safari in Agafay or Marrakech Palmeraie",
      "Historical monument entrance tickets (Bahia Palace, Majorelle Gardens)",
      "Tips for drivers and local guides",
    ],
    checklistItemsEn: [
      "Original National ID Card or Passport",
      "Comfortable hiking sneakers or boots for Imlil trails",
      "Light summer clothing and warm layer for desert evening",
      "Sunglasses, sunscreen, and camera",
      "Swimwear for riad pool and personal care items",
    ],
    days: [
      {
        dayNumber: 1,
        titleEn: "Evening Departure from Rabat & Casablanca to Imlil Valley",
        descriptionEn: "Evening departure from Rabat (Agdal station) and Casablanca (Bab Al-Boraq). Scenic drive into the High Atlas Mountains. Late night arrival in Imlil, room distribution, welcoming tea, and restful sleep in the mountain air.",
      },
      {
        dayNumber: 2,
        titleEn: "Imlil Waterfalls, Tahannaout Lunch, Agafay Sunset & Marrakech Night",
        descriptionEn: "Morning hike to the refreshing waterfalls of Imlil amidst walnut and apple groves. Scenic descent to Tahannaout for lunch. Afternoon arrival in the arid stony dunes of the Agafay Desert for sunset tea. Evening arrival and overnight in a charming Marrakech riad.",
      },
      {
        dayNumber: 3,
        titleEn: "Sunrise Hot Air Balloon, Palmeraie Quad Safari & Return",
        descriptionEn: "Optional magical sunrise hot air balloon flight over the Atlas foothills. Discovery of the Palmeraie with optional quad biking, exploration of the iconic Jemaa el-Fna square and souks, followed by a comfortable late afternoon drive back.",
      },
    ],
  },
];

async function main() {
  console.log("🚀 Starting English migration for all trips...");

  for (const item of TRIPS_DATA) {
    const trip = await prisma.trip.findUnique({
      where: { slug: item.slug },
      include: { itineraryDays: { orderBy: { dayNumber: "asc" } } },
    });

    if (!trip) {
      console.warn(`⚠️ Trip not found with slug: ${item.slug}`);
      continue;
    }

    console.log(`\n📌 Updating Trip [${trip.slug}]: ${item.titleEn}`);

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        titleEn: item.titleEn,
        shortDescriptionEn: item.shortDescriptionEn,
        longDescriptionEn: item.overviewEn,
        overviewEn: item.overviewEn,
        includedServicesEn: item.includedServicesEn,
        excludedServicesEn: item.excludedServicesEn,
        checklistItemsEn: item.checklistItemsEn,
      },
    });

    for (const d of item.days) {
      const matchDay = trip.itineraryDays.find((day) => day.dayNumber === d.dayNumber);
      if (matchDay) {
        await prisma.itineraryDay.update({
          where: { id: matchDay.id },
          data: {
            titleEn: d.titleEn,
            descriptionEn: d.descriptionEn,
          },
        });
        console.log(`   ✅ Updated Day ${d.dayNumber}: ${d.titleEn}`);
      } else {
        console.warn(`   ⚠️ Day ${d.dayNumber} not found for trip ${trip.slug}`);
      }
    }
  }

  console.log("\n🎉 English migration successfully completed for all 8 trips!");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
