import { AppEventMap } from '../types';

type EventHandler<T> = (payload: T) => void;

class EventService {
  private listeners: Map<keyof AppEventMap, Set<EventHandler<any>>> = new Map();
  private debounceTimers: Map<string, number> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof AppEventMap>(event: K, handler: EventHandler<AppEventMap[K]>) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event immediately
   */
  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`Error in event handler for ${event}:`, e);
        }
      });
    }
  }

  /**
   * Schedule an event emission after a delay (Debounce).
   * Useful for map movements to avoid spamming the logic/API.
   * 
   * @param event The event name
   * @param payload The data
   * @param delayMs Delay in milliseconds (default 300ms)
   */
  debounceEmit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K], delayMs: number = 300) {
    if (this.debounceTimers.has(event)) {
      clearTimeout(this.debounceTimers.get(event));
    }

    const timer = window.setTimeout(() => {
      this.emit(event, payload);
      this.debounceTimers.delete(event);
    }, delayMs);

    this.debounceTimers.set(event, timer);
  }
}

export const eventService = new EventService();