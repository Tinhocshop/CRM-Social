// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import {
  DEMO_USER,
  DEMO_USERS,
  DEMO_ZALO_ACCOUNTS,
  DEMO_STATUSES,
  DEMO_TAGS,
  DEMO_CONTACTS,
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES_BY_CONV,
  DEMO_APPOINTMENTS,
  DEMO_CUSTOMER_LISTS,
  DEMO_DEPARTMENTS,
  DEMO_MEDIA_FOLDERS,
  DEMO_MEDIA_ITEMS,
} from './mock-data';

const nowIso = () => new Date().toISOString();

function parseBody(data: unknown): any {
  if (!data) return {};
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return data;
}

export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  const rawUrl = (config.url || '').replace(/^\/api\/v1/, '');
  const [pathOnly, queryStr] = rawUrl.split('?');
  const path = pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
  const body = parseBody(config.data);
  const params = { ...(config.params || {}) };
  if (queryStr) {
    const sp = new URLSearchParams(queryStr);
    sp.forEach((v, k) => { if (!(k in params)) params[k] = v; });
  }

  const ok = (data: any, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  });

  // ── Auth & Public Branding ──
  if (path === '/setup/status') return ok({ needsSetup: false });
  if (path === '/public/org-branding') {
    return ok({
      logoUrl: '/brand/hs-monogram.png',
      name: 'HS Holding',
      slogan: 'Bền vững · Trường tồn',
      copyright: '© 2026 HS Holding · ZaloCRM',
      emailDomain: 'hsholding.vn',
    });
  }
  if (path === '/auth/login' && method === 'post') {
    return ok({
      token: 'zalocrm-demo-jwt-token',
      refreshToken: 'zalocrm-demo-refresh-token',
      user: DEMO_USER,
    });
  }
  if (path === '/auth/refresh' && method === 'post') {
    return ok({
      token: 'zalocrm-demo-jwt-token',
      refreshToken: 'zalocrm-demo-refresh-token',
    });
  }
  if (path === '/auth/logout') return ok({ ok: true });
  if (path === '/profile') return ok(DEMO_USER);
  if (path === '/me/profile' && method === 'patch') {
    if (body.fullName) DEMO_USER.fullName = body.fullName;
    if (body.avatarUrl !== undefined) DEMO_USER.avatarUrl = body.avatarUrl;
    return ok(DEMO_USER);
  }
  if (path === '/me/internal-contact') {
    return ok({
      method: 'crm_nick',
      phone: DEMO_USER.phone,
      zaloAccountId: 'za-1',
      recipient: { status: 'ready', verifiedAt: '2026-05-01T08:00:00.000Z' },
    });
  }

  // ── Privacy ──
  if (path === '/privacy/status') {
    return ok({
      hasPin: true,
      lockedUntil: null,
      activeSessionCount: 1,
      activeSessions: [
        { id: 'ps-1', expiresAt: new Date(Date.now() + 8 * 3600_000).toISOString(), userAgent: 'Chrome / Web', ipAddress: '127.0.0.1', unlockedAt: nowIso() },
      ],
    });
  }
  if (path === '/privacy/otp/status') {
    return ok({
      canRequestOtp: true,
      blockedReason: null,
      lockedUntil: null,
      hasPrivateNick: false,
      internalContact: { phone: '0901234567', nickName: 'Lộc Nguyễn — Giám Đốc Dự Án' },
    });
  }

  // ── Notifications & Global Search ──
  if (path === '/notifications') {
    return ok({
      notifications: [
        { id: 'unreplied', type: 'warning', title: '4 hội thoại khách VIP chưa phản hồi', detail: 'Anh Khánh, Chị Ngọc, Anh Quang đang chờ tư vấn', priority: 'high' },
        { id: 'apt-1', type: 'info', title: 'Lịch hẹn lúc 15:30 hôm nay', detail: 'Đón chị Vũ Thị Bích Ngọc xem nhà mẫu Eaton Park', priority: 'medium' },
        { id: 'zalo-4', type: 'error', title: '1 nick Zalo cần kết nối lại', detail: 'CSKH HS Holding — Hotline Dự Án bị ngắt kết nối', priority: 'high' },
      ],
    });
  }
  if (path === '/search') {
    const q = String(params.q || '').toLowerCase();
    return ok({
      contacts: DEMO_CONTACTS.filter(c => (c.fullName || '').toLowerCase().includes(q) || (c.phone || '').includes(q)),
      messages: Object.values(DEMO_MESSAGES_BY_CONV).flat().filter(m => (m.content || '').toLowerCase().includes(q)).slice(0, 5),
      appointments: DEMO_APPOINTMENTS.filter(a => (a.title || '').toLowerCase().includes(q) || (a.contact?.fullName || '').toLowerCase().includes(q)),
    });
  }

  // ── Dashboard Action Hub (v4) ──
  if (path === '/dashboard/action-hub/me') {
    return ok({
      targetUserId: DEMO_USER.id,
      isViewingSelf: true,
      kpi: {
        unreplied: { public: 3, private: 0 },
        todayAppointments: { public: 2, private: 0 },
        dormantContacts: { public: 1, private: 0 },
        totalContacts: DEMO_CONTACTS.length,
        closedThisMonth: 6,
        followSessions: 4,
      },
      urgent: [
        {
          conversationId: 'conv-1',
          contactId: 'ct-1',
          contactName: 'Đặng Quốc Khánh',
          unreadCount: 2,
          lastMessageAt: DEMO_CONVERSATIONS[0].lastMessageAt,
          nickName: 'Lộc Nguyễn — Giám Đốc Dự Án',
          status: 'Quan tâm sâu',
          messagePreview: 'Em gửi giúp anh mặt bằng tầng 18 căn góc 3PN và lịch thanh toán chiết khấu 8% nhé.',
        },
        {
          conversationId: 'conv-2',
          contactId: 'ct-2',
          contactName: 'Vũ Thị Bích Ngọc',
          unreadCount: 1,
          lastMessageAt: DEMO_CONVERSATIONS[1].lastMessageAt,
          nickName: 'Minh Anh BĐS Vinhomes',
          status: 'Đã hẹn xem sa bàn',
          messagePreview: 'Chiều nay 3h30 chị ghé văn phòng bán hàng Mai Chí Thọ, em đăng ký sảnh đón giúp chị nha.',
        },
        {
          conversationId: 'conv-3',
          contactId: 'ct-3',
          contactName: 'Trịnh Đình Quang',
          unreadCount: 1,
          lastMessageAt: DEMO_CONVERSATIONS[2].lastMessageAt,
          nickName: 'Hoàng Nam — Chuyên Viên Tư Vấn',
          status: 'Đang tư vấn',
          messagePreview: 'Gói vay Vietcombank hiện tại lãi suất sau ưu đãi tính biên độ thế nào bạn ơi?',
        },
      ],
      appointments: DEMO_APPOINTMENTS.map(a => ({
        id: a.id,
        title: a.title,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        location: a.location,
        contactId: a.contactId,
        contactName: a.contact?.fullName,
      })),
      quotaNicks: DEMO_ZALO_ACCOUNTS.map(a => ({
        id: a.id,
        displayName: a.displayName,
        isPrivate: false,
        messagesToday: a.msgToday,
        friendsToday: a.metricsToday?.friendReqSent ?? 10,
      })),
      sessions: { active: 4, replied: 2, paused: 1, closedThisMonth: 6 },
      reminders: {
        overdue: [],
        today: DEMO_APPOINTMENTS.slice(0, 2).map(a => ({
          id: a.id,
          title: a.title,
          appointmentDate: a.appointmentDate,
          appointmentTime: a.appointmentTime,
          location: a.location,
          contactId: a.contactId,
          contactName: a.contact?.fullName,
        })),
        tomorrow: [
          {
            id: DEMO_APPOINTMENTS[2].id,
            title: DEMO_APPOINTMENTS[2].title,
            appointmentDate: DEMO_APPOINTMENTS[2].appointmentDate,
            appointmentTime: DEMO_APPOINTMENTS[2].appointmentTime,
            location: DEMO_APPOINTMENTS[2].location,
            contactId: DEMO_APPOINTMENTS[2].contactId,
            contactName: DEMO_APPOINTMENTS[2].contact?.fullName,
          },
        ],
        birthdays: [{ id: 'ct-4', contactName: 'Lương Mỹ Linh' }],
      },
      scores: { leadAvg: 83, engagementAvg: 80, priorityHigh: 4, leadHi: 3, leadMid: 2, engHi: 3, engMid: 2 },
      statusBreakdown: [
        { status: 'Quan tâm sâu', count: 2 },
        { status: 'Đã hẹn xem sa bàn', count: 1 },
        { status: 'Đang tư vấn', count: 1 },
        { status: 'Đã giữ chỗ / Chốt', count: 1 },
      ],
      topTags: [
        { tag: 'Vinhomes Grand Park', count: 41 },
        { tag: 'Tiềm năng cao', count: 34 },
        { tag: 'The Global City', count: 27 },
        { tag: 'Eaton Park Mai Chí Thọ', count: 19 },
        { tag: 'VIP Đầu tư', count: 18 },
      ],
      interactionToday: { sent: 469, replied: 316, replyRate: 84, newFriends: 35, newLeads: 14 },
    });
  }
  if (path === '/dashboard/action-hub/team') {
    return ok({
      scope: { canViewAll: true, deptIds: ['dept-bds-1', 'dept-bds-2', 'dept-bds-3'], userCount: DEMO_USERS.length },
      teamKpi: {
        unreplied: { public: 3, private: 0 },
        todayAppointments: { public: 3, private: 0 },
        totalContacts: 148,
        closedThisWeek: 9,
      },
      topUser: { userId: 'u-sale-1', fullName: 'Trần Minh Anh', closedThisWeek: 4 },
      perUser: DEMO_USERS.map((u, idx) => ({
        userId: u.id,
        fullName: u.fullName,
        email: u.email || '',
        avatarUrl: u.avatarUrl,
        departmentName: u.departmentMember?.department.name ?? 'Khối Kinh Doanh',
        deptRole: u.departmentMember?.deptRole ?? 'member',
        hasPrivateNick: false,
        privateNickCount: 0,
        unreplied: { public: idx === 0 ? 1 : idx === 1 ? 1 : idx === 2 ? 1 : 0, private: 0 },
        todayAppointments: { public: idx < 3 ? 1 : 0, private: 0 },
        totalContacts: 45 - idx * 7,
        closedThisWeek: 4 - idx,
      })),
      followSessions: { active: 18, replied: 9 },
      responsePerf: { sent: 469, replied: 316, replyRate: 84 },
      leadPool: { pending: 12, claimedToday: 19, forgotten: 2 },
    });
  }
  if (path === '/dashboard/action-hub/system') {
    return ok({
      orgKpi: {
        totalNicks: DEMO_ZALO_ACCOUNTS.length,
        nickHealth: { healthy: 3, overlimit: 0, banned: 0, offline: 1, private: 0 },
        newLeadsThisMonth: 284,
        totalContacts: 1240,
        auditCountToday: 68,
        followSessions: 29,
      },
      deptRanking: [
        { departmentId: 'dept-bds-2', departmentName: 'Phòng Kinh Doanh 1 — Đông Sài Gòn', memberCount: 12, newLeadsThisMonth: 164, closedThisMonth: 18 },
        { departmentId: 'dept-bds-3', departmentName: 'Phòng Kinh Doanh 2 — Khu Nam', memberCount: 9, newLeadsThisMonth: 120, closedThisMonth: 14 },
      ],
      funnel: [
        { status: 'Mới tiếp cận', count: 420 },
        { status: 'Đang tư vấn', count: 365 },
        { status: 'Quan tâm sâu', count: 240 },
        { status: 'Đã hẹn xem sa bàn', count: 132 },
        { status: 'Đã giữ chỗ / Chốt', count: 83 },
      ],
      recentAudit: [
        { id: 'au-1', actorName: 'Trần Minh Anh', action: 'contact.status_change', details: { contact: 'Vũ Thị Bích Ngọc', to: 'Đã hẹn xem sa bàn' }, createdAt: nowIso() },
        { id: 'au-2', actorName: 'Nguyễn Tiến Lộc', action: 'zalo.sync_friends', details: { account: 'Lộc Nguyễn — Giám Đốc Dự Án', count: 142 }, createdAt: nowIso() },
        { id: 'au-3', actorName: 'Lê Hoàng Nam', action: 'lead_pool.claim', details: { contact: 'Trịnh Đình Quang' }, createdAt: nowIso() },
      ],
    });
  }
  if (path === '/dashboard/action-hub/picker/users') {
    return ok({
      canViewAll: true,
      users: DEMO_USERS.map((u, i) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        departmentId: u.departmentMember?.departmentId,
        departmentName: u.departmentMember?.department.name,
        isSelf: i === 0,
      })),
    });
  }
  if (path === '/dashboard/action-hub/picker/depts') {
    return ok({
      depts: [
        { id: 'dept-bds-1', name: 'Khối Kinh Doanh BĐS', path: '/dept-bds-1', memberCount: 21 },
        { id: 'dept-bds-2', name: 'Phòng Kinh Doanh 1 — Đông Sài Gòn', path: '/dept-bds-1/dept-bds-2', memberCount: 12 },
        { id: 'dept-bds-3', name: 'Phòng Kinh Doanh 2 — Khu Nam', path: '/dept-bds-1/dept-bds-3', memberCount: 9 },
      ],
    });
  }
  if (path === '/dashboard/kpi') {
    return ok({ messagesToday: 469, messagesUnreplied: 3, messagesUnread: 4, appointmentsToday: 2, newContactsThisWeek: 38, totalContacts: 1240 });
  }
  if (path === '/dashboard/message-volume') {
    return ok({
      data: [
        { date: '2026-06-19', sent: 380, received: 290 },
        { date: '2026-06-20', sent: 420, received: 310 },
        { date: '2026-06-21', sent: 395, received: 280 },
        { date: '2026-06-22', sent: 450, received: 340 },
        { date: '2026-06-23', sent: 485, received: 360 },
        { date: '2026-06-24', sent: 469, received: 316 },
      ],
    });
  }
  if (path === '/dashboard/pipeline') {
    return ok(DEMO_STATUSES.map((s, idx) => ({ status: s.name, _count: { _all: [42, 36, 28, 15, 12, 5][idx] || 10 } })));
  }
  if (path === '/dashboard/sources') {
    return ok([
      { source: 'FB', _count: { _all: 58 } },
      { source: 'GT', _count: { _all: 34 } },
      { source: 'TT', _count: { _all: 27 } },
      { source: 'CN', _count: { _all: 19 } },
    ]);
  }
  if (path === '/dashboard/appointments') {
    return ok([
      { status: 'scheduled', _count: { _all: 14 } },
      { status: 'completed', _count: { _all: 29 } },
      { status: 'overdue', _count: { _all: 2 } },
    ]);
  }

  // ── Inbox Filters & Conversations ──
  if (path === '/account-folders') {
    return ok({
      folders: [
        {
          id: 'af-1',
          name: 'Đội Dự Án Đông Sài Gòn',
          color: '#0EA5E9',
          sortOrder: 1,
          members: DEMO_ZALO_ACCOUNTS.slice(0, 2),
          unreadCount: 3,
          totalCount: 3,
          createdAt: '2026-05-01T08:00:00.000Z',
        },
        {
          id: 'af-2',
          name: 'Đội Chăm Sóc VIP & Kiều Bào',
          color: '#10B981',
          sortOrder: 2,
          members: DEMO_ZALO_ACCOUNTS.slice(2, 4),
          unreadCount: 1,
          totalCount: 2,
          createdAt: '2026-05-02T08:00:00.000Z',
        },
      ],
    });
  }
  if (path === '/filter-presets') {
    return ok({
      presets: [
        { id: 'fp-1', name: 'Khách VIP chưa trả lời', emoji: '🔥', filterJson: { activeTab: 'personal', quickPills: ['unanswered'] }, sortOrder: 1, lastUsedAt: nowIso(), createdAt: nowIso() },
        { id: 'fp-2', name: 'Khách hẹn xem sa bàn hôm nay', emoji: '📅', filterJson: { activeTab: 'personal', appointmentWithin24h: true }, sortOrder: 2, lastUsedAt: nowIso(), createdAt: nowIso() },
      ],
    });
  }
  if (path === '/conversations/counts') {
    return ok({
      personal: 4,
      group: 1,
      main: 5,
      other: 0,
      unread: 3,
      unanswered: 3,
      stuck: 1,
      ready: 2,
    });
  }
  if (path === '/conversations/sidebar-tags') {
    return ok({
      crmTags: DEMO_TAGS.filter(t => t.scope === 'crm').map(t => ({ name: t.name, slug: t.slug, color: t.color, emoji: t.emoji, count: t.usageCount })),
      zaloLabels: [
        { name: 'VIP Đầu tư', color: '#EF4444', count: 18 },
        { name: 'Hẹn xem nhà mẫu', color: '#8B5CF6', count: 9 },
        { name: 'Đã giữ chỗ', color: '#10B981', count: 6 },
      ],
    });
  }
  if (path === '/conversations' && method === 'get') {
    let list = [...DEMO_CONVERSATIONS];
    if (params.threadType === 'user') list = list.filter(c => c.threadType === 'user');
    if (params.threadType === 'group') list = list.filter(c => c.threadType === 'group');
    if (params.accountId) list = list.filter(c => c.zaloAccount?.id === params.accountId);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter(c =>
        (c.contact?.fullName || '').toLowerCase().includes(q) ||
        (c.contact?.phone || '').includes(q) ||
        (c.groupName || '').toLowerCase().includes(q),
      );
    }
    return ok({ conversations: list, total: list.length });
  }
  const convMatch = path.match(/^\/conversations\/([^/]+)$/);
  if (convMatch && method === 'get') {
    const conv = DEMO_CONVERSATIONS.find(c => c.id === convMatch[1]) || DEMO_CONVERSATIONS[0];
    return ok(conv);
  }
  const convMsgMatch = path.match(/^\/conversations\/([^/]+)\/messages$/);
  if (convMsgMatch) {
    const cid = convMsgMatch[1];
    if (method === 'get') {
      return ok({ messages: DEMO_MESSAGES_BY_CONV[cid] || [] });
    }
    if (method === 'post') {
      const newMsg = {
        id: 'm-' + Date.now(),
        content: body.content || body.message || '',
        contentType: body.contentType || 'text',
        senderType: 'self',
        senderName: DEMO_USER.fullName,
        sentAt: nowIso(),
        isDeleted: false,
        zaloMsgId: 'zmsg_' + Date.now(),
        zaloMsgIdNum: String(Date.now()),
        albumKey: null,
        albumIndex: null,
        albumTotal: null,
        deliveredAt: nowIso(),
        seenAt: null,
        repliedByUserId: DEMO_USER.id,
        repliedBy: { id: DEMO_USER.id, fullName: DEMO_USER.fullName, email: DEMO_USER.email },
        sentVia: 'user',
        reactions: [],
      };
      if (!DEMO_MESSAGES_BY_CONV[cid]) DEMO_MESSAGES_BY_CONV[cid] = [];
      DEMO_MESSAGES_BY_CONV[cid].push(newMsg);
      const conv = DEMO_CONVERSATIONS.find(c => c.id === cid);
      if (conv) {
        conv.lastMessageAt = newMsg.sentAt;
        conv.unreadCount = 0;
        conv.isReplied = true;
        conv.messages = [{ id: newMsg.id, content: newMsg.content, contentType: newMsg.contentType, senderType: 'self', sentAt: newMsg.sentAt, isDeleted: false }];
      }
      return ok({ message: newMsg, data: newMsg });
    }
  }

  // ── Contacts & Cockpit ──
  if (path === '/contacts/stats') {
    return ok({
      total: DEMO_CONTACTS.length,
      withNick: 5,
      multiClaim: 1,
      revoked: 0,
      noZalo: 0,
      newToday: 2,
      activeRecently: 4,
      upcomingApt: 3,
      highScore: 5,
    });
  }
  if (path === '/contacts/duplicates') return ok({ groups: [], total: 0 });
  if (path === '/contacts/parent-candidates') return ok({ candidates: [] });
  if (path === '/contacts' && method === 'get') {
    let list = [...DEMO_CONTACTS];
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter(c => (c.fullName || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
    }
    if (params.source) list = list.filter(c => c.source === params.source);
    if (params.statusId) list = list.filter(c => c.statusId === params.statusId);
    if (params.assignedUserId) list = list.filter(c => c.assignedUserId === params.assignedUserId);
    return ok({ contacts: list, total: list.length });
  }
  if (path === '/contacts' && method === 'post') {
    const created = {
      ...DEMO_CONTACTS[0],
      id: 'ct-' + Date.now(),
      fullName: body.fullName || 'Khách hàng mới',
      phone: body.phone || '0909000111',
      source: body.source || 'CN',
      notes: body.notes || '',
      leadScore: 60,
      createdAt: nowIso(),
    };
    DEMO_CONTACTS.unshift(created as any);
    return ok(created, 201);
  }
  const contactCockpitMatch = path.match(/^\/contacts\/([^/]+)\/cockpit$/);
  if (contactCockpitMatch) {
    const c = DEMO_CONTACTS.find(x => x.id === contactCockpitMatch[1]) || DEMO_CONTACTS[0];
    return ok({
      contactId: c.id,
      fullName: c.fullName,
      crmName: c.crmName,
      phone: c.phone,
      source: c.source,
      sourceDate: c.sourceDate,
      firstContactDate: c.sourceDate,
      status: c.status,
      statusRef: c.statusRef,
      notes: c.notes,
      tags: c.tags,
      autoTags: ['active', 'ready'],
      assignedUser: c.assignedUser,
      getflyLink: { linked: false, getflyId: null, linkedAt: null },
      priorityScore: c.priorityScore,
      priorityUpdatedAt: nowIso(),
      engagementPattern: c.engagementPattern,
      engagementTrend: c.engagementTrend,
      engagementScore: c.engagementScore,
      engagementUpdatedAt: nowIso(),
      leadScore: c.leadScore,
      lastInboundAt: c.lastInboundAt,
      lastInboundPreview: c.lastInboundPreview,
      lastOutboundAt: c.lastOutboundAt,
      lastOutboundPreview: c.lastOutboundPreview,
      lastInteractionAt: c.lastInteractionAt,
      nextAppointment: c.nextAppointment ? { id: 'apt-1', title: 'Xem sa bàn dự án', at: c.nextAppointment, type: 'meeting', location: 'Sales Gallery Mai Chí Thọ', status: 'scheduled', durationMin: 60 } : null,
      stuckSinceAggregate: null,
      totalInbound: c.totalInbound,
      totalOutbound: c.totalOutbound,
      totalAppointments: c.totalAppointments,
    });
  }
  const contactTeammatesMatch = path.match(/^\/contacts\/([^/]+)\/teammates$/);
  if (contactTeammatesMatch) {
    return ok({
      teammates: [
        {
          friendId: 'fr-tm-1',
          contactId: contactTeammatesMatch[1],
          zaloAccountId: 'za-2',
          zaloUidInNick: 'zuid_kh_101_b',
          relationshipKind: 'friend',
          friendshipStatus: 'accepted',
          aliasInNick: 'Anh Khánh VIP Q2',
          totalInbound: 12,
          totalOutbound: 15,
          lastInboundAt: nowIso(),
          lastOutboundAt: nowIso(),
          lastInteractionAt: nowIso(),
          becameFriendAt: '2026-04-15T08:00:00.000Z',
          firstMessageAt: '2026-04-15T08:10:00.000Z',
          nick: { id: 'za-2', displayName: 'Minh Anh BĐS Vinhomes', avatarUrl: null, zaloUid: 'zuid_ma_02', phone: '0908112233', status: 'connected' },
          owner: { id: 'u-sale-1', fullName: 'Trần Minh Anh', email: 'minhanh@hsholding.vn' },
        },
      ],
    });
  }
  const contactIdMatch = path.match(/^\/contacts\/([^/]+)$/);
  if (contactIdMatch) {
    const c = DEMO_CONTACTS.find(x => x.id === contactIdMatch[1]) || DEMO_CONTACTS[0];
    if (method === 'get') {
      return ok({
        ...c,
        friends: [
          {
            id: 'fr-' + c.id,
            zaloUidInNick: c.zaloUid || 'zuid_1',
            relationshipKind: 'friend',
            friendshipStatus: 'accepted',
            hasConversation: true,
            aliasInNick: c.crmName,
            zaloLabels: [{ id: 'zl-1', name: 'VIP Đầu tư', color: '#EF4444' }],
            zaloDisplayName: c.fullName,
            zaloAvatarUrl: null,
            zaloGlobalId: c.zaloGlobalId,
            zaloUsername: c.zaloUsername,
            becameFriendAt: c.sourceDate,
            lastInboundAt: c.lastInboundAt,
            lastOutboundAt: c.lastOutboundAt,
            lastInboundPreview: c.lastInboundPreview,
            lastInboundType: 'text',
            lastOutboundPreview: c.lastOutboundPreview,
            lastOutboundType: 'text',
            totalInbound: c.totalInbound,
            totalOutbound: c.totalOutbound,
            leadScore: c.leadScore,
            statusRef: c.statusRef,
            crmTagsPerNick: c.tags,
            zaloAccount: DEMO_ZALO_ACCOUNTS[0],
          },
        ],
      });
    }
    if (method === 'put' || method === 'patch') {
      Object.assign(c, body);
      return ok(c);
    }
  }

  // ── Zalo Accounts, Friends & Groups ──
  if (path === '/zalo-accounts/stats') {
    return ok({
      totalNick: DEMO_ZALO_ACCOUNTS.length,
      active: 3,
      idle: 0,
      error: 1,
      msgToday: 469,
      msgSentByBot: 111,
      phoneSearchTotal: 72,
      friendReqSent: 56,
      quota: 1200,
      uptimeTeam: 93.2,
      needReloginIds: ['za-4'],
    });
  }
  if (path === '/zalo-accounts/enriched' || path === '/zalo-accounts') {
    return ok(DEMO_ZALO_ACCOUNTS);
  }
  if (path.match(/^\/zalo-accounts\/[^/]+\/uptime$/)) {
    return ok({
      uptimePct: 98.6,
      buckets: [
        { date: '2026-06-18', msgSent: 62, msgReceived: 48, hasActivity: true },
        { date: '2026-06-19', msgSent: 74, msgReceived: 55, hasActivity: true },
        { date: '2026-06-20', msgSent: 81, msgReceived: 63, hasActivity: true },
        { date: '2026-06-21', msgSent: 59, msgReceived: 42, hasActivity: true },
        { date: '2026-06-22', msgSent: 90, msgReceived: 71, hasActivity: true },
        { date: '2026-06-23', msgSent: 84, msgReceived: 67, hasActivity: true },
        { date: '2026-06-24', msgSent: 78, msgReceived: 58, hasActivity: true },
      ],
    });
  }
  if (path.match(/^\/zalo-accounts\/[^/]+\/friends-db$/)) {
    const friendsList = DEMO_CONTACTS.map((c, idx) => ({
      id: `fr-${idx + 1}`,
      contactId: c.id,
      zaloAccountId: 'za-1',
      zaloUidInNick: c.zaloUid || `zuid_${idx}`,
      friendshipStatus: 'accepted',
      hasConversation: true,
      relationshipKind: 'friend',
      aliasInNick: c.crmName,
      zaloLabels: [{ id: 'zl-1', name: 'VIP Đầu tư', color: '#EF4444' }],
      becameFriendAt: c.sourceDate,
      removedAt: null,
      firstMessageAt: c.sourceDate,
      lastInboundAt: c.lastInboundAt,
      lastOutboundAt: c.lastOutboundAt,
      lastInteractionAt: c.lastInteractionAt,
      totalInbound: c.totalInbound || 20,
      totalOutbound: c.totalOutbound || 25,
      statusId: c.statusId,
      statusRef: c.statusRef,
      leadScore: c.leadScore,
      crmTagsPerNick: c.tags,
      zaloDisplayName: c.fullName,
      zaloAvatarUrl: null,
      zaloGlobalId: c.zaloGlobalId,
      zaloUsername: c.zaloUsername,
      autoTags: ['active', 'ready'],
      contact: c,
      zaloAccount: DEMO_ZALO_ACCOUNTS[0],
    }));
    return ok({
      friends: friendsList,
      counts: { all: friendsList.length, friend: friendsList.length, pending_friend: 1, chatting_stranger: 0, ghost: 0 },
      total: friendsList.length,
    });
  }
  if (path.match(/^\/zalo-accounts\/[^/]+\/friends/)) {
    return ok({ data: DEMO_CONTACTS.map(c => ({ userId: c.zaloUid, displayName: c.fullName, zaloName: c.fullName, phoneNumber: c.phone, avatar: '' })) });
  }
  if (path.match(/^\/zalo-accounts\/[^/]+\/groups$/)) {
    return ok({
      groups: [
        { id: 'grp_bds_01', groupId: 'grp_bds_01', name: 'Giỏ Hàng Độc Quyền Eaton Park & The Global City', totalMember: 146, totalMembers: 146, type: 'group' },
        { id: 'grp_bds_02', groupId: 'grp_bds_02', name: 'Cộng Đồng Nhà Đầu Tư Vinhomes Grand Park Q9', totalMember: 482, totalMembers: 482, type: 'community' },
        { id: 'grp_bds_03', groupId: 'grp_bds_03', name: 'CLB Bất Động Sản Hàng Hiệu Đông Sài Gòn', totalMember: 215, totalMembers: 215, type: 'group' },
      ],
    });
  }
  if (path.match(/^\/zalo-accounts\/[^/]+\/group-scans/)) {
    return ok({
      scan: { id: 'scan-1', state: 'completed', scope: 'all', groupIds: ['grp_bds_01', 'grp_bds_02'], totalGroups: 3, scannedGroups: 3, memberCount: 5 },
      members: DEMO_CONTACTS.map((c, idx) => ({
        id: `gsm-${idx}`,
        memberUid: c.zaloUid || `uid_${idx}`,
        displayName: c.fullName,
        zaloName: c.fullName,
        avatarUrl: '',
        isAdmin: idx === 0,
        isFriend: idx < 4,
        harvestedAt: nowIso(),
      })),
    });
  }

  // ── Appointments ──
  if (path === '/appointments/today' || path === '/appointments/upcoming' || (path === '/appointments' && method === 'get')) {
    return ok({
      appointments: DEMO_APPOINTMENTS,
      total: DEMO_APPOINTMENTS.length,
      counts: { all: DEMO_APPOINTMENTS.length, manual: 2, zalo: 1 },
    });
  }
  if (path === '/appointments' && method === 'post') {
    const created = {
      id: 'apt-' + Date.now(),
      contactId: body.contactId || 'ct-1',
      contact: DEMO_CONTACTS.find(c => c.id === body.contactId) || DEMO_CONTACTS[0],
      appointmentDate: body.appointmentDate || nowIso(),
      appointmentTime: body.appointmentTime || '10:00',
      title: body.title || 'Lịch hẹn tư vấn khách hàng',
      durationMin: body.durationMin || 30,
      location: body.location || 'Văn phòng HS Holding',
      type: body.type || 'meeting',
      status: 'scheduled',
      notes: body.notes || null,
      createdAt: nowIso(),
      source: 'manual' as const,
      externalRef: null,
      zaloMessageId: null,
      emoji: '📅',
      conversationId: 'conv-1',
      statusChangedAt: null,
      statusChangedBy: null,
      assignedUserId: DEMO_USER.id,
      assignedUser: { id: DEMO_USER.id, fullName: DEMO_USER.fullName },
    };
    DEMO_APPOINTMENTS.unshift(created as any);
    return ok(created, 201);
  }
  const aptStatusMatch = path.match(/^\/appointments\/([^/]+)\/status$/);
  if (aptStatusMatch && method === 'patch') {
    const apt = DEMO_APPOINTMENTS.find(a => a.id === aptStatusMatch[1]);
    if (apt) apt.status = body.status || 'completed';
    return ok(apt || { id: aptStatusMatch[1], status: body.status });
  }

  // ── Media Library ──
  if (path === '/media/folders') return ok({ folders: DEMO_MEDIA_FOLDERS });
  if (path === '/media/uploaders') {
    return ok({
      uploaders: [
        { id: 'u-owner-1', name: 'Nguyễn Tiến Lộc', count: 2 },
        { id: 'u-sale-1', name: 'Trần Minh Anh', count: 1 },
      ],
    });
  }
  if (path === '/media/trash') return ok({ items: [], nextCursor: null });
  if (path === '/media/tags') {
    return ok({
      tags: [
        { tag: 'eaton-park', count: 14 },
        { tag: 'the-global-city', count: 11 },
        { tag: 'vinhomes-grand-park', count: 19 },
        { tag: 'mat-bang', count: 8 },
        { tag: 'bang-gia', count: 7 },
      ],
    });
  }
  if (path === '/media/favorites' || path === '/media/suggest') {
    return ok({ items: DEMO_MEDIA_ITEMS, matchedTags: ['eaton-park'], contactTags: ['vip-dau-tu', 'eaton-park'] });
  }
  if (path === '/media/stats') {
    return ok({ totalAssets: DEMO_MEDIA_ITEMS.length, totalUsage: 81, topUsed: DEMO_MEDIA_ITEMS });
  }
  if (path === '/media') {
    let items = [...DEMO_MEDIA_ITEMS];
    if (params.kind && params.kind !== 'all') items = items.filter(i => i.kind === params.kind);
    return ok({ items, total: items.length });
  }

  // ── Marketing Customer Lists ──
  if (path === '/customer-lists' && method === 'get') {
    return ok({
      lists: DEMO_CUSTOMER_LISTS,
      total: DEMO_CUSTOMER_LISTS.length,
      stats: { totalLists: 2, leadAdsLists: 1, pasteLists: 1, totalEntries: 205, totalHasZalo: 172 },
    });
  }
  const clEntriesMatch = path.match(/^\/customer-lists\/([^/]+)\/entries$/);
  if (clEntriesMatch) {
    const entries = DEMO_CONTACTS.map((c, idx) => ({
      id: `cle-${idx + 1}`,
      customerListId: clEntriesMatch[1],
      rowIndex: idx + 1,
      phoneRaw: c.phone || '0901234567',
      nameRaw: c.fullName,
      personalNote: c.notes,
      systemMessages: [],
      phoneE164: '+84' + (c.phone || '0901234567').slice(1),
      phoneLocal: c.phone,
      phoneValid: true,
      invalidReason: null,
      contactId: c.id,
      zaloUid: c.zaloUid,
      zaloGlobalId: c.zaloGlobalId,
      zaloName: c.fullName,
      resolvedByNickId: 'za-1',
      resolvedByNick: { id: 'za-1', displayName: 'Lộc Nguyễn — Giám Đốc Dự Án', phone: '0901234567' },
      multiNickCount: 1,
      hasZalo: true,
      dupInListWithEntryId: null,
      dupWithListId: null,
      dupWithListEntryId: null,
      dupWithListName: null,
      dupWithContactId: c.id,
      status: 'done',
      errorMessage: null,
      enrichedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sequenceAttachCount: 1,
      sequenceActiveCount: 1,
      friendInviteSentCount: 1,
    }));
    return ok({ entries, total: entries.length });
  }
  const clDetailMatch = path.match(/^\/customer-lists\/([^/]+)$/);
  if (clDetailMatch) {
    return ok(DEMO_CUSTOMER_LISTS.find(l => l.id === clDetailMatch[1]) || DEMO_CUSTOMER_LISTS[0]);
  }

  // ── Reports & Analytics ──
  if (path === '/reports/overview') {
    return ok({
      kpis: {
        totalMessages: 12480,
        messagesDeltaPct: 18.4,
        replyRatePct: 86.5,
        avgResponseMin: 3.2,
        newContacts: 284,
        appointmentsBooked: 64,
        closedDeals: 32,
        closeRatePct: 11.3,
      },
      msgSeries: [
        { date: '2026-06-18', sent: 380, received: 290 },
        { date: '2026-06-19', sent: 420, received: 315 },
        { date: '2026-06-20', sent: 460, received: 340 },
        { date: '2026-06-21', sent: 410, received: 305 },
        { date: '2026-06-22', sent: 495, received: 370 },
        { date: '2026-06-23', sent: 530, received: 410 },
        { date: '2026-06-24', sent: 469, received: 316 },
      ],
      funnel: [
        { stage: 'Mới tiếp cận', count: 420, pct: 100 },
        { stage: 'Đang tư vấn', count: 315, pct: 75 },
        { stage: 'Quan tâm sâu', count: 189, pct: 45 },
        { stage: 'Đã hẹn xem sa bàn', count: 96, pct: 22.8 },
        { stage: 'Đã giữ chỗ / Chốt', count: 32, pct: 7.6 },
      ],
      topSales: [
        { userId: 'u-sale-1', name: 'Trần Minh Anh', deptName: 'PKD1 — Đông Sài Gòn', sent: 3420, replyMin: 2.4, closed: 14, score: 94 },
        { userId: 'u-owner-1', name: 'Nguyễn Tiến Lộc', deptName: 'Khối Kinh Doanh BĐS', sent: 2980, replyMin: 2.8, closed: 11, score: 91 },
        { userId: 'u-sale-2', name: 'Lê Hoàng Nam', deptName: 'PKD1 — Đông Sài Gòn', sent: 2410, replyMin: 3.9, closed: 7, score: 82 },
      ],
      riskNicks: [
        { id: 'za-4', name: 'CSKH HS Holding — Hotline Dự Án', ownerName: 'Phạm Phương Thảo', status: 'disconnected', risk: 'disconnect', quotaPct: 12, note: 'Ngắt kết nối thụ động 3 giờ trước' },
        { id: 'za-2', name: 'Minh Anh BĐS Vinhomes', ownerName: 'Trần Minh Anh', status: 'connected', risk: 'ok', quotaPct: 72, note: 'Hoạt động ổn định' },
      ],
    });
  }
  if (path === '/reports/nick-fleet') {
    return ok({
      kpis: {
        total: DEMO_ZALO_ACCOUNTS.length,
        online: 3,
        needRelogin: 1,
        msgByBotToday: 111,
        uptimeTeamAvg: 93.2,
        friendAcceptAvg: 64.5,
        sdkUsedAvgPct: 48.0,
        phoneFoundPct: 87.5,
      },
      alerts: [
        { level: 'danger', text: 'Nick "CSKH HS Holding — Hotline Dự Án" mất kết nối hơn 3 giờ, cần quét QR đăng nhập lại.' },
      ],
      nicks: DEMO_ZALO_ACCOUNTS.map(a => ({
        id: a.id,
        name: a.displayName,
        ownerName: a.owner?.fullName || '—',
        status: a.status,
        uptime7d: a.uptime7d,
        msgUserToday: a.metricsToday?.msgSentByUser ?? 0,
        msgBotToday: a.metricsToday?.msgSentByBot ?? 0,
        friendSent: a.metricsToday?.friendReqSent ?? 0,
        friendAccepted: a.metricsToday?.friendReqAccepted ?? 0,
        sdkPct: Math.round((a.msgToday / a.quota) * 100),
        phoneFound: a.metricsToday?.phoneSearchFoundZalo ?? 0,
        phoneTotal: a.metricsToday?.phoneSearchTotal ?? 0,
      })),
    });
  }
  if (path === '/reports/sales-performance') {
    return ok({
      kpis: { activeSales: 4, totalSales: 4, avgSentPerSale: 2450, avgResponseMin: 3.1, avgCloseRate: 11.8 },
      sales: DEMO_USERS.map((u, idx) => ({
        userId: u.id,
        name: u.fullName,
        deptName: u.departmentMember?.department.name || 'Khối Kinh Doanh BĐS',
        contactsCount: 48 - idx * 6,
        messagesSent: 3420 - idx * 520,
        avgResponseMin: Number((2.4 + idx * 0.6).toFixed(1)),
        appointments: 18 - idx * 3,
        closed: 14 - idx * 3,
        leadPoolClaimed: 22 - idx * 4,
        performanceScore: 94 - idx * 5,
      })),
      departments: [
        { id: 'dept-bds-2', name: 'Phòng Kinh Doanh 1 — Đông Sài Gòn', members: 12, contacts: 180, messagesSent: 6800, avgResponseMin: 2.9, closed: 21 },
        { id: 'dept-bds-3', name: 'Phòng Kinh Doanh 2 — Khu Nam', members: 9, contacts: 135, messagesSent: 4920, avgResponseMin: 3.4, closed: 11 },
      ],
    });
  }
  if (path === '/reports/engagement') {
    return ok({
      kpis: { hotCount: 42, coolingCount: 14, customerInitiatedPct: 64, avgInteractionsPerDay: 8.6 },
      heatmap: DEMO_CONTACTS.map(c => ({ contactId: c.id, name: c.fullName || 'KH', cells: [3, 5, 8, 6, 9, 7, 10] })),
      patternDist: [
        { pattern: 'hot', count: 42 },
        { pattern: 'champion', count: 31 },
        { pattern: 'stable', count: 68 },
        { pattern: 'cooling', count: 14 },
        { pattern: 'cold', count: 9 },
      ],
      cooling: [
        { contactId: 'ct-5', name: 'Phan Thanh Tùng', saleName: 'Phạm Phương Thảo', silentDays: 10, score: 58 },
      ],
      hot: [
        { contactId: 'ct-1', name: 'Đặng Quốc Khánh', saleName: 'Nguyễn Tiến Lộc', signal: 'Hỏi bảng tính chiết khấu 8% & mặt bằng căn góc', score: 88 },
        { contactId: 'ct-2', name: 'Vũ Thị Bích Ngọc', saleName: 'Trần Minh Anh', signal: 'Xác nhận lịch hẹn 15:30 xem nhà mẫu', score: 92 },
      ],
      interactionTypes: { inbound: 4820, outbound: 5640, reaction: 940, voiceCall: 310 },
    });
  }
  if (path === '/reports/audit') {
    return ok({
      kpis: { totalEvents: 482, securityAlerts: 0, cronSuccessPct: 100, activeSessions: 9 },
      systemHealth: {
        cronJobs: [
          { name: 'engagement-heatmap-recompute', schedule: '0 */2 * * *', lastRunAt: nowIso(), ok: true },
          { name: 'appointment-overdue-scanner', schedule: '*/5 * * * *', lastRunAt: nowIso(), ok: true },
          { name: 'duplicate-contact-detector', schedule: '30 2 * * *', lastRunAt: nowIso(), ok: true },
        ],
        queues: [
          { name: 'zalo-outbound', depth: 2, failed: 0 },
          { name: 'lead-enrichment', depth: 0, failed: 0 },
          { name: 'system-notify', depth: 1, failed: 0 },
        ],
      },
      events: [
        { id: 'ev-1', ts: nowIso(), actor: 'Nguyễn Tiến Lộc', action: 'rbac.seed_groups', target: '7 nhóm quyền mặc định', ip: '103.82.24.11' },
        { id: 'ev-2', ts: nowIso(), actor: 'Trần Minh Anh', action: 'contact.update_status', target: 'Vũ Thị Bích Ngọc → Đã hẹn xem sa bàn', ip: '103.82.24.12' },
      ],
    });
  }
  if (path === '/analytics/conversion-funnel') {
    return ok({
      totalContacts: 1240,
      avgConversionDays: 14.2,
      stages: [
        { status: 'Mới tiếp cận', count: 420, rate: 100 },
        { status: 'Đang tư vấn', count: 315, rate: 75 },
        { status: 'Quan tâm sâu', count: 189, rate: 45 },
        { status: 'Đã hẹn xem sa bàn', count: 96, rate: 22.8 },
        { status: 'Đã giữ chỗ / Chốt', count: 32, rate: 7.6 },
      ],
    });
  }
  if (path === '/analytics/team-performance') {
    return ok({
      users: DEMO_USERS.map((u, idx) => ({
        userId: u.id,
        fullName: u.fullName,
        messagesSent: 3420 - idx * 520,
        contactsConverted: 14 - idx * 3,
        appointmentsCompleted: 18 - idx * 3,
        avgResponseTime: 140 + idx * 35,
      })),
    });
  }
  if (path === '/analytics/response-time') {
    return ok({
      overall: 186,
      daily: [
        { date: '2026-06-20', avgSeconds: 195 },
        { date: '2026-06-21', avgSeconds: 182 },
        { date: '2026-06-22', avgSeconds: 174 },
        { date: '2026-06-23', avgSeconds: 168 },
        { date: '2026-06-24', avgSeconds: 162 },
      ],
      byUser: DEMO_USERS.map((u, idx) => ({ userId: u.id, fullName: u.fullName, avgSeconds: 145 + idx * 30 })),
    });
  }

  // ── RBAC, Users, Settings & Tags ──
  if (path === '/departments') return ok({ tree: DEMO_DEPARTMENTS });
  if (path === '/permission-groups') {
    return ok({
      tree: [
        { id: 'pg-owner', name: 'Chủ sở hữu (Owner)', parentId: null, isSystem: true, displayOrder: 1, grants: {}, memberCount: 1, children: [] },
        { id: 'pg-senior-sale', name: 'Trưởng phòng Kinh doanh', parentId: null, isSystem: true, displayOrder: 2, grants: {}, memberCount: 2, children: [] },
        { id: 'pg-sale', name: 'Chuyên viên Tư vấn BĐS', parentId: 'pg-senior-sale', isSystem: true, displayOrder: 3, grants: {}, memberCount: 1, children: [] },
      ],
    });
  }
  if (path === '/permission-groups/meta') {
    return ok({
      resources: ['conversation', 'contact', 'friend', 'media', 'zalo_account', 'engagement_score', 'user', 'permission_group', 'settings'],
      actions: ['access', 'create', 'update', 'delete'],
      resourceActions: {
        conversation: ['access', 'create', 'update', 'delete'],
        contact: ['access', 'create', 'update', 'delete'],
        friend: ['access', 'create', 'update'],
        media: ['access', 'create', 'update', 'delete'],
        zalo_account: ['access', 'create', 'update', 'delete'],
        engagement_score: ['access'],
        user: ['access', 'create', 'update'],
        permission_group: ['access', 'update'],
        settings: ['access', 'update'],
      },
    });
  }
  if (path.startsWith('/rbac/users') || path === '/users') {
    return ok({ users: DEMO_USERS });
  }
  if (path === '/settings/statuses' || path === '/statuses') {
    return ok({ statuses: DEMO_STATUSES });
  }
  if (path === '/tags') {
    const scope = params.scope;
    const filtered = scope ? DEMO_TAGS.filter(t => t.scope === scope) : DEMO_TAGS;
    return ok({
      tags: filtered,
      stats: {
        friend: DEMO_TAGS.filter(t => t.scope === 'friend').length,
        crm: DEMO_TAGS.filter(t => t.scope === 'crm').length,
      },
    });
  }
  if (path === '/crm-tags') {
    return ok({ tags: DEMO_TAGS });
  }
  if (path === '/ai/config') {
    return ok({ provider: 'gemini', model: 'gemini-2.5-flash', maxDaily: 500, enabled: true, hasGeminiKey: true });
  }

  // Fallback for any other endpoint so UI never errors out
  return ok({ ok: true, items: [], data: [], list: [], total: 0 });
};
