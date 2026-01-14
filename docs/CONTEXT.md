# XDeleter - Contexto para Claude

## Resumen del Proyecto

XDeleter es una web app para eliminar tweets en masa de Twitter/X usando scraping (no la API oficial). El usuario provee sus cookies de autenticación y la app elimina los tweets seleccionados.

**Modelo de negocio:**
- Free: 50 tweets/día
- Pro: $1.99/mes - ilimitado
- Lifetime: $9.99 una vez - ilimitado

---

## Estado Actual

### Completado ✅
- Landing page con hero, features, pricing
- Sistema de autenticación (Supabase Auth)
- Registro/Login con email/password
- Dashboard del usuario
- Página de eliminación de tweets (/app)
- Integración con Twitter GraphQL API (fetch + delete)
- Límites de uso (50/día free, ilimitado paid)
- Integración con Gumroad para pagos
- Webhook seguro con verificación

### Pendiente de Configuración ⏳
- [ ] Obtener SUPABASE_SERVICE_ROLE_KEY
- [ ] Crear productos en Gumroad (Pro $1.99/mes, Lifetime $9.99)
- [ ] Configurar webhook en Gumroad con la URL secreta
- [ ] Obtener seller_id de Gumroad (del test ping)
- [ ] Deploy a producción

---

## Decisiones Técnicas

### ¿Por qué Gumroad y no Stripe?
El usuario está en Argentina. Stripe no opera directamente en Argentina y requiere empresa en USA. Gumroad actúa como "Merchant of Record" y paga a PayPal, lo cual funciona sin empresa.

### ¿Por qué no hay API de checkout?
Gumroad usa un overlay (popup) que se activa con un script JS + links especiales. No requiere crear sesiones de checkout desde el backend como Stripe.

### ¿Por qué el webhook tiene [secret] en la URL?
Gumroad no tiene un sistema de firma robusto como Stripe. Para agregar seguridad, usamos un secreto en la URL que solo Gumroad conoce.

---

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/app/dashboard/page.js` | Dashboard con links de Gumroad |
| `src/app/api/webhook/[secret]/route.js` | Webhook que recibe pings de Gumroad |
| `src/app/api/delete/route.js` | Elimina tweets y trackea uso |
| `src/context/AuthContext.js` | Maneja auth + límites de uso |
| `.env.local` | Variables de entorno (ver SETUP.md) |

---

## Próximos Pasos Sugeridos

1. **Configurar todo lo pendiente** (ver SETUP.md)
2. **Testear flujo completo** en local con ngrok para webhooks
3. **Deploy a Vercel**
4. **Probar compra real** con cuenta de prueba

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Generar secreto para webhook
openssl rand -hex 32

# Ver logs de Supabase
# Dashboard → Logs → API logs
```

---

## Notas Importantes

- Los Query IDs de Twitter pueden cambiar. Si deja de funcionar el fetch/delete, buscar nuevos IDs en: https://github.com/trevorhobenshield/twitter-api-client
- El bearer token de Twitter es público y constante
- Gumroad envía datos como `x-www-form-urlencoded`, NO JSON
- El webhook debe retornar 200, si no Gumroad reintenta hasta 3 veces
