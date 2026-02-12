// 简单的事件总线实现
import { ref } from 'vue';

export interface EventBusEvents {
  'ad-visibility-changed': boolean;
}

type EventCallback<T> = (data: T) => void;

class EventBus {
  private events: Map<keyof EventBusEvents, Set<EventCallback<any>>> = new Map();

  on<K extends keyof EventBusEvents>(event: K, callback: EventCallback<EventBusEvents[K]>) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off<K extends keyof EventBusEvents>(event: K, callback: EventCallback<EventBusEvents[K]>) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit<K extends keyof EventBusEvents>(event: K, data: EventBusEvents[K]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const eventBus = new EventBus();

// 广告显示状态的全局响应式变量
export const showAdGlobal = ref(true);
