import { EventEmitter2 } from 'eventemitter2';
import { EventHandler, EventType, SystemEvent } from './types';

export class EventBus {
  private readonly emitter: EventEmitter2;

  constructor() {
    this.emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
      verboseMemoryLeak: true,
    });
  }

  emit<T extends SystemEvent>(event: T): boolean {
    return this.emitter.emit(event.type, event);
  }

  async emitAsync<T extends SystemEvent>(event: T): Promise<any[]> {
    return this.emitter.emitAsync(event.type, event);
  }

  on<T extends SystemEvent>(
    eventType: T['type'] | string,
    handler: EventHandler<T>,
  ): this {
    this.emitter.on(eventType, handler as any);
    return this;
  }

  once<T extends SystemEvent>(
    eventType: T['type'] | string,
    handler: EventHandler<T>,
  ): this {
    this.emitter.once(eventType, handler as any);
    return this;
  }

  off(eventType: string, handler: (...args: any[]) => void): this {
    this.emitter.off(eventType, handler);
    return this;
  }

  removeAllListeners(eventType?: string): this {
    this.emitter.removeAllListeners(eventType);
    return this;
  }
}

export const globalEventBus = new EventBus();
