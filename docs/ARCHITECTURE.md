# XDeleter - Arquitectura Técnica

## Stack

- **Frontend**: Next.js 14 (App Router), React, CSS puro
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Pagos**: Gumroad (overlay checkout + webhooks)

---

## Estructura de Archivos

```
src/
├── app/
│   ├── page.js              # Landing page
│   ├── layout.js            # Layout con AuthProvider + Gumroad script
│   ├── globals.css          # Estilos globales
│   ├── login/page.js        # Página de login
│   ├── register/page.js     # Página de registro
│   ├── dashboard/page.js    # Dashboard del usuario
│   ├── app/page.js          # App principal (eliminar tweets)
│   └── api/
│       ├── tweets/route.js  # Fetch tweets de Twitter
│       ├── delete/route.js  # Eliminar tweets + tracking de uso
│       └── webhook/[secret]/route.js  # Webhook de Gumroad
├── components/
│   ├── AuthForm.jsx         # Form para cookies de Twitter
│   └── TweetList.jsx        # Lista de tweets con selección
├── context/
│   └── AuthContext.js       # Context de autenticación
├── lib/
│   └── supabase/
│       ├── client.js        # Cliente Supabase (browser)
│       ├── server.js        # Cliente Supabase (server)
│       └── middleware.js    # Middleware para refresh de sesión
└── middleware.js            # Next.js middleware
```

---

## Flujo de Autenticación

```
Usuario → /register → Supabase Auth → Email confirmación
                                    ↓
                              Trigger: on_auth_user_created
                                    ↓
                              Crea perfil en public.profiles
                                    ↓
Usuario → /login → Supabase Auth → Session cookie
                                 ↓
                           AuthContext carga user + profile
```

---

## Flujo de Pagos (Gumroad)

```
Usuario en /dashboard
        ↓
Click "Subscribe" o "Get Lifetime"
        ↓
Link con clase "gumroad-button" + data-gumroad-overlay-checkout
        ↓
Script de Gumroad intercepta → Abre overlay
        ↓
Usuario paga en overlay de Gumroad
        ↓
Gumroad envía POST a /api/webhook/[secret]
        ↓
Webhook verifica:
  1. Secret en URL coincide
  2. seller_id coincide
  3. No es refund/dispute
        ↓
Busca usuario por email en profiles
        ↓
Actualiza subscription_tier y subscription_status
        ↓
Usuario ve plan actualizado en dashboard
```

---

## Flujo de Eliminación de Tweets

```
Usuario en /app
        ↓
Ingresa auth_token y ct0 (cookies de Twitter)
        ↓
POST /api/tweets → Fetch tweets via Twitter GraphQL API
        ↓
Usuario selecciona tweets (max 25, o menos si free tier)
        ↓
POST /api/delete → Elimina tweets uno por uno (500ms delay)
        ↓
Actualiza tweets_deleted_today en profile
        ↓
Free tier: límite 50/día
Pro/Lifetime: ilimitado
```

---

## Base de Datos

### Tabla: profiles

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK, FK a auth.users |
| email | TEXT | Email del usuario |
| subscription_tier | TEXT | 'free', 'pro', 'lifetime' |
| subscription_status | TEXT | 'inactive', 'active', 'canceled', 'past_due' |
| tweets_deleted_today | INT | Contador diario |
| last_deletion_date | DATE | Fecha del último delete |
| gumroad_sale_id | TEXT | ID de venta de Gumroad |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### RLS Policies

- Users can view own profile
- Users can update own profile
- Service role puede hacer todo (para webhooks)

---

## Seguridad

### Webhook de Gumroad
1. **URL con secreto**: `/api/webhook/[secret]` - sin el secret correcto → 401
2. **Verificación seller_id**: previene reenvío de pings de otros vendedores
3. **Manejo de refunds**: si refunded/disputed/chargebacked → downgrade a free

### Twitter Credentials
- Las cookies (auth_token, ct0) nunca se guardan en DB
- Solo se usan en la sesión del browser
- Se envían directo a Twitter via proxy

### Supabase
- RLS habilitado en todas las tablas
- Service role key solo en server-side
- Anon key es pública (solo permite operaciones permitidas por RLS)
