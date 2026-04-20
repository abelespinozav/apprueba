// Logs activos para diagnosticar por qué notificaciones "enviadas" desde el
// backend no aparecen en el dispositivo. Verlos en chrome://serviceworker-
// internals o DevTools → Application → Service Workers → pushsw (o filtrar
// la consola del sw).
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
