// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Nguyễn Tiến Lộc
import type { Socket } from 'socket.io-client';

export type SocketStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface CreateSocketOpts {
  onStatusChange?: (status: SocketStatus) => void;
  onReconnect?: (downMs: number) => void;
}

class MockSocket {
  public id = 'mock-sock-' + Math.random().toString(36).substring(2, 9);
  public connected = true;
  public active = true;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(opts?: CreateSocketOpts) {
    setTimeout(() => {
      opts?.onStatusChange?.('connected');
      this.trigger('connect');
    }, 50);
  }

  on(event: string, fn: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return this;
  }

  off(event: string, fn?: Function) {
    if (!fn) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(fn);
    }
    return this;
  }

  emit(_event: string, ...args: any[]) {
    // Fire callback if passed as last arg
    const last = args[args.length - 1];
    if (typeof last === 'function') {
      last({ success: true, data: {} });
    }
    return this;
  }

  connect() {
    this.connected = true;
    this.active = true;
    this.trigger('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    this.active = false;
    this.trigger('disconnect', 'client disconnect');
    return this;
  }

  trigger(event: string, ...args: any[]) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(...args);
        } catch (e) {
          console.warn('[MockSocket listener error]:', e);
        }
      });
    }
  }
}

export function createAppSocket(opts?: CreateSocketOpts): Socket {
  const sock = new MockSocket(opts);
  return sock as unknown as Socket;
}
