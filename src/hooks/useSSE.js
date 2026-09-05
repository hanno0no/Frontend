import { useEffect, useRef } from 'react';
import { subscribeSse } from './sse.js';

export function useSSE(url, handlers, options = {}) {
  const { enabled = true, EventSourceImpl } = options;
  const handlersRef = useRef(handlers);
  const esRef = useRef(null);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !url || (typeof globalThis.EventSource === 'undefined' && !EventSourceImpl)) {
      esRef.current = null;
      return undefined;
    }

    const forwarded = {};
    for (const name of Object.keys(handlersRef.current || {})) {
      forwarded[name] = (event) => handlersRef.current?.[name]?.(event);
    }

    const sub = subscribeSse(url, forwarded, EventSourceImpl);
    esRef.current = sub.eventSource;

    return () => {
      esRef.current = null;
      sub.close();
    };
  }, [url, enabled, EventSourceImpl]);

  return esRef;
}
