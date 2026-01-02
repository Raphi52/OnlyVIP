# VipOnly

Plateforme de contenu exclusif pour créateurs (alternative OnlyFans).

## Stack Technique

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (Google OAuth, credentials)
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl (12 langues)
- **Realtime**: Pusher
- **Payments**: Stripe, crypto (MixPay, NowPayments, Guardarian, etc.)
- **Storage**: Local uploads (`/public/uploads/`)
- **Email**: Resend

## Structure du Projet

```
src/
├── app/
│   ├── [locale]/           # Routes avec i18n (en, es, pt, fr, de, it, zh, ja, ko, ar, ru, hi)
│   │   ├── [creator]/      # Pages profil créateur
│   │   ├── dashboard/      # Dashboard (user, creator, agency, admin)
│   │   ├── auth/           # Login, register, forgot-password
│   │   ├── creators/       # Directory des créateurs
│   │   ├── credits/        # Achat de crédits
│   │   └── ...
│   ├── api/                # API routes (non localisées)
│   ├── sitemap.ts          # Sitemap multilingue
│   └── robots.ts
├── components/
│   ├── ui/                 # Composants UI réutilisables (Button, Card, Input, Modal)
│   ├── chat/               # ChatWindow, MessageBubble, PPV
│   ├── dashboard/          # Sidebar, stats, analytics
│   ├── landing/            # Hero, Features, Testimonials
│   ├── layout/             # Navbar, Footer, CreditBalance
│   └── LanguageSwitcher.tsx
├── lib/
│   ├── prisma.ts           # Client Prisma
│   ├── auth.ts             # Config NextAuth
│   ├── stripe.ts           # Stripe SDK
│   ├── pusher.ts           # Pusher realtime
│   ├── credits.ts          # Système de crédits
│   ├── seo.ts              # JSON-LD schemas
│   └── ...                 # Intégrations paiements crypto
├── i18n/
│   ├── config.ts           # Locales config
│   └── request.ts          # next-intl server config
├── messages/               # Fichiers de traduction JSON
│   ├── en.json
│   ├── fr.json
│   └── ... (12 langues)
└── middleware.ts           # Locale detection
```

## Commandes

```bash
npm run dev          # Serveur dev (localhost:3000)
npm run build        # Build production
npm run start        # Serveur production
npm run lint         # ESLint
npm run db:seed      # Seed database
npx prisma studio    # GUI database
npx prisma migrate dev  # Migrations
```

## Base de Données

Schema Prisma dans `prisma/schema.prisma`. Tables principales:

- `User` - Utilisateurs (fans, créateurs, admins)
- `Creator` - Profils créateurs avec slug, bio, pricing
- `Media` - Photos/vidéos uploadées
- `Subscription` - Abonnements fan→créateur
- `Message` / `Conversation` - Chat et PPV
- `Transaction` - Paiements et crédits
- `CreditBalance` - Solde crédits utilisateur

## Système de Crédits

- Les utilisateurs achètent des crédits (€1 = 1 crédit)
- Crédits utilisés pour: abonnements, PPV, tips
- Créateurs reçoivent 95% (5% commission plateforme)
- Premier mois: 0% commission pour nouveaux créateurs

## Rôles Utilisateurs

- `USER` - Fan standard
- `CREATOR` - Créateur de contenu
- `AGENCY` - Gestion multi-créateurs
- `CHATTER` - Modérateur de chat
- `ADMIN` - Administrateur plateforme

## i18n (Internationalisation)

12 langues supportées: EN, ES, PT, FR, DE, IT, ZH, JA, KO, AR, RU, HI

- Routes: `/{locale}/...` (ex: `/en/dashboard`, `/fr/creators`)
- Traductions: `src/messages/{locale}.json`
- Middleware détecte la langue du navigateur
- Language switcher dans la navbar

## Conventions

- Composants: PascalCase (`ChatWindow.tsx`)
- Utilitaires: camelCase (`useCredits.ts`)
- API routes: kebab-case (`/api/user/credit-balance`)
- Toujours utiliser `@/` pour les imports absolus
- Préférer `lucide-react` pour les icônes
- Utiliser `cn()` de `@/lib/utils` pour les classes conditionnelles

## Variables d'Environnement

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
RESEND_API_KEY=
```

## Déploiement

- **Hosting**: VPS avec Docker
- **Workflow**: `git push` → deploy automatique via script on-push
- **IMPORTANT**: Toujours push via SSH (pas HTTPS) pour déclencher le deploy automatique
- Ne PAS utiliser Vercel

### Conteneurs Docker

- `viponly-app` - Application Next.js
- `viponly-nginx` - Reverse proxy
- `viponly-db` - PostgreSQL
- `viponly-ai-cron` - Cron jobs AI
- `viponly-backup` - Backups (dump toutes les heures)

### Commandes de déploiement (sur le VPS)

```bash
# Pull les derniers changements
git pull

# Rebuild et redémarrer l'app
docker compose build app --no-cache && docker compose up -d app

# Ou rebuild tout
docker compose build --no-cache && docker compose up -d

# Voir les logs
docker compose logs -f app

# Redémarrer sans rebuild
docker compose restart app
```

### Accès BDD (sur le VPS)

```bash
# Exécuter une requête SQL
docker exec -i viponly-db psql -U viponly -d viponly -c "SELECT * FROM ..."

# Shell interactif
docker exec -it viponly-db psql -U viponly -d viponly
```

## Points d'Attention

- Les routes API ne sont PAS sous `[locale]/`
- Media uploads dans `/public/uploads/` (configurer volume Docker en prod)
- PPV = Pay-Per-View messages avec contenu payant
- Le sitemap génère des alternates hreflang pour le SEO multilingue
- Toujours tester les builds avant deploy (`npm run build`)
