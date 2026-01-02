"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useLocale } from "next-intl";
import { getCreator } from "@/lib/creators";

interface FooterProps {
  creatorSlug?: string;
  creatorName?: string;
  showPlatformLinks?: boolean;
}

// Translations for footer sections
const translations = {
  en: {
    discover: "Discover",
    browseCreators: "Browse Creators",
    topCreators: "Top Creators",
    buyCredits: "Buy Credits",
    forCreators: "For Creators",
    becomeCreator: "Become a Creator",
    onlyfansAlternative: "OnlyFans Alternative",
    forAgencies: "For Agencies",
    agencyPlatform: "Agency Platform",
    agencyDashboard: "Agency Dashboard",
    agencyAnalytics: "Analytics & Reports",
    globalReach: "Global Reach",
    connect: "Connect",
    findAgency: "Find an Agency",
    findCreator: "Find a Creator",
    modelListing: "Model Listings",
    agencyDirectory: "Agency Directory",
    features: "Features",
    cryptoPayments: "Crypto Payments",
    blog: "Blog",
    legal: "Legal",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    tagline: "The best OnlyFans alternative with 5% fees and crypto payments.",
    creatorTagline: "Premium exclusive content for discerning collectors.",
    product: "Product",
    gallery: "Gallery",
    membership: "Membership",
    support: "Support",
    faq: "FAQ",
    contact: "Contact",
    social: "Social",
    allRightsReserved: "All rights reserved.",
  },
  es: {
    discover: "Descubrir",
    browseCreators: "Ver Creadores",
    topCreators: "Top Creadores",
    buyCredits: "Comprar Créditos",
    forCreators: "Para Creadores",
    becomeCreator: "Ser Creador",
    onlyfansAlternative: "Alternativa a OnlyFans",
    forAgencies: "Para Agencias",
    agencyPlatform: "Plataforma de Agencias",
    agencyDashboard: "Panel de Agencia",
    agencyAnalytics: "Análisis e Informes",
    globalReach: "Alcance Global",
    connect: "Conectar",
    findAgency: "Buscar Agencia",
    findCreator: "Buscar Creador",
    modelListing: "Listado de Modelos",
    agencyDirectory: "Directorio de Agencias",
    features: "Características",
    cryptoPayments: "Pagos Crypto",
    blog: "Blog",
    legal: "Legal",
    terms: "Términos de Servicio",
    privacy: "Política de Privacidad",
    tagline: "La mejor alternativa a OnlyFans con 5% de comisión y pagos crypto.",
    creatorTagline: "Contenido premium exclusivo para coleccionistas exigentes.",
    product: "Producto",
    gallery: "Galería",
    membership: "Membresía",
    support: "Soporte",
    faq: "Preguntas Frecuentes",
    contact: "Contacto",
    social: "Redes Sociales",
    allRightsReserved: "Todos los derechos reservados.",
  },
  fr: {
    discover: "Découvrir",
    browseCreators: "Parcourir les Créateurs",
    topCreators: "Top Créateurs",
    buyCredits: "Acheter des Crédits",
    forCreators: "Pour les Créateurs",
    becomeCreator: "Devenir Créateur",
    onlyfansAlternative: "Alternative à OnlyFans",
    forAgencies: "Pour les Agences",
    agencyPlatform: "Plateforme Agences",
    agencyDashboard: "Tableau de Bord Agence",
    agencyAnalytics: "Analyses et Rapports",
    globalReach: "Portée Mondiale",
    connect: "Connecter",
    findAgency: "Trouver une Agence",
    findCreator: "Trouver un Créateur",
    modelListing: "Annonces Modèles",
    agencyDirectory: "Répertoire Agences",
    features: "Fonctionnalités",
    cryptoPayments: "Paiements Crypto",
    blog: "Blog",
    legal: "Légal",
    terms: "Conditions d'Utilisation",
    privacy: "Politique de Confidentialité",
    tagline: "La meilleure alternative à OnlyFans avec 5% de frais et paiements crypto.",
    creatorTagline: "Contenu premium exclusif pour collectionneurs exigeants.",
    product: "Produit",
    gallery: "Galerie",
    membership: "Abonnement",
    support: "Support",
    faq: "FAQ",
    contact: "Contact",
    social: "Réseaux Sociaux",
    allRightsReserved: "Tous droits réservés.",
  },
  pt: {
    discover: "Descobrir",
    browseCreators: "Ver Criadores",
    topCreators: "Top Criadores",
    buyCredits: "Comprar Créditos",
    forCreators: "Para Criadores",
    becomeCreator: "Ser Criador",
    onlyfansAlternative: "Alternativa ao OnlyFans",
    forAgencies: "Para Agências",
    agencyPlatform: "Plataforma de Agências",
    agencyDashboard: "Painel da Agência",
    agencyAnalytics: "Análises e Relatórios",
    globalReach: "Alcance Global",
    connect: "Conectar",
    findAgency: "Encontrar Agência",
    findCreator: "Encontrar Criador",
    modelListing: "Lista de Modelos",
    agencyDirectory: "Diretório de Agências",
    features: "Recursos",
    cryptoPayments: "Pagamentos Crypto",
    blog: "Blog",
    legal: "Legal",
    terms: "Termos de Serviço",
    privacy: "Política de Privacidade",
    tagline: "A melhor alternativa ao OnlyFans com 5% de taxa e pagamentos crypto.",
    creatorTagline: "Conteúdo premium exclusivo para colecionadores exigentes.",
    product: "Produto",
    gallery: "Galeria",
    membership: "Assinatura",
    support: "Suporte",
    faq: "Perguntas Frequentes",
    contact: "Contato",
    social: "Redes Sociais",
    allRightsReserved: "Todos os direitos reservados.",
  },
  de: {
    discover: "Entdecken",
    browseCreators: "Creators durchsuchen",
    topCreators: "Top Creators",
    buyCredits: "Credits kaufen",
    forCreators: "Für Creators",
    becomeCreator: "Creator werden",
    onlyfansAlternative: "OnlyFans Alternative",
    forAgencies: "Für Agenturen",
    agencyPlatform: "Agentur-Plattform",
    agencyDashboard: "Agentur-Dashboard",
    agencyAnalytics: "Analysen & Berichte",
    globalReach: "Globale Reichweite",
    connect: "Verbinden",
    findAgency: "Agentur finden",
    findCreator: "Creator finden",
    modelListing: "Model-Verzeichnis",
    agencyDirectory: "Agentur-Verzeichnis",
    features: "Funktionen",
    cryptoPayments: "Krypto-Zahlungen",
    blog: "Blog",
    legal: "Rechtliches",
    terms: "Nutzungsbedingungen",
    privacy: "Datenschutz",
    tagline: "Die beste OnlyFans-Alternative mit 5% Gebühren und Krypto-Zahlungen.",
    creatorTagline: "Exklusiver Premium-Content für anspruchsvolle Sammler.",
    product: "Produkt",
    gallery: "Galerie",
    membership: "Mitgliedschaft",
    support: "Unterstützung",
    faq: "FAQ",
    contact: "Kontakt",
    social: "Soziale Medien",
    allRightsReserved: "Alle Rechte vorbehalten.",
  },
  it: {
    discover: "Scopri",
    browseCreators: "Sfoglia Creators",
    topCreators: "Top Creators",
    buyCredits: "Acquista Crediti",
    forCreators: "Per i Creators",
    becomeCreator: "Diventa Creator",
    onlyfansAlternative: "Alternativa a OnlyFans",
    forAgencies: "Per le Agenzie",
    agencyPlatform: "Piattaforma Agenzie",
    agencyDashboard: "Dashboard Agenzia",
    agencyAnalytics: "Analisi e Report",
    globalReach: "Portata Globale",
    connect: "Connetti",
    findAgency: "Trova un'Agenzia",
    findCreator: "Trova un Creator",
    modelListing: "Elenco Modelli",
    agencyDirectory: "Directory Agenzie",
    features: "Funzionalità",
    cryptoPayments: "Pagamenti Crypto",
    blog: "Blog",
    legal: "Legale",
    terms: "Termini di Servizio",
    privacy: "Privacy Policy",
    tagline: "La migliore alternativa a OnlyFans con 5% di commissioni e pagamenti crypto.",
    creatorTagline: "Contenuti premium esclusivi per collezionisti esigenti.",
    product: "Prodotto",
    gallery: "Galleria",
    membership: "Abbonamento",
    support: "Supporto",
    faq: "FAQ",
    contact: "Contatto",
    social: "Social",
    allRightsReserved: "Tutti i diritti riservati.",
  },
  zh: {
    discover: "发现",
    browseCreators: "浏览创作者",
    topCreators: "顶级创作者",
    buyCredits: "购买积分",
    forCreators: "创作者专区",
    becomeCreator: "成为创作者",
    onlyfansAlternative: "OnlyFans替代平台",
    forAgencies: "经纪公司专区",
    agencyPlatform: "经纪平台",
    agencyDashboard: "经纪仪表板",
    agencyAnalytics: "分析与报告",
    globalReach: "全球覆盖",
    connect: "连接",
    findAgency: "寻找经纪公司",
    findCreator: "寻找创作者",
    modelListing: "模特列表",
    agencyDirectory: "经纪目录",
    features: "功能",
    cryptoPayments: "加密货币支付",
    blog: "博客",
    legal: "法律",
    terms: "服务条款",
    privacy: "隐私政策",
    tagline: "最佳OnlyFans替代平台，仅5%手续费，支持加密货币支付。",
    creatorTagline: "为鉴赏家提供独家高级内容。",
    product: "产品",
    gallery: "画廊",
    membership: "会员",
    support: "支持",
    faq: "常见问题",
    contact: "联系我们",
    social: "社交媒体",
    allRightsReserved: "版权所有。",
  },
  ja: {
    discover: "探索",
    browseCreators: "クリエイターを見る",
    topCreators: "トップクリエイター",
    buyCredits: "クレジット購入",
    forCreators: "クリエイター向け",
    becomeCreator: "クリエイターになる",
    onlyfansAlternative: "OnlyFans代替",
    forAgencies: "エージェンシー向け",
    agencyPlatform: "エージェンシープラットフォーム",
    agencyDashboard: "エージェンシーダッシュボード",
    agencyAnalytics: "分析＆レポート",
    globalReach: "グローバルリーチ",
    connect: "接続",
    findAgency: "エージェンシーを探す",
    findCreator: "クリエイターを探す",
    modelListing: "モデル一覧",
    agencyDirectory: "エージェンシー一覧",
    features: "機能",
    cryptoPayments: "暗号通貨決済",
    blog: "ブログ",
    legal: "法的情報",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    tagline: "5%の手数料と暗号通貨決済を備えた最高のOnlyFans代替プラットフォーム。",
    creatorTagline: "目利きのコレクター向けプレミアム限定コンテンツ。",
    product: "製品",
    gallery: "ギャラリー",
    membership: "メンバーシップ",
    support: "サポート",
    faq: "よくある質問",
    contact: "お問い合わせ",
    social: "ソーシャル",
    allRightsReserved: "全著作権所有。",
  },
  ko: {
    discover: "발견",
    browseCreators: "크리에이터 둘러보기",
    topCreators: "인기 크리에이터",
    buyCredits: "크레딧 구매",
    forCreators: "크리에이터용",
    becomeCreator: "크리에이터 되기",
    onlyfansAlternative: "OnlyFans 대안",
    forAgencies: "에이전시용",
    agencyPlatform: "에이전시 플랫폼",
    agencyDashboard: "에이전시 대시보드",
    agencyAnalytics: "분석 및 리포트",
    globalReach: "글로벌 도달",
    connect: "연결",
    findAgency: "에이전시 찾기",
    findCreator: "크리에이터 찾기",
    modelListing: "모델 목록",
    agencyDirectory: "에이전시 디렉토리",
    features: "기능",
    cryptoPayments: "암호화폐 결제",
    blog: "블로그",
    legal: "법적 고지",
    terms: "이용약관",
    privacy: "개인정보처리방침",
    tagline: "5% 수수료와 암호화폐 결제가 가능한 최고의 OnlyFans 대안.",
    creatorTagline: "안목 있는 컬렉터를 위한 프리미엄 독점 콘텐츠.",
    product: "제품",
    gallery: "갤러리",
    membership: "멤버십",
    support: "지원",
    faq: "자주 묻는 질문",
    contact: "연락처",
    social: "소셜",
    allRightsReserved: "모든 권리 보유.",
  },
  ar: {
    discover: "اكتشف",
    browseCreators: "تصفح المبدعين",
    topCreators: "أفضل المبدعين",
    buyCredits: "شراء رصيد",
    forCreators: "للمبدعين",
    becomeCreator: "كن مبدعاً",
    onlyfansAlternative: "بديل OnlyFans",
    forAgencies: "للوكالات",
    agencyPlatform: "منصة الوكالات",
    agencyDashboard: "لوحة تحكم الوكالة",
    agencyAnalytics: "التحليلات والتقارير",
    globalReach: "وصول عالمي",
    connect: "تواصل",
    findAgency: "ابحث عن وكالة",
    findCreator: "ابحث عن مبدع",
    modelListing: "قائمة العارضين",
    agencyDirectory: "دليل الوكالات",
    features: "المميزات",
    cryptoPayments: "مدفوعات العملات الرقمية",
    blog: "المدونة",
    legal: "قانوني",
    terms: "شروط الخدمة",
    privacy: "سياسة الخصوصية",
    tagline: "أفضل بديل لـ OnlyFans برسوم 5% ومدفوعات بالعملات الرقمية.",
    creatorTagline: "محتوى حصري متميز للجامعين المميزين.",
    product: "المنتج",
    gallery: "المعرض",
    membership: "العضوية",
    support: "الدعم",
    faq: "الأسئلة الشائعة",
    contact: "اتصل بنا",
    social: "التواصل الاجتماعي",
    allRightsReserved: "جميع الحقوق محفوظة.",
  },
  ru: {
    discover: "Обзор",
    browseCreators: "Смотреть Создателей",
    topCreators: "Топ Создателей",
    buyCredits: "Купить Кредиты",
    forCreators: "Для Создателей",
    becomeCreator: "Стать Создателем",
    onlyfansAlternative: "Альтернатива OnlyFans",
    forAgencies: "Для Агентств",
    agencyPlatform: "Платформа Агентств",
    agencyDashboard: "Панель Агентства",
    agencyAnalytics: "Аналитика и Отчёты",
    globalReach: "Глобальный Охват",
    connect: "Связаться",
    findAgency: "Найти Агентство",
    findCreator: "Найти Создателя",
    modelListing: "Список Моделей",
    agencyDirectory: "Каталог Агентств",
    features: "Возможности",
    cryptoPayments: "Крипто-платежи",
    blog: "Блог",
    legal: "Юридическая информация",
    terms: "Условия использования",
    privacy: "Политика конфиденциальности",
    tagline: "Лучшая альтернатива OnlyFans с комиссией 5% и крипто-платежами.",
    creatorTagline: "Премиум эксклюзивный контент для взыскательных коллекционеров.",
    product: "Продукт",
    gallery: "Галерея",
    membership: "Подписка",
    support: "Поддержка",
    faq: "Часто задаваемые вопросы",
    contact: "Контакты",
    social: "Соцсети",
    allRightsReserved: "Все права защищены.",
  },
  hi: {
    discover: "खोजें",
    browseCreators: "क्रिएटर्स देखें",
    topCreators: "शीर्ष क्रिएटर्स",
    buyCredits: "क्रेडिट खरीदें",
    forCreators: "क्रिएटर्स के लिए",
    becomeCreator: "क्रिएटर बनें",
    onlyfansAlternative: "OnlyFans विकल्प",
    forAgencies: "एजेंसियों के लिए",
    agencyPlatform: "एजेंसी प्लेटफ़ॉर्म",
    agencyDashboard: "एजेंसी डैशबोर्ड",
    agencyAnalytics: "एनालिटिक्स और रिपोर्ट्स",
    globalReach: "वैश्विक पहुंच",
    connect: "जुड़ें",
    findAgency: "एजेंसी खोजें",
    findCreator: "क्रिएटर खोजें",
    modelListing: "मॉडल लिस्टिंग",
    agencyDirectory: "एजेंसी डायरेक्टरी",
    features: "विशेषताएं",
    cryptoPayments: "क्रिप्टो भुगतान",
    blog: "ब्लॉग",
    legal: "कानूनी",
    terms: "सेवा की शर्तें",
    privacy: "गोपनीयता नीति",
    tagline: "5% शुल्क और क्रिप्टो भुगतान के साथ सबसे अच्छा OnlyFans विकल्प।",
    creatorTagline: "समझदार संग्राहकों के लिए प्रीमियम विशेष सामग्री।",
    product: "उत्पाद",
    gallery: "गैलरी",
    membership: "सदस्यता",
    support: "सहायता",
    faq: "अक्सर पूछे जाने वाले प्रश्न",
    contact: "संपर्क करें",
    social: "सोशल मीडिया",
    allRightsReserved: "सर्वाधिकार सुरक्षित।",
  },
};

export function Footer({ creatorSlug = "miacosta", creatorName, showPlatformLinks = true }: FooterProps) {
  const locale = useLocale() as keyof typeof translations;
  const t = translations[locale] || translations.en;

  const creator = getCreator(creatorSlug);
  const displayName = creatorName || creator?.displayName || "VipOnly";
  const basePath = creatorSlug ? `/${creatorSlug}` : "";

  // Platform-wide links for SEO (with locale prefix)
  const platformLinks = {
    discover: [
      { href: `/${locale}/creators`, label: t.browseCreators },
      { href: `/${locale}/top-creators`, label: t.topCreators },
      { href: `/${locale}/credits`, label: t.buyCredits },
    ],
    forCreators: [
      { href: `/${locale}/dashboard/become-creator`, label: t.becomeCreator },
      { href: `/${locale}/onlyfans-alternative`, label: t.onlyfansAlternative },
    ],
    forAgencies: [
      { href: `/${locale}/for-agencies`, label: t.agencyPlatform },
      { href: `/${locale}/dashboard/agency`, label: t.agencyDashboard },
      { href: `/${locale}/dashboard/agency`, label: t.agencyAnalytics },
    ],
    connect: [
      { href: `/${locale}/dashboard/find-agency`, label: t.findAgency },
      { href: `/${locale}/dashboard/find-creator`, label: t.findCreator },
    ],
    features: [
      { href: `/${locale}/crypto`, label: t.cryptoPayments },
      { href: `/${locale}/blog`, label: t.blog },
    ],
    legal: [
      { href: `/${locale}/terms`, label: t.terms },
      { href: `/${locale}/privacy`, label: t.privacy },
    ],
  };

  const footerLinks = {
    product: creatorSlug ? [
      { href: `${basePath}/gallery`, label: t.gallery },
      { href: `${basePath}/membership`, label: t.membership },
    ] : [],
    support: [
      ...(creatorSlug ? [
        { href: `${basePath}/faq`, label: t.faq },
        { href: `${basePath}/contact`, label: t.contact },
      ] : []),
      { href: `/${locale}/terms`, label: t.terms },
      { href: `/${locale}/privacy`, label: t.privacy },
    ],
    social: creator?.socialLinks
      ? Object.entries(creator.socialLinks)
          .filter(([_, url]) => url && url.trim() !== "")
          .map(([key, url]) => ({
            href: url.startsWith("http") ? url : `https://${key}.com/${url.replace("@", "")}`,
            label: key.charAt(0).toUpperCase() + key.slice(1),
          }))
      : [],
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showPlatformLinks ? (
          // Platform-wide footer with SEO links
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-[var(--gold)]" />
                <span className="text-xl font-semibold gradient-gold-text">
                  VipOnly
                </span>
              </Link>
              <p className="text-sm text-[var(--muted)]">
                {t.tagline}
              </p>
            </div>

            {/* Discover */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.discover}
              </h4>
              <ul className="space-y-2">
                {platformLinks.discover.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Creators */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.forCreators}
              </h4>
              <ul className="space-y-2">
                {platformLinks.forCreators.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For Agencies */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.forAgencies}
              </h4>
              <ul className="space-y-2">
                {platformLinks.forAgencies.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.connect}
              </h4>
              <ul className="space-y-2">
                {platformLinks.connect.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.features}
              </h4>
              <ul className="space-y-2">
                {platformLinks.features.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.legal}
              </h4>
              <ul className="space-y-2">
                {platformLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          // Creator-specific footer
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href={basePath || `/${locale}`} className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-[var(--gold)]" />
                <span className="text-xl font-semibold gradient-gold-text">
                  {displayName}
                </span>
              </Link>
              <p className="text-sm text-[var(--muted)]">
                {t.creatorTagline}
              </p>
            </div>

            {/* Links */}
            {footerLinks.product.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  {t.product}
                </h4>
                <ul className="space-y-2">
                  {footerLinks.product.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                {t.support}
              </h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {footerLinks.social.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  {t.social}
                </h4>
                <ul className="space-y-2">
                  {footerLinks.social.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-center text-sm text-[var(--muted)]">
            &copy; {new Date().getFullYear()} VipOnly. {t.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
