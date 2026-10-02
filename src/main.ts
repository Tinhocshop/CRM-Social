// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Nguyễn Tiến Lộc
// ZaloCRM is free software under the GNU Affero General Public License v3.0 (see LICENSE).
// Commercial (dual) licensing available: locnt@locnguyendata.com
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router/index';
import { vuetify } from './plugins/vuetify';
import './assets/tokens.css';
import './assets/main.css';
import './assets/rbac-page.css';
import './assets/hs-crm-theme.css'; // HS Holding redesign — load LAST để token/component HS thắng cascade (migration 2026-06-05)
import './assets/report-kit.css'; // Module Báo cáo — design system scoped .rpt-scope (2026-06-17)

// Guard against circular JSON serialization (e.g. ReactiveEffect -> Link -> sub in devtools/iframe wrappers)
if (typeof window !== 'undefined') {
  const nativeStringify = JSON.stringify;
  JSON.stringify = function (value: any, replacer?: any, space?: any) {
    const seen = new WeakSet();
    const safeReplacer = (key: string, val: any) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      if (typeof replacer === 'function') return replacer(key, val);
      return val;
    };
    try {
      return nativeStringify(value, safeReplacer, space);
    } catch {
      return nativeStringify(String(value));
    }
  };
}

const app = createApp(App);

app.config.errorHandler = (err, _instance, info) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn('[Vue Error]:', msg, info);
};

app.use(createPinia());
app.use(router);
app.use(vuetify);
app.mount('#app');
