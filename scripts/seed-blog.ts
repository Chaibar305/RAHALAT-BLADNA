import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();

async function main() {
  console.log('🌱 Début de la mise à jour des articles de blog (Reset vues réelles + Version Anglaise)...');

  const samplePosts = [
    {
      slug: 'guide-bivouac-desert-merzouga',
      titleFr: 'Guide Ultime : Vivre une Nuit Magique en Bivouac à Merzouga',
      titleAr: 'الدليل الشامل: تجربة ليلة ساحرة في التخييم بصحراء مرزوكة',
      titleEn: 'Ultimate Guide: Experiencing a Magical Night Bivouac in Merzouga Desert',
      excerptFr:
        'Découvrez comment préparer votre escapade dans les dunes de l’Erg Chebbi : méharée au coucher du soleil, nuit sous la voûte céleste et secrets pour un séjour inoubliable.',
      excerptAr:
        'اكتشف كيفية التخطيط لرحلتك في كثبان عرق الشبي: ركوب الجمال عند الغروب، ليلة ساحرة تحت النجوم ونصائح لإقامة لا تُنسى.',
      excerptEn:
        'Discover how to prepare your getaway in the Erg Chebbi dunes: camel ride at sunset, a night under a celestial canopy, and tips for an unforgettable trip.',
      category: 'Conseils & Guides',
      authorName: 'Yassine de Rahalat Bladna',
      coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
      youtubeUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      isPublished: true,
      viewsCount: 0,
      contentFr: `
        <h2>L'appel du grand désert marocain</h2>
        <p>Il existe peu d'expériences sur Terre comparables à l'immensité sereine de l'<strong>Erg Chebbi</strong> à Merzouga. Lorsque les dunes d'un ocre éclatant rencontrent le bleu infini du ciel saharien, le temps semble suspendre son vol.</p>
        
        <blockquote>« Le désert ne se raconte pas, il se vit avec l'âme et le cœur. »</blockquote>

        <h3>1. Quand partir pour un bivouac optimal ?</h3>
        <p>La meilleure période pour visiter le désert de Merzouga s'étend d'<strong>octobre à avril</strong>. Durant ces mois, les températures diurnes sont douces (entre 22°C et 28°C) et propices aux randonnées chamelières, même si les nuits peuvent s'avérer fraîches.</p>

        <h3>2. Que mettre dans son sac à dos ?</h3>
        <ul>
          <li><strong>Un chèche traditionnel :</strong> indispensable pour se protéger du vent de sable et du soleil.</li>
          <li><strong>Des vêtements en couches superposables :</strong> t-shirts respirants le jour, polaire ou veste chaude la nuit.</li>
          <li><strong>Une batterie externe (Powerbank) :</strong> vos appareils photo seront très sollicités !</li>
          <li><strong>Crème solaire haute protection et lunettes de soleil UV400.</strong></li>
        </ul>

        <h3>3. L'expérience du campement nomade</h3>
        <p>Arrivés au campement au crépuscule après une traversée à dos de dromadaire, vous serez accueillis avec le traditionnel thé à la menthe et des dattes du Tafilalet. Autour du feu de camp, le rythme enivrant des tambours sahraouis accompagne la contemplation d'une voûte céleste d'une pureté inégalée.</p>
      `,
      contentAr: `
        <h2>نداء الصحراء المغربية الكبرى</h2>
        <p>قليلة هي التجارب في العالم التي تضاهي هدوء وسحر <strong>عرق الشبي</strong> في مرزوكة. عندما تلتقي الكثبان الرملية الذهبية بالسماء الصافية، يتوقف الزمن.</p>
        
        <blockquote>« الصحراء لا تُحكى، بل تُعاش بالقلب والروح. »</blockquote>

        <h3>1. أفضل وقت لزيارة مرزوكة</h3>
        <p>أفضل فترة تمتد من <strong>أكتوبر إلى أبريل</strong>، حيث تكون درجات الحرارة نهاراً معتدلة وممتعة لركوب الجمال والأنشطة الصحراوية.</p>

        <h3>2. مستلزمات الحقيبة الأساسية</h3>
        <ul>
          <li><strong>اللثام الصحراوي:</strong> حماية لا غنى عنها من الرياح والشمس.</li>
          <li><strong>ملابس دافئة للمساء:</strong> تنخفض درجات الحرارة ليلاً بشكل ملحوظ.</li>
          <li><strong>شاحن متنقل (Powerbank):</strong> لالتقاط أروع الصور والذكريات.</li>
        </ul>
      `,
      contentEn: `
        <h2>The Call of the Great Moroccan Desert</h2>
        <p>Few experiences on Earth compare to the serene vastness of <strong>Erg Chebbi</strong> in Merzouga. When radiant golden dunes meet the endless Saharan sky, time stands still.</p>

        <blockquote>“The desert cannot be told; it must be experienced with the soul and heart.”</blockquote>

        <h3>1. When is the Best Time to Go?</h3>
        <p>The optimal period to visit Merzouga is from <strong>October to April</strong>. Daytime temperatures are mild (22°C to 28°C), ideal for camel trekking, though desert nights can be chilly.</p>

        <h3>2. Essential Packing List</h3>
        <ul>
          <li><strong>Traditional scarf (Tagelmust):</strong> Essential protection against wind and sun.</li>
          <li><strong>Layered clothing:</strong> Breathable shirts for daytime and fleece/warm jacket for night.</li>
          <li><strong>Power bank:</strong> Your cameras and phones will be working overtime!</li>
          <li><strong>High SPF sunscreen and UV400 sunglasses.</strong></li>
        </ul>

        <h3>3. The Desert Camp Experience</h3>
        <p>Arriving at camp as the sun sets over the dunes, you are welcomed with traditional mint tea and succulent dates. Around the campfire, the hypnotic rhythm of Saharawi drums accompanies stargazing under one of the clearest night skies in the world.</p>
      `,
    },
    {
      slug: 'top-randonnees-haut-atlas-maroc',
      titleFr: 'Les 5 Plus Belles Randonnées du Haut Atlas Marocain',
      titleAr: 'أجمل 5 مسارات للمشي لمسافات طويلة في الأطلس الكبير',
      titleEn: 'Top 5 Most Beautiful Hikes in the High Atlas Mountains of Morocco',
      excerptFr:
        'Des gorges verdoyantes du M’Goun aux crêtes mythiques du mont Toubkal, parcourez les sentiers les plus spectaculaires du Maroc.',
      excerptAr:
        'من مضايق امكون الخضراء إلى قمم توبقال الأسطورية، استكشف أروع المسارات الجبلية في المغرب.',
      excerptEn:
        'From the verdant M’Goun gorges to the mythical ridges of Mount Toubkal, explore Morocco’s most spectacular mountain trails.',
      category: 'Randonnée & Nature',
      authorName: 'Sara - Guide Montagne',
      coverImage: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1600&q=80',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      isPublished: true,
      viewsCount: 0,
      contentFr: `
        <h2>Prendre de la hauteur au cœur des montagnes berbères</h2>
        <p>Le Haut Atlas est un paradis incontournable pour les amoureux de trekking et d'aventure authentique. Entre villages fortifiés en pisé, vallées irriguées et sommets vertigineux, chaque foulée est une rencontre avec la nature brute et l'hospitalité légendaire des habitants de l'Atlas.</p>

        <h3>1. L'ascension du Djebel Toubkal (4 167 m)</h3>
        <p>Toit de l'Afrique du Nord, le Toubkal reste le défi emblématique. Accessible aux randonneurs en bonne condition physique, l'itinéraire classique démarre à <strong>Imlil</strong> et propose 2 jours d'effort récompensés par un panorama à 360° saisissant.</p>

        <h3>2. La traversée des Gorges du M’Goun</h3>
        <p>Pour une immersion aquatique rafraîchissante en plein été, la descente des gorges les pieds dans l'eau entre falaises gigantesques et lauriers-roses est une aventure inoubliable pour toute la famille.</p>

        <h3>3. Le plateau du Yagour et ses gravures rupestres</h3>
        <p>Une plongée fascinante dans la préhistoire marocaine, mêlant alpages verdoyants et trésors archéologiques gravés dans le grès rouge.</p>
      `,
      contentAr: `
        <h2>استكشاف جبال الأطلس الشامخة</h2>
        <p>تعتبر جبال الأطلس الكبير وجهة استثنائية لعشاق المشي والمغامرات الجبلية في قلب الطبيعة المغربية العذراء.</p>
        <h3>1. قمة توبقال (4167 متر)</h3>
        <p>أعلى قمة في شمال إفريقيا ومغامرة فريدة تنطلق من قرية إمليل الساحرة.</p>
      `,
      contentEn: `
        <h2>Ascending into the Heart of the Berber Mountains</h2>
        <p>The High Atlas is a premier paradise for trekking enthusiasts and lovers of authentic adventures. Between earthen fortified villages, terraced valleys, and dramatic peaks, every step brings you closer to raw nature and legendary Berber hospitality.</p>

        <h3>1. Mount Toubkal Summit (4,167 m)</h3>
        <p>The roof of North Africa, Mount Toubkal is the ultimate iconic challenge. Departing from the mountain village of <strong>Imlil</strong>, the 2-day trek rewards hikers with a breath-taking 360-degree panorama.</p>

        <h3>2. Traversing the M’Goun Canyons</h3>
        <p>For a refreshing summer river trek, wading through the majestic M’Goun gorges flanked by towering red cliffs and oleanders is an unforgettable journey.</p>
      `,
    },
    {
      slug: 'chefchaouen-akchour-week-end-parfait',
      titleFr: 'Week-end Évasion : Chefchaouen la Perle Bleue et les Cascades d’Akchour',
      titleAr: 'عطلة نهاية الأسبوع: شفشاون الجوهرة الزرقاء وشلالات أقشور',
      titleEn: 'Weekend Getaway: Chefchaouen the Blue Pearl and Akchour Waterfalls',
      excerptFr:
        'Itinéraire complet sur 2 jours : ruelles cobalt de la médina, pont de Dieu naturel d’Akchour et meilleures adresses gourmandes.',
      excerptAr:
        'برنامج متكامل لمدة يومين: أزقة شفشاون الزرقاء، القنطرة الطبيعية وشلالات أقشور الساحرة.',
      excerptEn:
        'A comprehensive 2-day itinerary: cobalt blue alleys of the medina, God’s Bridge in Akchour, and the best local foodie spots.',
      category: 'Destinations',
      authorName: 'Équipe Rahalat Bladna',
      coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80',
      youtubeUrl: '',
      isPublished: true,
      viewsCount: 0,
      contentFr: `
        <h2>Chefchaouen, une toile vivante au pied du Rif</h2>
        <p>Nichée sous les cornes des monts Kelaa et Meggou, Chefchaouen envoûte instantanément quiconque foule ses pavés baignés d'un bleu indigo apaisant.</p>

        <h3>Jour 1 : Flânerie et histoire dans la médina</h3>
        <p>Commencez votre journée sur la place animée d'<strong>Outa el-Hammam</strong>, admirez la forteresse de la Kasbah et grimpez en fin d'après-midi vers la <em>Mosquée Espagnole</em> pour contempler le coucher de soleil embrasant les toits bleutés.</p>

        <h3>Jour 2 : Fraîcheur et randonnée à Akchour</h3>
        <p>À seulement 30 km de la ville, la vallée d'Akchour offre deux merveilles naturelles : la grande cascade et l'impressionnant <strong>Pont de Dieu</strong>, arche rocheuse suspendue à 25 mètres au-dessus du canyon.</p>
      `,
      contentAr: `
        <h2>شفشاون، سحر الأزقة الزرقاء</h2>
        <p>تعتبر مدينة شفشاون من أجمل الوجهات السياحية العالمية بفضل ألوانها الزرقاء وطبيعتها الجبلية الخلابة في الريف المغربي.</p>
      `,
      contentEn: `
        <h2>Chefchaouen, a Living Canvas Beneath the Rif Mountains</h2>
        <p>Nestled beneath the peaks of Kelaa and Meggou, Chefchaouen instantly captivates anyone strolling through its soothing indigo and cobalt cobblestones.</p>

        <h3>Day 1: Medina Exploration & Sunset Vistas</h3>
        <p>Start your day at the lively <strong>Outa el-Hammam</strong> square, tour the 15th-century Kasbah fortress, and hike up to the Spanish Mosque for a panoramic sunset over the blue rooftops.</p>

        <h3>Day 2: Refreshing Nature Hike at Akchour</h3>
        <p>Just 30 km from town, Akchour valley features crystal-clear emerald pools, cascading waterfalls, and the magnificent <strong>God’s Bridge</strong>, a natural limestone arch towering 25 meters above the canyon.</p>
      `,
    },
    {
      slug: 'gastronomie-marocaine-secrets-tagine-parfait',
      titleFr: 'Saveurs du Terroir : Les Secrets d’un Véritable Tagine Marocain',
      titleAr: 'نكهات أصيلة: أسرار الطاجين المغربي التقليدي',
      titleEn: 'Flavors of the Land: Secrets of an Authentic Moroccan Tagine',
      excerptFr:
        'Épices nobles, cuisson lente à l’étouffée et alliances sucré-salé : plongez au cœur de l’une des plus riches cuisines au monde.',
      excerptAr:
        'التوابل العطرية، الطهي البطيء وتمازج النكهات: رحلة في أسرار المطبخ المغربي العريق.',
      excerptEn:
        'Noble spices, slow clay-pot braising, and sweet-savory harmony: dive into one of the world’s most celebrated culinary traditions.',
      category: 'Culture & Gastronomie',
      authorName: 'Chef Fatima Zohra',
      coverImage: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1600&q=80',
      youtubeUrl: '',
      isPublished: false,
      viewsCount: 0,
      contentFr: `
        <h2>L'art culinaire marocain, héritage millénaire</h2>
        <p>Le tagine n'est pas seulement un plat, c'est un récipient en terre cuite et un rituel de partage qui traverse les générations depuis des siècles.</p>
        <h3>Le secret des épices</h3>
        <p>Le gingembre frais, le curcuma de qualité, le safran pur de Taliouine et un soupçon de cannelle composent la symphonie aromatique indispensable.</p>
      `,
      contentAr: `
        <h2>فن الطهي المغربي الأصيل</h2>
        <p>الطاجين المغربي ليس مجرد وجبة، بل هو رمز للكرم والضيافة المتوارثة عبر الأجيال.</p>
      `,
      contentEn: `
        <h2>The Art of Moroccan Cooking, a Millenary Heritage</h2>
        <p>The tagine is more than just a dish; it is an earthen vessel and a sharing ritual passed down through generations.</p>
        <h3>The Secret of the Spices</h3>
        <p>Fresh ginger, fine turmeric, pure Taliouine saffron, and a touch of cinnamon form the indispensable aromatic symphony.</p>
      `,
    },
  ];

  for (const postData of samplePosts) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: postData.slug },
    });

    if (existing) {
      await prisma.blogPost.update({
        where: { slug: postData.slug },
        data: {
          titleEn: postData.titleEn,
          excerptEn: postData.excerptEn,
          contentEn: postData.contentEn,
          viewsCount: 0, // Reset to 0 real views!
        },
      });
      console.log(`🔄 Article mis à jour avec EN & vues réinitialisées à 0 : ${postData.titleFr}`);
    } else {
      await prisma.blogPost.create({
        data: postData,
      });
      console.log(`✅ Article créé : ${postData.titleFr}`);
    }
  }

  // S'assurer que tous les articles sans exception ont viewsCount = 0
  await prisma.blogPost.updateMany({
    data: { viewsCount: 0 },
  });

  console.log('🎉 Reset des vues réelles (0) et ajout de la version anglaise terminés !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed blog:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
