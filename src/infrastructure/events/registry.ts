// src/infrastructure/events/registry.ts

export const EVENT_TYPES = {
  // Client Events
  CLIENT_CREATED: "client.created",
  CLIENT_UPDATED: "client.updated",
  CLIENT_DELETED: "client.deleted",

  // Contract Events
  CONTRACT_CREATED: "contract.created",
  CONTRACT_UPDATED: "contract.updated",
  CONTRACT_DELETED: "contract.deleted",

  // User Events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",

  // Auth Events
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",

  // Role Events
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",

  // Permission Events
  PERMISSION_UPDATED: "permission.updated",

  // Amendment Events
  AMENDMENT_CREATED: "amendment.created",
  AMENDMENT_APPROVED: "amendment.approved",
  AMENDMENT_REJECTED: "amendment.rejected",

  // Notification Events
  NOTIFICATION_CREATED: "notification.created",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_DELETED: "notification.deleted",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
