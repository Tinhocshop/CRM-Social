<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<!-- Copyright (C) 2026 Nguyễn Tiến Lộc -->
<template>
  <v-app class="smax-app-root">
    <router-view v-slot="{ Component, route: curRoute }">
      <component
        :is="resolveLayout(curRoute)"
        :key="resolveLayoutKey(curRoute)"
      >
        <component :is="Component" v-if="Component" :key="curRoute.fullPath" />
      </component>
    </router-view>
    <!-- 2026-06-16 — hộp xác nhận HS theme global (thay window.confirm toàn app) -->
    <ConfirmHost />
    <!-- Global toast queue — luôn hiển thị cho toàn app -->
    <ToastContainer />
  </v-app>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import MobileLayout from '@/layouts/MobileLayout.vue';
import ConfirmHost from '@/components/ui/ConfirmHost.vue';
import ToastContainer from '@/components/ui/ToastContainer.vue';
import { useMobile } from '@/composables/use-mobile';
import { useAuthStore } from '@/stores/auth';
import { usePrivacyStore } from '@/stores/privacy';

const { isMobile } = useMobile();
const auth = useAuthStore();
const privacy = usePrivacyStore();

function resolveLayout(r?: RouteLocationNormalizedLoaded) {
  const name = (r?.meta?.layout as string) || 'default';
  if (name === 'auth') return AuthLayout;
  return isMobile.value ? MobileLayout : DefaultLayout;
}

function resolveLayoutKey(r?: RouteLocationNormalizedLoaded) {
  const name = (r?.meta?.layout as string) || 'default';
  return `${name}-${isMobile.value ? 'mobile' : 'desktop'}`;
}

// Anh chốt 2026-05-22: sau F5 refresh, gọi privacyStore.fetchStatus() để rebuild
// isUnlocked + expiresAt từ HttpOnly cookie. Trước fix: cookie vẫn còn ở browser
// nhưng FE state mặc định isUnlocked=false → bubble blur vẫn hiện → click → bắt
// nhập PIN lại dù session vẫn alive.
watch(
  () => auth.user?.id,
  (uid) => { if (uid) privacy.fetchStatus(true).catch(() => {}); },
  { immediate: true },
);
</script>

<style scoped>
.smax-app-root {
  height: 100%;
  width: 100%;
}
</style>
