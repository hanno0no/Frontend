export function eventsUrl(apiBase) {
  return `${String(apiBase).replace(/\/$/, '')}/events`;
}

/** EventSource.OPEN. Polling should skip while this is the readyState. */
export const SSE_OPEN = 1;

export function isSseOpen(eventSource) {
  return eventSource != null && eventSource.readyState === SSE_OPEN;
}

export function subscribeSse(url, handlers, EventSourceImpl) {
  const ES = EventSourceImpl || globalThis.EventSource;
  const eventSource = new ES(url);
  const attached = [];

  for (const [name, fn] of Object.entries(handlers || {})) {
    if (typeof fn !== 'function') continue;
    eventSource.addEventListener(name, fn);
    attached.push([name, fn]);
  }

  return {
    eventSource,
    close() {
      for (const [name, fn] of attached) {
        eventSource.removeEventListener(name, fn);
      }
      eventSource.close();
    },
  };
}
