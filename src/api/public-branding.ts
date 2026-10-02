// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Nguyễn Tiến Lộc
import axios from 'axios';
import { mockAdapter } from './mock-backend';

export interface OrgBranding {
  logoUrl: string | null;
  name: string;
  slogan: string;
  copyright: string;
  emailDomain: string | null;
}

export async function fetchPublicBranding(): Promise<OrgBranding | null> {
  try {
    const res = await axios.get<OrgBranding>('/api/v1/public/org-branding', {
      timeout: 5000,
      adapter: mockAdapter,
    });
    return res.data;
  } catch {
    return {
      logoUrl: '/brand/hs-monogram.png',
      name: 'HS Holding',
      slogan: 'Bền vững · Trường tồn',
      copyright: '© 2026 HS Holding',
      emailDomain: 'hsholding.vn',
    };
  }
}
