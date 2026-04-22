import { Injectable, OnDestroy, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';
import { MessageResponse, SendMessageRequest } from '../models/message.model';
import { NotificationResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class RealtimeMessagingService implements OnDestroy {
  private readonly authService = inject(AuthService);

  private client: Client | null = null;
  private connected = false;
  private activeAuditId: number | null = null;

  private auditSubscription: StompSubscription | null = null;
  private notificationSubscription: StompSubscription | null = null;
  private unreadCountSubscription: StompSubscription | null = null;

  private readonly messageSubject = new Subject<MessageResponse>();
  private readonly notificationSubject = new Subject<NotificationResponse>();
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);

  readonly message$: Observable<MessageResponse> = this.messageSubject.asObservable();
  readonly notification$: Observable<NotificationResponse> =
    this.notificationSubject.asObservable();
  readonly unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  connect(auditId?: number | null): void {
    this.activeAuditId =
      typeof auditId === 'number' && Number.isFinite(auditId) && auditId > 0 ? auditId : null;

    if (this.client?.active) {
      if (this.connected) {
        if (this.activeAuditId !== null) {
          this.subscribeToAuditTopic(this.activeAuditId);
        } else {
          this.auditSubscription?.unsubscribe();
          this.auditSubscription = null;
        }
      }
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/chat-socket`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 2500,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        this.subscribeToUserQueues();
        if (this.activeAuditId !== null) {
          this.subscribeToAuditTopic(this.activeAuditId);
        }
      },
      onWebSocketClose: () => {
        this.connected = false;
      },
      onStompError: () => {
        this.connected = false;
      },
    });

    this.client.activate();
  }

  isConnected(): boolean {
    return this.connected;
  }

  sendMessageToSocket(auditId: number, payload: SendMessageRequest): void {
    if (!this.client || !this.connected) {
      return;
    }

    this.client.publish({
      destination: `/app/chat/audit/${auditId}`,
      body: JSON.stringify(payload),
    });
  }

  clearActiveAudit(): void {
    this.activeAuditId = null;
    this.auditSubscription?.unsubscribe();
    this.auditSubscription = null;
  }

  disconnect(): void {
    this.clearActiveAudit();
    this.notificationSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();

    this.notificationSubscription = null;
    this.unreadCountSubscription = null;

    this.connected = false;

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private subscribeToUserQueues(): void {
    if (!this.client || !this.connected) {
      return;
    }

    this.notificationSubscription?.unsubscribe();
    this.unreadCountSubscription?.unsubscribe();

    this.notificationSubscription = this.client.subscribe('/user/queue/notifications', (frame: IMessage) => {
      const payload = this.parseFrame<NotificationResponse>(frame);
      if (payload) {
        this.notificationSubject.next(payload);
      }
    });

    this.unreadCountSubscription = this.client.subscribe(
      '/user/queue/notifications/unread-count',
      (frame: IMessage) => {
        const payload = Number(frame.body);
        if (!Number.isNaN(payload)) {
          this.unreadCountSubject.next(payload);
        }
      },
    );
  }

  private subscribeToAuditTopic(auditId: number): void {
    if (!this.client || !this.connected) {
      return;
    }

    this.auditSubscription?.unsubscribe();
    this.auditSubscription = this.client.subscribe(`/topic/chat/audit/${auditId}`, (frame: IMessage) => {
      const payload = this.parseFrame<MessageResponse>(frame);
      if (payload) {
        this.messageSubject.next(payload);
      }
    });
  }

  private parseFrame<T>(frame: IMessage): T | null {
    try {
      return JSON.parse(frame.body) as T;
    } catch {
      return null;
    }
  }
}
