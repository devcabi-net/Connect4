// Browser-compatible EventEmitter implementation

export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(eventName: string, callback: EventCallback): this {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
    return this;
  }

  once(eventName: string, callback: EventCallback): this {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.removeListener(eventName, onceWrapper);
    };
    return this.on(eventName, onceWrapper);
  }

  emit(eventName: string, ...args: any[]): boolean {
    const listeners = this.events.get(eventName);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for '${eventName}':`, error);
      }
    });

    return true;
  }

  removeListener(eventName: string, callback: EventCallback): this {
    const listeners = this.events.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
        if (listeners.length === 0) {
          this.events.delete(eventName);
        }
      }
    }
    return this;
  }

  removeAllListeners(eventName?: string): this {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(eventName: string): number {
    const listeners = this.events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

