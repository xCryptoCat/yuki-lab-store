// Structured data (schema.org JSON-LD) for the home page, in both languages.
// tools/seo-plugin.js injects it into index.html (Japanese, /) and en/index.html (English, /en).
// Keep the facts here in step with what the page itself says.

const T = (l, ja, en) => (l === 'ja' ? ja : en);

export const SITE = 'https://yukilab.co';
export const PAGE_URL = { ja: `${SITE}/`, en: `${SITE}/en` };
export const CONTACT_EMAIL = 'sakuseed0327@gmail.com';

// Operating company, as registered with the National Tax Agency (国税庁 法人番号公表サイト).
export const COMPANY = {
  ja: '株式会社裕輝',
  kana: 'ユウキ',
  en: 'Yuki Co., Ltd.',
  corporateNumber: '5140001128433',
  registry: 'https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=5140001128433',
  founded: '2022-12',
  site: 'https://yuki-security.com/',
};
const ADDRESS = (l) => ({
  '@type': 'PostalAddress',
  postalCode: '658-0052',
  addressRegion: T(l, '兵庫県', 'Hyogo'),
  addressLocality: T(l, '神戸市東灘区', 'Higashinada-ku, Kobe'),
  streetAddress: T(l, '住吉東町1丁目2-18', '1-2-18 Sumiyoshi-higashimachi'),
  addressCountry: 'JP',
});
// Names people may search for. 裕輝 is read ゆうき (Yuki).
const LAB_NAMES = ['裕輝ラボ', 'ゆうきラボ', 'ユウキラボ', 'ユキラボ', 'Yuki Lab', 'Yukilab', 'YUKI LAB', '裕輝ラボ ストア', 'Yuki Lab Store'];

const ORG = `${SITE}/#organization`;
const PARENT = `${SITE}/#parent`;
const LABEL = `${SITE}/#yuki-record`;
const WEBSITE = `${SITE}/#website`;


const GAMES = [
  {
    ja: 'ユキゾウダッシュ', en: 'Yukizo Dash', apple: '6761814027', play: 'com.yukizo.app', web: 'https://yukizo-landing.vercel.app/',
    genre: ['Runner', 'Action'],
    dja: '子ゾウの警備員ユキゾウが夜の地下鉄を全力ダッシュする2Dランゲーム。神戸の地下鉄がモデルの駅も登場。ブラウザでも試せます。',
    den: "A 2D runner where Yukizo, a young elephant security guard, sprints through the subway at night, with stations modelled on Kobe's subway. Also playable in the browser.",
  },
  {
    ja: 'ヒーローカンパニー', en: 'Hero Company', apple: '6765558986', play: 'com.sunchin.securitycompanysim',
    genre: ['Simulation', 'Management'],
    dja: '警備会社の社長になり、隊員を採用・育成して現場に配置し、10年（120ヶ月）で街のヒーローをめざす経営シミュレーション。',
    den: 'A management sim: run a security company, hire, train and dispatch guards, and grow into the town\'s heroes over 10 years (120 months).',
  },
  {
    ja: 'ユキゾウ面接官シミュレーター', en: 'Yukizo the Interviewer', apple: '6767138180', play: 'com.yukizou.interviewer',
    genre: ['Simulation'],
    dja: '履歴書・面接・チャットで求職者の本性を見抜く採用シミュレーション。全10ラウンド、最終ランクはSSSまで。',
    den: 'A hiring sim: read CVs, interview and chat to see through each applicant. 10 rounds, ranks up to SSS.',
  },
  {
    ja: 'ユキゾウのまちがい探し', en: "Yukizo's Spot the Difference", apple: '6763910483', play: 'com.yukizo.detectiveduty',
    genre: ['Puzzle'],
    dja: 'ユキゾウといっしょに2枚の絵からまちがいを探すゲーム。3つのゲームモード。',
    den: 'Find the differences between two pictures with Yukizo, in three game modes.',
  },
  {
    ja: 'パワースキャナー', en: 'Power Scanner', apple: '6762236525', play: 'com.powerscanner.app',
    genre: ['Card battle'],
    dja: 'カメラでスキャンしたものが、レア度つきのバトルカードになるカードバトルゲーム。',
    den: 'Scan anything with your camera and it becomes a battle card with its own rarity.',
  },
  {
    ja: 'あのゲーム', en: 'That Game', apple: '6803750264', play: 'com.anogame.app',
    genre: ['Battle', 'Party'],
    dja: 'チャージ・波・ガードを同時に出し合う読み合いバトル。登録なしですぐ遊べます。',
    den: 'Charge, wave, guard: a mind-reading battle where both players move at once. No sign-up needed.',
  },
  {
    ja: 'レーダークエスト', en: 'Radar Quest', apple: '6780334604', play: 'com.yuki.tankenquest',
    genre: ['RPG', 'Location-based'],
    dja: '地図ではなくレーダーを頼りに実際に街を歩いて遊ぶ位置情報RPG。神戸・明石・芦屋・西宮・尼崎の238スポット。',
    den: 'A location RPG you play by walking around town with a radar instead of a map: 238 spots across Kobe, Akashi, Ashiya, Nishinomiya and Amagasaki.',
  },
];

const SERVICES = [
  ['ゲーム制作', 'Game development', '企画・キャラクター・開発まで、スマホゲームをまるごと制作。', 'Mobile games from concept and characters to development.'],
  ['Excel・Word・PowerPoint資料作成', 'Excel, Word and PowerPoint documents', '表計算・集計、文書・マニュアル、プレゼン資料の作成。', 'Spreadsheets, documents and manuals, and presentation decks.'],
  ['音楽制作', 'Music production', '作曲・BGM制作。自社レーベル Yuki Record からのリリースも可能。', 'Composing and background music, with release on our own label, Yuki Record.'],
  ['動画制作・動画編集', 'Video production and editing', '企画・撮影・制作から、お手持ちの素材の編集まで。', 'Planning, shooting and producing video, or editing your footage.'],
  ['コーポレートサイト制作', 'Company websites', '更新しやすく、スマホ対応が標準のコーポレートサイト。', 'Company websites that are easy to update and mobile-ready as standard.'],
  ['3Dキャラクター・Web演出', '3D mascots for websites', '動いて反応する3Dキャラクターをサイトに。', 'Live 3D characters that move and react on your website.'],
  ['セキュリティアプリ開発', 'Security apps', '巡回記録・報告書・シフト連絡など、警備の現場の業務をアプリに。', 'Apps for security work: patrol logs, incident reports and shift messages.'],
  ['業務アプリ・スマホアプリ開発', 'Business and mobile apps', '社内の申請・管理ツールからお客さま向けアプリまで。', 'From internal request and admin tools to customer-facing apps.'],
  ['ロゴデザイン', 'Logo design', 'ロゴ・シンボルのデザイン。', 'Logos, marks and identity.'],
  ['UI/UXデザイン', 'UI/UX design', '画面設計と使いやすさの設計。', 'Screen design and usability.'],
  ['グラフィックデザイン', 'Graphic design', '印刷物・Web素材のデザイン。', 'Print and digital graphics.'],
];

export function structuredData(l) {
  const page = PAGE_URL[l];
  const lpPlan = {
    '@type': 'Offer',
    name: T(l, '採用・問い合わせLP制作', 'Recruitment and enquiry landing page'),
    description: T(l,
      '1ページ・最大6セクション、スマホ対応。原稿整理・お問い合わせへの導線、まとめて修正2回。素材・構成確定後、標準10営業日。撮影・3D演出・独自機能・ドメイン等の費用は別途。',
      'One page with up to 6 sections, mobile-ready, copy organisation and enquiry links, 2 consolidated revision rounds. Typically 10 business days after materials and structure are agreed. Photography, 3D, custom features and domain costs are extra.'),
    price: '88000',
    priceCurrency: 'JPY',
    priceSpecification: { '@type': 'PriceSpecification', price: '88000', priceCurrency: 'JPY', valueAddedTaxIncluded: true },
    itemOffered: {
      '@type': 'Service',
      name: T(l, 'ランディングページ（LP）制作', 'Landing page design and build'),
      serviceType: T(l, 'LP制作', 'Landing page design'),
      provider: { '@id': ORG },
      areaServed: { '@type': 'Country', name: 'Japan' },
    },
    seller: { '@id': ORG },
    url: `${page}#aisle-web`,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG,
        name: T(l, '裕輝ラボ', 'Yuki Lab'),
        alternateName: LAB_NAMES.filter((n) => n !== T(l, '裕輝ラボ', 'Yuki Lab')),
        brand: { '@type': 'Brand', name: '裕輝ラボ', alternateName: 'Yuki Lab', logo: `${SITE}/icon-512.png` },
        slogan: T(l, 'ほしいものを、オーダーメイドで。', 'Games, video, music, design, web and apps, all made to order.'),
        url: `${SITE}/`,
        logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png`, width: 512, height: 512 },
        image: `${SITE}/img/og.jpg`,
        description: T(l,
          '裕輝ラボ（ゆうきラボ／Yuki Lab）は、兵庫県神戸市の株式会社裕輝（ユウキ、法人番号 5140001128433）が運営するクリエイティブ部門です。株式会社裕輝は警備ブランド Yuki Security も運営しています。ゲーム、LP・Webサイト、スマホアプリ・セキュリティアプリ、音楽・動画、ロゴ・UI/UXデザイン、Excel・Word・PowerPoint資料をオーダーメイドで制作します。店長はゾウのマスコット「ユキゾウ」。',
          'Yuki Lab (裕輝ラボ, pronounced "Yuki Lab") is the creative studio run by Yuki Co., Ltd. (株式会社裕輝, corporate number 5140001128433) in Kobe, Japan, the company behind the security brand Yuki Security. It makes games, landing pages and websites, mobile and security apps, music and video, logo and UI/UX design, and Excel, Word and PowerPoint documents to order. Its store manager is Yukizo, an elephant mascot.'),
        email: CONTACT_EMAIL,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: CONTACT_EMAIL,
          availableLanguage: ['Japanese', 'English'],
          areaServed: 'JP',
        },
        address: ADDRESS(l),
        location: { '@type': 'Place', name: T(l, '神戸市東灘区', 'Higashinada-ku, Kobe'), address: ADDRESS(l) },
        foundingLocation: { '@type': 'Place', name: T(l, '兵庫県神戸市', 'Kobe, Hyogo, Japan') },
        areaServed: { '@type': 'Country', name: 'Japan' },
        knowsLanguage: ['ja', 'en'],
        knowsAbout: ['Game development', 'Mobile apps', 'Landing pages', 'Web design', 'Three.js 3D characters', 'Music production', 'Video production', 'Logo design', 'UI/UX design', 'Security operations apps'],
        parentOrganization: { '@id': PARENT },
        subOrganization: { '@id': LABEL },
        sameAs: [
          'https://apps.apple.com/jp/developer/yuki-k-k/id1891259139',
          'https://www.tiktok.com/@yukirecord',
          'https://play.google.com/store/apps/developer?id=%E8%A3%95%E8%BC%9D%E3%83%A9%E3%83%9C',
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: T(l, '裕輝ラボの制作メニュー', 'What Yuki Lab makes'),
          itemListElement: [
            lpPlan,
            ...SERVICES.map(([nja, nen, dja, den]) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: T(l, nja, nen),
                description: T(l, dja, den),
                provider: { '@id': ORG },
                areaServed: { '@type': 'Country', name: 'Japan' },
              },
            })),
          ],
        },
      },
      {
        '@type': 'Corporation',
        '@id': PARENT,
        name: T(l, COMPANY.ja, COMPANY.en),
        legalName: COMPANY.ja,
        alternateName: ['裕輝', '株式会社ユウキ', 'ユウキ', 'Yuki Co., Ltd.', 'Yuki Security', COMPANY.ja].filter((n) => n !== T(l, COMPANY.ja, COMPANY.en)),
        url: COMPANY.site,
        identifier: { '@type': 'PropertyValue', propertyID: T(l, '法人番号', 'Japan Corporate Number'), value: COMPANY.corporateNumber },
        foundingDate: COMPANY.founded,
        description: T(l,
          '兵庫県神戸市東灘区の会社。警備ブランド Yuki Security（交通誘導・イベント警備）と、クリエイティブ部門の裕輝ラボ、音楽レーベル Yuki Record を運営。',
          'A company in Higashinada, Kobe, Japan. It runs the security brand Yuki Security (traffic and event guarding), the creative studio Yuki Lab (裕輝ラボ) and the music label Yuki Record.'),
        address: ADDRESS(l),
        sameAs: [COMPANY.registry],
        brand: [{ '@type': 'Brand', name: 'Yuki Security' }, { '@type': 'Brand', name: '裕輝ラボ', alternateName: 'Yuki Lab' }],
        subOrganization: [{ '@id': ORG }, { '@id': LABEL }],
      },
      {
        '@type': 'Organization',
        '@id': LABEL,
        name: 'Yuki Record',
        url: 'https://www.tiktok.com/@yukirecord',
        description: T(l, '裕輝ラボ（株式会社裕輝）の音楽レーベル。いっしょにつくった曲をリリースできます。', "Yuki Lab's own music label, which releases songs made with clients."),
        parentOrganization: { '@id': ORG },
        sameAs: ['https://www.tiktok.com/@yukirecord'],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE,
        url: `${SITE}/`,
        // Google takes the site name shown in results from WebSite.name on the home page
        name: T(l, '裕輝ラボ', 'Yuki Lab'),
        alternateName: [T(l, 'Yuki Lab', '裕輝ラボ'), 'ゆうきラボ', 'yukilab.co'],
        inLanguage: ['ja', 'en'],
        publisher: { '@id': ORG },
      },
      {
        '@type': 'WebPage',
        '@id': `${page}#webpage`,
        url: page,
        name: T(l, '裕輝ラボ（ゆうきラボ）｜株式会社裕輝のゲーム・LP・アプリ・動画・デザイン制作｜神戸', 'Yuki Lab (裕輝ラボ) | Games, landing pages, apps, video and design studio of Yuki Co., Ltd. in Kobe, Japan'),
        inLanguage: l,
        isPartOf: { '@id': WEBSITE },
        about: { '@id': ORG },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/img/og.jpg`, width: 1200, height: 630 },
        mainEntity: { '@id': ORG },
      },
      {
        '@type': 'ItemList',
        '@id': `${page}#games`,
        name: T(l, '裕輝ラボが配信中のゲーム', 'Games by Yuki Lab'),
        numberOfItems: GAMES.length,
        itemListElement: GAMES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'VideoGame',
            name: T(l, g.ja, g.en),
            alternateName: T(l, g.en, g.ja),
            description: T(l, g.dja, g.den),
            genre: g.genre,
            gamePlatform: g.web ? ['iOS', 'Android', 'Web browser'] : ['iOS', 'Android'],
            url: `https://apps.apple.com/jp/app/id${g.apple}`,
            sameAs: [`https://play.google.com/store/apps/details?id=${g.play}`, ...(g.web ? [g.web] : [])],
            inLanguage: 'ja',
            isAccessibleForFree: true,
            author: { '@id': ORG },
            publisher: { '@id': ORG },
          },
        })),
      },
    ],
  };
}

export { GAMES, SERVICES };

/** Structured data for the 会社概要 page (/company, Japanese only). */
export function companyStructuredData() {
  const url = `${SITE}/company`;
  const graph = structuredData('ja')['@graph'].filter((n) => [ORG, PARENT, LABEL, WEBSITE].includes(n['@id']));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ...graph,
      {
        '@type': 'AboutPage',
        '@id': `${url}#webpage`,
        url,
        name: '会社概要｜裕輝ラボ（ゆうきラボ）・株式会社裕輝',
        inLanguage: 'ja',
        isPartOf: { '@id': WEBSITE },
        about: [{ '@id': ORG }, { '@id': PARENT }],
        mainEntity: { '@id': ORG },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '裕輝ラボ', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: '会社概要', item: url },
        ],
      },
    ],
  };
}
