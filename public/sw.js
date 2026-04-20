// v2026-04-20 — bump para forzar update del SW en dispositivos activos.
// Logs activos para diagnosticar por qué notificaciones "enviadas" desde el
// backend no aparecen en el dispositivo. Verlos en chrome://serviceworker-
// internals o DevTools → Application → Service Workers → pushsw (o filtrar
// la consola del sw).

// install + activate con skipWaiting/claim: cuando deployamos un sw.js
// nuevo, el browser por defecto lo deja en estado "waiting" hasta que todas
// las ventanas abiertas se cierren. skipWaiting lo activa inmediatamente;
// clients.claim fuerza al nuevo SW a tomar control de las páginas ya
// abiertas (sin esperar a un refresh). Resultado: cualquier fix en el SW
// (ej. default de url, nuevos logs) empieza a aplicar en la próxima carga
// de la app, no en la siguiente sesión.
self.addEventListener('install', function(event) {
  console.log('[sw] install — skipWaiting')
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  console.log('[sw] activate — claim clients')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', function(event) {
  console.log('[sw] push event recibido', {
    hasData: !!event.data,
    timestamp: new Date().toISOString()
  })
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
    console.log('[sw] payload parseado:', data)
  } catch (err) {
    // Algunos push services mandan texto plano o arrive malformed
    const raw = event.data ? event.data.text() : ''
    console.warn('[sw] payload no-JSON, raw:', raw, 'error:', err?.message)
    data = { title: 'APPrueba', body: raw || 'Nueva notificación' }
  }
  // Shape canónica del backend (buildPushPayload):
  // { title, body, icon, badge, url } — todos los campos vienen siempre,
  // pero mantenemos los defaults por defensa (SWs viejos del usuario o
  // payloads de fuentes externas).
  const title = data.title || 'APPrueba'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'https://apprueba.com' },
    actions: [
      { action: 'open', title: '📚 Ver app' },
      { action: 'close', title: 'Cerrar' }
    ]
  }
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[sw] showNotification ok:', title))
      .catch(err => console.error('[sw] showNotification falló:', err))
  )
})

self.addEventListener('notificationclick', function(event) {
  console.log('[sw] notificationclick', { action: event.action, url: event.notification?.data?.url })
  event.notification.close()
  if (event.action === 'close') return
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'))
})

// Cuando el browser rota la suscripción (key rotation, expiración), el
// endpoint viejo queda inválido y el sw recibe este evento. Loguea para
// diagnosticar; re-subscripción automática requiere fetch del VAPID key
// que normalmente no está cacheado aquí — lo hace el frontend al volver.
self.addEventListener('pushsubscriptionchange', function(event) {
  console.warn('[sw] pushsubscriptionchange — la suscripción previa expiró/cambió', {
    oldEndpoint: event.oldSubscription?.endpoint?.slice(-40),
    newEndpoint: event.newSubscription?.endpoint?.slice(-40)
  })
})
