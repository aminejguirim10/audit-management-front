import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, catchError, map, of } from 'rxjs';
import { ChatAuditSummary } from '../../../../models/audit-chat.model';
import { MessageResponse } from '../../../../models/message.model';
import { AuditChatService } from '../../../../services/audit-chat.service';
import { AuthService } from '../../../../services/auth.service';
import { MessageService } from '../../../../services/message.service';
import { NotificationService } from '../../../../services/notification.service';
import { RealtimeMessagingService } from '../../../../services/realtime-messaging.service';

@Component({
  selector: 'app-audit-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-chat-page.html',
  styleUrl: './audit-chat-page.css',
})
export class AuditChatPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly auditChatService = inject(AuditChatService);
  private readonly messageService = inject(MessageService);
  private readonly notificationService = inject(NotificationService);
  private readonly realtimeMessagingService = inject(RealtimeMessagingService);

  private readonly subscriptions = new Subscription();
  @ViewChild('messageScroller') private messageScroller?: ElementRef<HTMLDivElement>;

  auditId = 0;
  rolePrefix: 'auditeur' | 'audite' = 'auditeur';
  currentUserId: number | null = null;

  audit: ChatAuditSummary | null = null;
  messages: MessageResponse[] = [];

  draftMessage = '';
  loading = true;
  sending = false;
  error = '';

  ngOnInit(): void {
    const auditIdParam = Number(this.route.snapshot.paramMap.get('auditId'));
    if (!Number.isFinite(auditIdParam) || auditIdParam <= 0) {
      this.error = 'Identifiant d audit invalide.';
      this.loading = false;
      return;
    }

    this.auditId = auditIdParam;
    this.rolePrefix = this.authService.getCurrentUserRole() === 'AUDITE' ? 'audite' : 'auditeur';

    this.bindNotificationContext();
    this.bindRealtimeStreams();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    if (this.auditId > 0) {
      this.notificationService.clearActiveAuditContext(this.auditId).subscribe({
        error: () => {
          // Pas bloquant lors de la sortie de page.
        },
      });
    }
    this.subscriptions.unsubscribe();
    this.realtimeMessagingService.clearActiveAudit();
  }

  get pageTitle(): string {
    return this.audit ? `Conversation - ${this.audit.title}` : 'Conversation audit';
  }

  get subtitle(): string {
    if (!this.audit) {
      return 'Suivez les echanges entre auditeur et audite en direct.';
    }

    const auditeName = this.audit.auditeName?.trim();
    const auditeurName = this.audit.auditeurName?.trim();

    if (auditeName && auditeurName) {
      return `${auditeName} et ${auditeurName} - Audit #${this.audit.id}`;
    }

    if (auditeName || auditeurName) {
      return `${auditeName ?? auditeurName} - Audit #${this.audit.id}`;
    }

    return `Audit #${this.audit.id} - Conversation en direct`;
  }

  get counterpartName(): string {
    if (!this.audit) {
      return 'Participant';
    }

    return this.rolePrefix === 'audite'
      ? (this.audit.auditeurName ?? 'Auditeur')
      : (this.audit.auditeName ?? 'Audite');
  }

  get counterpartInitials(): string {
    const raw = this.counterpartName.trim();
    if (!raw) {
      return 'U';
    }

    const tokens = raw
      .split(' ')
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return raw.slice(0, 1).toUpperCase();
    }

    if (tokens.length === 1) {
      return tokens[0].slice(0, 1).toUpperCase();
    }

    return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase();
  }

  sendMessage(): void {
    const content = this.draftMessage.trim();
    if (!content || this.sending) {
      return;
    }

    this.sending = true;
    this.error = '';

    this.subscriptions.add(
      this.messageService
        .sendMessage(this.auditId, {
          content,
          receiverId: null,
        })
        .subscribe({
          next: (savedMessage) => {
            this.mergeMessage(savedMessage);
            this.draftMessage = '';
            this.sending = false;
            this.scrollToBottom();
          },
          error: () => {
            this.error = 'Impossible d envoyer le message pour le moment.';
            this.sending = false;
          },
        }),
    );
  }

  goBack(): void {
    const fallbackRoute =
      this.rolePrefix === 'audite' ? '/audite/tableau-de-bord' : '/auditeur/tableau-de-bord';
    void this.router.navigateByUrl(fallbackRoute);
  }

  trackByMessageId(_: number, item: MessageResponse): number {
    return item.id;
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.sendMessage();
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return '--';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  isOwnMessage(message: MessageResponse): boolean {
    return this.currentUserId !== null && message.senderId === this.currentUserId;
  }

  messageAuthorLabel(message: MessageResponse): string {
    return message.senderName || this.counterpartName;
  }

  private bindRealtimeStreams(): void {
    this.realtimeMessagingService.connect(this.auditId);

    this.subscriptions.add(
      this.realtimeMessagingService.message$.subscribe((incoming) => {
        if (incoming.auditId === this.auditId) {
          this.mergeMessage(incoming);
        }
      }),
    );
  }

  private bindNotificationContext(): void {
    this.subscriptions.add(
      this.notificationService.setActiveAuditContext(this.auditId).subscribe({
        next: () => {
          this.subscriptions.add(
            this.notificationService.markAuditNotificationsAsRead(this.auditId).subscribe({
              error: () => {
                // Le badge sera synchronise par websocket meme en cas d'echec local.
              },
            }),
          );
        },
        error: () => {
          // Non bloquant pour le chat.
        },
      }),
    );
  }

  private loadInitialData(): void {
    this.loading = true;
    this.error = '';
    this.audit = this.createFallbackAudit();

    this.loadMessages();
    this.loadAuditSummary();
  }

  private loadMessages(): void {
    this.subscriptions.add(
      this.messageService.getMessagesByAudit(this.auditId).subscribe({
        next: (messages) => {
          this.messages = [...messages].sort((a, b) => a.id - b.id);
          this.tryHydrateAuditFromMessages();
          this.loading = false;
          this.scrollToBottom();
        },
        error: () => {
          this.error = 'Impossible de charger la conversation de cet audit.';
          this.loading = false;
        },
      }),
    );
  }

  private loadAuditSummary(): void {
    this.subscriptions.add(
      this.auditChatService
        .findMyChatAuditById(this.auditId)
        .pipe(
          catchError(() =>
            this.auditChatService.findMyChatAudits().pipe(
              map((audits) => audits.find((item) => item.id === this.auditId) ?? null),
              catchError(() => of(null)),
            ),
          ),
        )
        .subscribe((audit) => {
          this.audit = audit ?? this.createFallbackAudit();

          this.currentUserId =
            this.rolePrefix === 'audite'
              ? (this.audit.auditeId ?? null)
              : (this.audit.auditeurId ?? null);

          this.tryHydrateAuditFromMessages();
        }),
    );
  }

  private mergeMessage(incoming: MessageResponse): void {
    if (this.messages.some((item) => item.id === incoming.id)) {
      return;
    }

    this.messages = [...this.messages, incoming].sort((a, b) => a.id - b.id);
    this.scrollToBottom();
  }

  private createFallbackAudit(): ChatAuditSummary {
    return {
      id: this.auditId,
      title: `Audit #${this.auditId}`,
      status: 'EN_COURS',
      department: 'INFORMATIQUE',
      dateDebut: '',
      dateFin: '',
      typeAuditName: null,
      auditeId: null,
      auditeName: null,
      auditeurId: null,
      auditeurName: null,
    };
  }

  private tryHydrateAuditFromMessages(): void {
    if (!this.audit || this.currentUserId === null || this.messages.length === 0) {
      return;
    }

    const names = this.extractNamesFromMessages();
    let updated = this.audit;
    let changed = false;

    if (this.rolePrefix === 'audite') {
      if (!updated.auditeName && names.currentUserName) {
        updated = { ...updated, auditeName: names.currentUserName };
        changed = true;
      }
      if (!updated.auditeurName && names.counterpartName) {
        updated = { ...updated, auditeurName: names.counterpartName };
        changed = true;
      }
    } else {
      if (!updated.auditeurName && names.currentUserName) {
        updated = { ...updated, auditeurName: names.currentUserName };
        changed = true;
      }
      if (!updated.auditeName && names.counterpartName) {
        updated = { ...updated, auditeName: names.counterpartName };
        changed = true;
      }
    }

    if (changed) {
      this.audit = updated;
    }
  }

  private extractNamesFromMessages(): {
    currentUserName: string | null;
    counterpartName: string | null;
  } {
    let currentUserName: string | null = null;
    let counterpartName: string | null = null;

    for (const message of this.messages) {
      if (message.senderId === this.currentUserId && message.senderName) {
        currentUserName = currentUserName ?? message.senderName;
      }

      if (message.receiverId === this.currentUserId && message.receiverName) {
        currentUserName = currentUserName ?? message.receiverName;
      }

      if (
        message.senderId !== null &&
        message.senderId !== this.currentUserId &&
        message.senderName
      ) {
        counterpartName = counterpartName ?? message.senderName;
      }

      if (
        message.receiverId !== null &&
        message.receiverId !== this.currentUserId &&
        message.receiverName
      ) {
        counterpartName = counterpartName ?? message.receiverName;
      }

      if (currentUserName && counterpartName) {
        break;
      }
    }

    return {
      currentUserName,
      counterpartName,
    };
  }

  private scrollToBottom(): void {
    queueMicrotask(() => {
      const scroller = this.messageScroller?.nativeElement;
      if (!scroller) {
        return;
      }
      scroller.scrollTop = scroller.scrollHeight;
    });
  }
}
