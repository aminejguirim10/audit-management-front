import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { ApiResponse } from '../models/api-response.model';
import { NotificationResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/notifications`;
  private readonly defaultNotificationsLimit = 50;
  private notificationsCache: NotificationResponse[] | null = null;
  private unreadCountCache: number | null = null;
  private activeAuditContextId: number | null = null;

  getMyNotifications(forceRefresh = false): Observable<NotificationResponse[]> {
    if (!forceRefresh && this.notificationsCache) {
      return of([...this.notificationsCache]);
    }

    return this.http
      .get<
        ApiResponse<NotificationResponse[]>
      >(`${this.url}/me?limit=${this.defaultNotificationsLimit}`)
      .pipe(
        map((response) => response.data ?? []),
        tap((notifications) => {
          this.notificationsCache = [...notifications];
          this.unreadCountCache = notifications.filter((item) => !item.isRead).length;
        }),
      );
  }

  getUnreadCount(forceRefresh = false): Observable<number> {
    if (!forceRefresh && this.unreadCountCache !== null) {
      return of(this.unreadCountCache);
    }

    return this.http.get<ApiResponse<number>>(`${this.url}/me/unread-count`).pipe(
      map((response) => response.data ?? 0),
      tap((count) => {
        this.unreadCountCache = Math.max(0, count);
      }),
    );
  }

  markAsRead(notificationId: number): Observable<NotificationResponse> {
    return this.http
      .patch<ApiResponse<NotificationResponse>>(`${this.url}/${notificationId}/read`, {})
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new Error(
              'Reponse invalide du serveur lors de la mise a jour de la notification',
            );
          }
          return response.data;
        }),
        tap((updated) => {
          if (!this.notificationsCache) {
            return;
          }

          this.notificationsCache = this.notificationsCache.map((item) =>
            item.id === updated.id ? { ...item, isRead: updated.isRead } : item,
          );
          this.unreadCountCache = this.notificationsCache.filter((item) => !item.isRead).length;
        }),
      );
  }

  markAuditNotificationsAsRead(auditId: number): Observable<number> {
    const unreadInCacheForAudit =
      this.notificationsCache?.filter((item) => item.auditId === auditId && !item.isRead).length ??
      0;

    return this.http.patch<ApiResponse<number>>(`${this.url}/me/audits/${auditId}/read`, {}).pipe(
      map((response) => Math.max(0, Number(response.data ?? 0))),
      tap((updatedCount) => {
        if (this.notificationsCache) {
          this.notificationsCache = this.notificationsCache.map((item) =>
            item.auditId === auditId ? { ...item, isRead: true } : item,
          );
        }

        if (this.unreadCountCache !== null) {
          const delta = unreadInCacheForAudit > 0 ? unreadInCacheForAudit : updatedCount;
          this.unreadCountCache = Math.max(0, this.unreadCountCache - delta);
        }
      }),
    );
  }

  setActiveAuditContext(auditId: number): Observable<void> {
    this.activeAuditContextId = auditId;
    return this.http
      .patch<ApiResponse<null>>(`${this.url}/me/active-audit/${auditId}`, {})
      .pipe(map(() => void 0));
  }

  clearActiveAuditContext(auditId: number): Observable<void> {
    if (this.activeAuditContextId === auditId) {
      this.activeAuditContextId = null;
    }

    return this.http
      .delete<ApiResponse<null>>(`${this.url}/me/active-audit/${auditId}`)
      .pipe(map(() => void 0));
  }

  syncRealtimeNotification(notification: NotificationResponse): void {
    if (notification.auditId && this.activeAuditContextId === notification.auditId) {
      const readNotification: NotificationResponse = { ...notification, isRead: true };

      if (!this.notificationsCache) {
        this.notificationsCache = [readNotification];
      } else {
        const exists = this.notificationsCache.some((item) => item.id === readNotification.id);
        this.notificationsCache = exists
          ? this.notificationsCache.map((item) =>
              item.id === readNotification.id ? readNotification : item,
            )
          : [readNotification, ...this.notificationsCache];
      }

      this.markAsRead(readNotification.id).subscribe({
        error: () => {
          // Le push unread-count websocket fera autorite si la requete echoue.
        },
      });
      return;
    }

    if (!this.notificationsCache) {
      this.notificationsCache = [notification];
      this.unreadCountCache = notification.isRead ? 0 : 1;
      return;
    }

    const exists = this.notificationsCache.some((item) => item.id === notification.id);
    if (!exists) {
      this.notificationsCache = [notification, ...this.notificationsCache];
      if (!notification.isRead) {
        this.unreadCountCache = (this.unreadCountCache ?? 0) + 1;
      }
      return;
    }

    this.notificationsCache = this.notificationsCache.map((item) =>
      item.id === notification.id ? notification : item,
    );

    this.unreadCountCache = this.notificationsCache.filter((item) => !item.isRead).length;
  }

  syncRealtimeUnreadCount(count: number): void {
    this.unreadCountCache = Math.max(0, count);
  }

  getCachedNotifications(): NotificationResponse[] {
    return this.notificationsCache ? [...this.notificationsCache] : [];
  }

  getCachedUnreadCount(): number {
    if (this.unreadCountCache !== null) {
      return this.unreadCountCache;
    }
    if (!this.notificationsCache) {
      return 0;
    }

    return this.notificationsCache.filter((item) => !item.isRead).length;
  }

  hasCachedNotifications(): boolean {
    return this.notificationsCache !== null;
  }

  clearCache(): void {
    this.notificationsCache = null;
    this.unreadCountCache = null;
    this.activeAuditContextId = null;
  }
}
