# Configuration Paiement - Sans KYC

## MixPay - Carte + Crypto sans KYC

MixPay permet aux clients de payer par **carte bancaire** (Visa/Mastercard) qui est automatiquement convertie en crypto. Aucun KYC requis pour le merchant ni pour les clients.

### Variables d'environnement requises

```env
# MixPay (obtenir sur https://mixpay.me)
MIXPAY_PAYEE_ID=votre_payee_id

# URL de l'app (pour les callbacks)
NEXT_PUBLIC_APP_URL=https://votredomaine.com
```

### Configuration MixPay Dashboard

1. **Créer un compte** sur https://mixpay.me
2. **Dashboard** > Copier votre **Payee ID** (UUID format)
3. **Settings** > **Callback URL**: `https://votredomaine.com/api/payments/mixpay/webhook`
4. **Settlement**: Choisir la crypto de réception (USDT recommandé)

### Flow du paiement MixPay

```
1. User choisit montant ($5, $10, $25...)
   ↓
2. POST /api/payments/mixpay/create
   → Crée payment pending en DB
   → Appelle MixPay API
   → Retourne paymentUrl
   ↓
3. User redirigé vers MixPay
   → Peut payer par carte OU crypto
   → MixPay gère la conversion
   ↓
4. MixPay envoie webhook
   ↓
5. TRIPLE VÉRIFICATION:
   a) Webhook /api/payments/mixpay/webhook (instantané)
   b) Cron /api/cron/check-crypto-payments (backup)
   c) Status poll /api/payments/mixpay/status (frontend)
   ↓
6. Credits ajoutés au compte user
```

### Avantages MixPay

- Carte bancaire acceptée (Visa, Mastercard)
- 50+ cryptos acceptées
- Aucun KYC merchant
- Aucun KYC client (jusqu'à certaines limites)
- Settlement en USDT/USDC (stable)
- Frais: ~1-3%

---

## NOWPayments - Crypto Only sans KYC

### Variables d'environnement requises

```env
# NOWPayments API (obtenir sur https://nowpayments.io)
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret

# URL de l'app (pour les callbacks)
NEXT_PUBLIC_APP_URL=https://votredomaine.com

# Secret pour le cron job
CRON_SECRET=random_secret_key_here
```

### Configuration NOWPayments Dashboard

1. **Créer un compte** sur https://nowpayments.io
2. **API Settings** > Générer une API Key
3. **IPN Settings** :
   - IPN Secret: Générer et copier dans `.env`
   - IPN Callback URL: `https://votredomaine.com/api/payments/crypto/webhook`
4. **Payout Settings** :
   - Configurer votre wallet pour recevoir les fonds

### Cryptos supportées

| Crypto | ID | Frais réseau |
|--------|-----|-------------|
| USDT TRC20 | usdttrc20 | ~$1 |
| USDT ERC20 | usdterc20 | ~$5-20 |
| USDC Solana | usdcsol | ~$0.01 |
| Bitcoin | btc | ~$2-10 |
| Ethereum | eth | ~$5-30 |
| Litecoin | ltc | ~$0.10 |
| Solana | sol | ~$0.01 |
| Tron | trx | ~$1 |

### Bonus Credits

| Achat | Crédits | Bonus | Total |
|-------|---------|-------|-------|
| $5 | 500 | 50 (10%) | 550 |
| $10 | 1000 | 150 (15%) | 1150 |
| $25 | 2500 | 500 (20%) | 3000 |
| $50 | 5000 | 1250 (25%) | 6250 |
| $100 | 10000 | 3000 (30%) | 13000 |

### Cron Job Configuration

Le cron job vérifie les paiements pending toutes les 30-60 secondes.

#### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/check-crypto-payments",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Cron externe (curl)
```bash
# Toutes les minutes
* * * * * curl -H "x-cron-secret: YOUR_CRON_SECRET" https://votredomaine.com/api/cron/check-crypto-payments
```

### Flow du paiement

```
1. User choisit montant + crypto
   ↓
2. POST /api/payments/crypto/create
   → Crée payment pending en DB
   → Appelle NOWPayments API
   → Retourne adresse + montant crypto
   ↓
3. User envoie crypto à l'adresse
   ↓
4. NOWPayments détecte le paiement
   ↓
5. TRIPLE VÉRIFICATION:
   a) Webhook /api/payments/crypto/webhook (instantané)
   b) Cron /api/cron/check-crypto-payments (backup)
   c) Status poll /api/payments/crypto/status (frontend)
   ↓
6. Credits ajoutés au compte user
```

### Troubleshooting

**Paiement non crédité?**
1. Vérifier les logs du webhook
2. Vérifier que `NOWPAYMENTS_IPN_SECRET` est correct
3. Vérifier que le cron job fonctionne
4. User peut forcer la vérification via l'UI (polling)

**Webhook non reçu?**
- Vérifier que l'URL est accessible publiquement (pas localhost)
- Vérifier les headers CORS
- Vérifier le certificat SSL

**Test en local?**
- Utiliser ngrok: `ngrok http 3000`
- Mettre l'URL ngrok dans NOWPayments IPN settings
