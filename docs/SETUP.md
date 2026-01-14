# XDeleter - Setup Guide

## Configuración Pendiente

### 1. Supabase

#### Service Role Key
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar el proyecto `gsvwcwlxivsmbzzjiahu`
3. Settings → API → `service_role` key (NO la anon key)
4. Copiar y pegar en `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```

#### Verificar tablas
La tabla `profiles` ya está creada con estos campos:
- `id` (UUID, FK a auth.users)
- `email`
- `subscription_tier` (free/pro/lifetime)
- `subscription_status` (inactive/active/canceled/past_due)
- `tweets_deleted_today` (INT)
- `last_deletion_date` (DATE)
- `gumroad_sale_id` (TEXT)

---

### 2. Gumroad

#### Crear cuenta
1. Ir a [gumroad.com](https://gumroad.com) y crear cuenta
2. Completar el onboarding (conectar PayPal para recibir pagos)

#### Crear productos

**Producto 1: XDeleter Pro (Suscripción mensual)**
- Nombre: XDeleter Pro
- Precio: $1.99
- Tipo: Membership (recurring)
- Recurrence: Monthly

**Producto 2: XDeleter Lifetime (Pago único)**
- Nombre: XDeleter Lifetime
- Precio: $9.99
- Tipo: Product (one-time)

#### Configurar Webhook (Ping)
1. Ir a Settings → Advanced
2. En "Ping endpoint" poner:
   ```
   https://TU_DOMINIO.com/api/webhook/TU_SECRETO
   ```
3. Click "Update settings"
4. Click "Send test ping to URL" para probar y obtener tu `seller_id`

#### Obtener URLs de productos
- Los productos tienen URLs como: `https://tunombre.gumroad.com/l/codigo`
- Copiar esas URLs al `.env.local`

---

### 3. Variables de Entorno (.env.local)

```bash
# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=https://gsvwcwlxivsmbzzjiahu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role (PENDIENTE)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Gumroad Products (PENDIENTE - reemplazar con tus URLs)
NEXT_PUBLIC_GUMROAD_PRO_URL=https://tunombre.gumroad.com/l/xdeleter-pro
NEXT_PUBLIC_GUMROAD_LIFETIME_URL=https://tunombre.gumroad.com/l/xdeleter-lifetime

# Gumroad Security (PENDIENTE)
# Generar con: openssl rand -hex 32
GUMROAD_WEBHOOK_SECRET=tu_secreto_random_largo
# Obtener del test ping de Gumroad
GUMROAD_SELLER_ID=tu_seller_id
```

---

### 4. Deploy

#### Opción A: Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```
- Agregar las variables de entorno en Vercel Dashboard

#### Opción B: Otro hosting
- Asegurar que soporte Next.js 14+
- Configurar las variables de entorno en el panel del hosting

---

## Flujo de Prueba

1. Crear cuenta en la app (`/register`)
2. Ir al dashboard (`/dashboard`)
3. Click en "Subscribe" o "Get Lifetime"
4. Se abre overlay de Gumroad
5. Pagar (usar modo test de Gumroad si está disponible)
6. Gumroad envía webhook
7. Usuario queda como Pro/Lifetime
8. Verificar en dashboard que cambió el plan
