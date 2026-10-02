// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Nguyễn Tiến Lộc
import { ref } from 'vue';

export function useAttribution(): { enabled: { value: boolean }; text: string; href: string } {
  const enabled = ref(false);
  return {
    enabled,
    text: '',
    href: '',
  };
}
