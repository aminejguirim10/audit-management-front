import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Chat } from '@ai-sdk/angular';
import { DefaultChatTransport, type FileUIPart, type UIMessage } from 'ai';
import {
  faCircleInfo as faCircleInfoIcon,
  faComments as faCommentsIcon,
  faPenToSquare as faPenToSquareIcon,
  faPlus as faPlusIcon,
  faTrashCan as faTrashCanIcon,
} from '@fortawesome/free-solid-svg-icons';
import { firstValueFrom } from 'rxjs';
import { AI_ASSISTANT_API_URL } from '../../../../config/api.config';
import {
  AiConversationDetails,
  AiConversationSummary,
  PersistAiConversationImageRequest,
} from '../../../../models/ai-conversation.model';
import { AiConversationService } from '../../../../services/ai-conversation.service';
import {
  SupabaseStorageService,
  type UploadedStorageAsset,
} from '../../../../services/supabase-storage.service';
import { AuthService } from '../../../../services/auth.service';

type AssistantRole = 'AUDITE' | 'CONSEILLER';
type AuditCriterion =
  | 'SECURITE'
  | 'ENSEIGNEMENT'
  | 'FINANCIER'
  | 'CONFORMITE_REGLEMENTAIRE'
  | 'RESSOURCES_HUMAINES'
  | 'INFRASTRUCTURE'
  | 'GOUVERNANCE'
  | 'VIE_ETUDIANTE';

interface AuditCriterionOption {
  value: AuditCriterion;
  label: string;
}

interface UploadedChatImage {
  id: string;
  filename: string;
  mediaType: string;
  publicUrl: string;
  path: string;
  bucket: string;
  isDeleting: boolean;
}

@Component({
  selector: 'app-audite-ai-assistant-page',
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './audite-ai-assistant-page.html',
  styleUrl: './audite-ai-assistant-page.css',
})
export class AuditeAiAssistantPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly aiConversationService = inject(AiConversationService);
  private readonly supabaseStorageService = inject(SupabaseStorageService);
  private readonly authService = inject(AuthService);
  private readonly defaultAssistantRole: AssistantRole = 'AUDITE';
  private readonly defaultSchoolContext = 'Enicarthage';
  private readonly markdownCache = new Map<string, string>();
  private markdownParser: ((value: string) => string) | null = null;
  private markdownParserLoader: Promise<void> | null = null;
  private readonly maxImageSizeBytes = 8 * 1024 * 1024;

  readonly maxPromptLength = 1400;
  readonly maxConversationImages = 5;
  readonly faCircleInfo = faCircleInfoIcon;
  readonly faComments = faCommentsIcon;
  readonly faPenToSquare = faPenToSquareIcon;
  readonly faPlus = faPlusIcon;
  readonly faTrashCan = faTrashCanIcon;
  readonly criterionOptions: AuditCriterionOption[] = [
    { value: 'SECURITE', label: 'Securite' },
    { value: 'ENSEIGNEMENT', label: 'Enseignement' },
    { value: 'FINANCIER', label: 'Financier' },
    { value: 'CONFORMITE_REGLEMENTAIRE', label: 'Conformite reglementaire' },
    { value: 'RESSOURCES_HUMAINES', label: 'Ressources humaines' },
    { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { value: 'GOUVERNANCE', label: 'Gouvernance' },
    { value: 'VIE_ETUDIANTE', label: 'Vie etudiante' },
  ];
  uploadedImages: UploadedChatImage[] = [];
  sentImageCount = 0;
  isUploadingImages = false;
  isLoadingConversations = false;
  isLoadingConversationDetails = false;
  isSubmittingConversationTurn = false;
  isUpdatingConversationTitle = false;
  isDeletingConversation = false;
  isEditConversationModalOpen = false;
  isDeleteConversationModalOpen = false;
  editConversationId: number | null = null;
  editConversationTitle = '';
  deleteConversationTarget: AiConversationSummary | null = null;
  conversationErrorMessage = '';
  selectedConversationId: number | null = null;
  selectedConversationTitle = 'Nouveau Chat';
  conversations: AiConversationSummary[] = [];
  uploadFeedbackMessage = '';
  uploadFeedbackType: 'info' | 'error' = 'info';

  readonly chat = new Chat({
    transport: new DefaultChatTransport({
      api: AI_ASSISTANT_API_URL + '/audite-chat',
    }),
    onError: (error) => {
      console.error('Erreur assistant IA:', error);
    },
  });

  readonly assistantForm = this.formBuilder.nonNullable.group({
    auditCriterion: this.formBuilder.nonNullable.control<AuditCriterion>('SECURITE'),
    prompt: this.formBuilder.nonNullable.control('', [Validators.maxLength(this.maxPromptLength)]),
  });

  get promptLength(): number {
    return this.assistantForm.controls.prompt.value.length;
  }

  get imageCountLabel(): string {
    return `${this.totalConversationImageCount()}/${this.maxConversationImages}`;
  }

  ngOnInit(): void {
    void this.initializeConversations();
  }

  hasSelectedConversation(): boolean {
    return this.selectedConversationId !== null;
  }

  canSend(): boolean {
    return (
      this.chat.status === 'ready' &&
      !this.isUploadingImages &&
      !this.isLoadingConversationDetails &&
      !this.isSubmittingConversationTurn &&
      this.assistantForm.valid &&
      this.hasPromptContent()
    );
  }

  canStop(): boolean {
    return this.chat.status === 'submitted' || this.chat.status === 'streaming';
  }

  isConversationActionBusy(): boolean {
    return (
      this.isLoadingConversations ||
      this.isLoadingConversationDetails ||
      this.isUploadingImages ||
      this.isSubmittingConversationTurn ||
      this.isUpdatingConversationTitle ||
      this.isDeletingConversation ||
      this.chat.status !== 'ready'
    );
  }

  editTitleLength(): number {
    return this.editConversationTitle.length;
  }

  selectedCriterion(): AuditCriterionOption {
    const criterion = this.assistantForm.controls.auditCriterion.value;

    return (
      this.criterionOptions.find((option) => option.value === criterion) ?? this.criterionOptions[0]
    );
  }

  selectedCriterionLabel(): string {
    return this.selectedCriterion().label;
  }

  isConversationSelected(conversationId: number): boolean {
    return this.selectedConversationId === conversationId;
  }

  conversationPreview(conversation: AiConversationSummary): string {
    return conversation.lastMessagePreview?.trim() || 'Aucun message pour le moment.';
  }

  conversationTimestampLabel(conversation: AiConversationSummary): string {
    return this.formatTimestamp(
      conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    );
  }

  async createConversation(): Promise<void> {
    if (this.isConversationActionBusy()) {
      return;
    }

    this.conversationErrorMessage = '';
    await this.discardPendingUploadedImagesFromStorage();

    this.startDraftConversation();
  }

  async selectConversation(conversationId: number, cleanupPendingImages = true): Promise<void> {
    if (this.isLoadingConversationDetails || this.isSubmittingConversationTurn) {
      return;
    }

    this.conversationErrorMessage = '';

    if (cleanupPendingImages) {
      await this.discardPendingUploadedImagesFromStorage();
    }

    this.selectedConversationId = conversationId;
    const currentSummary = this.conversations.find((item) => item.id === conversationId);
    this.selectedConversationTitle = currentSummary?.title || 'Conversation IA';

    this.isLoadingConversationDetails = true;

    try {
      const details = await firstValueFrom(this.aiConversationService.getMineById(conversationId));
      this.applyConversationDetails(details);
    } catch (error) {
      console.error('Erreur chargement details conversation IA:', error);
      this.chat.messages = [];
      this.sentImageCount = 0;
      this.conversationErrorMessage =
        'Impossible de charger cette conversation IA. Reessayez dans un instant.';
    } finally {
      this.isLoadingConversationDetails = false;
    }
  }

  onPromptKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    void this.submit();
  }

  async submit(): Promise<void> {
    if (
      this.chat.status !== 'ready' ||
      this.isUploadingImages ||
      this.isSubmittingConversationTurn
    ) {
      return;
    }

    if (this.assistantForm.controls.prompt.invalid) {
      this.assistantForm.controls.prompt.markAsTouched();
      return;
    }

    const { auditCriterion, prompt } = this.assistantForm.getRawValue();
    const cleanedPrompt = prompt.trim();
    const promptControl = this.assistantForm.controls.prompt;

    if (!cleanedPrompt) {
      return;
    }

    let activeConversationId = this.selectedConversationId;

    const pendingImagesSnapshot = [...this.uploadedImages];
    const pendingImageParts = this.getPendingImagePartsForNextMessage(pendingImagesSnapshot);
    this.isSubmittingConversationTurn = true;

    try {
      await this.chat.sendMessage(
        pendingImageParts.length > 0
          ? { text: cleanedPrompt, files: pendingImageParts }
          : { text: cleanedPrompt },
        {
          body: {
            assistantRole: this.defaultAssistantRole,
            schoolContext: this.defaultSchoolContext,
            auditCriterion,
          },
        },
      );

      const assistantContent = this.extractLatestAssistantContent();
      if (!assistantContent) {
        throw new Error('Reponse assistant vide, impossible de persister ce tour.');
      }

      if (activeConversationId === null) {
        const createdConversation = await firstValueFrom(
          this.aiConversationService.createMine(this.buildConversationTitle(cleanedPrompt)),
        );
        activeConversationId = createdConversation.id;
      }

      if (activeConversationId === null) {
        throw new Error('Creation de conversation IA impossible pour ce premier tour.');
      }

      const updatedConversation = await firstValueFrom(
        this.aiConversationService.saveTurn(activeConversationId, {
          userContent: cleanedPrompt,
          assistantContent,
          auditCriterion,
          images: this.toPersistedImagePayload(pendingImagesSnapshot),
        }),
      );

      this.upsertConversationSummary(updatedConversation, true);
      this.sentImageCount = Number.isFinite(updatedConversation.imageCount)
        ? updatedConversation.imageCount
        : this.sentImageCount + pendingImageParts.length;
      this.uploadedImages = [];
      this.uploadFeedbackMessage = '';

      if (promptControl.value === prompt) {
        promptControl.setValue('');
        promptControl.markAsPristine();
        promptControl.markAsUntouched();
      }
    } catch (error) {
      console.error('Erreur lors de l envoi du message IA:', error);
      this.setUploadFeedback(
        'Impossible d envoyer ou de sauvegarder ce tour IA pour le moment. Reessayez dans un instant.',
        'error',
      );
    } finally {
      this.isSubmittingConversationTurn = false;
    }
  }

  openEditConversationModal(conversation: AiConversationSummary, event?: Event): void {
    event?.stopPropagation();

    if (this.isConversationActionBusy()) {
      return;
    }

    this.conversationErrorMessage = '';
    this.editConversationId = conversation.id;
    this.editConversationTitle = conversation.title || '';
    this.isEditConversationModalOpen = true;
  }

  closeEditConversationModal(force = false): void {
    if (this.isUpdatingConversationTitle && !force) {
      return;
    }

    this.isEditConversationModalOpen = false;
    this.editConversationId = null;
    this.editConversationTitle = '';
  }

  onEditConversationTitleInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const rawValue = target?.value ?? '';
    this.editConversationTitle = rawValue.slice(0, 180);
  }

  canConfirmEditConversation(): boolean {
    if (this.isUpdatingConversationTitle || this.editConversationId === null) {
      return false;
    }

    const normalized = this.editConversationTitle.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return false;
    }

    const currentConversation = this.conversations.find(
      (conversation) => conversation.id === this.editConversationId,
    );

    return normalized.length <= 180 && normalized !== (currentConversation?.title || '').trim();
  }

  async confirmEditConversationTitle(): Promise<void> {
    if (!this.canConfirmEditConversation() || this.editConversationId === null) {
      return;
    }

    const conversationId = this.editConversationId;
    const normalizedTitle = this.editConversationTitle.trim().replace(/\s+/g, ' ');
    const currentConversation = this.conversations.find(
      (conversation) => conversation.id === conversationId,
    );
    if (!currentConversation) {
      this.closeEditConversationModal(true);
      return;
    }

    const wasSelected = this.selectedConversationId === conversationId;
    const previousSummary = { ...currentConversation };
    const optimisticSummary: AiConversationSummary = {
      ...currentConversation,
      title: normalizedTitle,
      updatedAt: new Date().toISOString(),
    };

    this.isUpdatingConversationTitle = true;
    this.conversationErrorMessage = '';
    this.upsertConversationSummary(optimisticSummary, wasSelected);
    this.closeEditConversationModal(true);

    try {
      const updatedConversation = await firstValueFrom(
        this.aiConversationService.updateMineTitle(conversationId, normalizedTitle),
      );

      this.upsertConversationSummary(
        updatedConversation,
        this.selectedConversationId === updatedConversation.id,
      );
    } catch (error) {
      this.upsertConversationSummary(previousSummary, wasSelected);
      console.error('Erreur mise a jour titre conversation IA:', error);
      this.conversationErrorMessage =
        'Impossible de modifier le titre de cette conversation IA pour le moment.';
    } finally {
      this.isUpdatingConversationTitle = false;
    }
  }

  openDeleteConversationModal(conversation: AiConversationSummary, event?: Event): void {
    event?.stopPropagation();

    if (this.isConversationActionBusy()) {
      return;
    }

    this.conversationErrorMessage = '';
    this.deleteConversationTarget = conversation;
    this.isDeleteConversationModalOpen = true;
  }

  closeDeleteConversationModal(force = false): void {
    if (this.isDeletingConversation && !force) {
      return;
    }

    this.isDeleteConversationModalOpen = false;
    this.deleteConversationTarget = null;
  }

  async confirmDeleteConversation(): Promise<void> {
    const target = this.deleteConversationTarget;
    if (!target || this.isDeletingConversation) {
      return;
    }

    this.isDeletingConversation = true;
    this.conversationErrorMessage = '';

    const isCurrentConversation = this.selectedConversationId === target.id;

    try {
      await firstValueFrom(this.aiConversationService.deleteMine(target.id));

      if (isCurrentConversation) {
        void this.discardPendingUploadedImagesFromStorage();
      }

      this.conversations = this.conversations.filter(
        (conversation) => conversation.id !== target.id,
      );

      if (isCurrentConversation) {
        this.startDraftConversation();
      }

      this.closeDeleteConversationModal(true);
    } catch (error) {
      console.error('Erreur suppression conversation IA:', error);
      this.conversationErrorMessage =
        'Impossible de supprimer cette conversation IA pour le moment. Reessayez dans un instant.';
    } finally {
      this.isDeletingConversation = false;
    }
  }

  async onImageFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (files.length === 0 || this.isSubmittingConversationTurn) {
      return;
    }

    const auditeId = this.currentAuditeId();
    if (!auditeId) {
      this.setUploadFeedback(
        "Identifiant audite indisponible. Rechargez la page puis reessayez l'upload.",
        'error',
      );
      return;
    }

    const availableSlots = this.remainingImageSlots();
    if (availableSlots <= 0) {
      this.setUploadFeedback(
        `Vous avez atteint la limite de ${this.maxConversationImages} images dans cette conversation.`,
        'error',
      );
      return;
    }

    const onlyImages = files.filter((file) => file.type.startsWith('image/'));
    const invalidTypeCount = files.length - onlyImages.length;

    if (onlyImages.length === 0) {
      this.setUploadFeedback('Selection invalide: choisissez uniquement des images.', 'error');
      return;
    }

    const filesToUpload = onlyImages.slice(0, availableSlots);
    const ignoredCount = Math.max(0, onlyImages.length - filesToUpload.length);
    let uploadedCount = 0;
    let failedCount = 0;

    this.isUploadingImages = true;

    for (const file of filesToUpload) {
      if (file.size > this.maxImageSizeBytes) {
        failedCount += 1;
        continue;
      }

      try {
        const uploadedAsset = await this.supabaseStorageService.uploadAuditChatImage(
          auditeId,
          file,
        );
        this.uploadedImages = [
          ...this.uploadedImages,
          this.createUploadedImageRecord(file, uploadedAsset),
        ];
        uploadedCount += 1;
      } catch (error) {
        console.error('Erreur upload image du chat:', error);
        failedCount += 1;
      }
    }

    this.isUploadingImages = false;

    if (uploadedCount > 0 && failedCount === 0 && ignoredCount === 0 && invalidTypeCount === 0) {
      this.setUploadFeedback(
        uploadedCount === 1
          ? 'Image televersee. Elle sera incluse au prochain message.'
          : `${uploadedCount} images televersees. Elles seront incluses au prochain message.`,
        'info',
      );
      return;
    }

    const feedbackParts: string[] = [];
    if (uploadedCount > 0) {
      feedbackParts.push(`${uploadedCount} image(s) televersee(s)`);
    }
    if (failedCount > 0) {
      feedbackParts.push(
        `${failedCount} echec(s) (format invalide, taille > 8 Mo ou erreur reseau)`,
      );
    }
    if (invalidTypeCount > 0) {
      feedbackParts.push(`${invalidTypeCount} fichier(s) non-image ignore(s)`);
    }
    if (ignoredCount > 0) {
      feedbackParts.push(`${ignoredCount} ignoree(s) (limite conversation atteinte)`);
    }

    this.setUploadFeedback(feedbackParts.join(' | '), failedCount > 0 ? 'error' : 'info');
  }

  async removeUploadedImage(image: UploadedChatImage): Promise<void> {
    if (image.isDeleting || this.isSubmittingConversationTurn) {
      return;
    }

    this.setImageDeletingState(image.id, true);

    try {
      await this.supabaseStorageService.deleteFileByPath(image.path, image.bucket);
      this.uploadedImages = this.uploadedImages.filter((item) => item.id !== image.id);
      this.setUploadFeedback(
        `Image supprimee. Compteur conversation: ${this.imageCountLabel}.`,
        'info',
      );
    } catch (error) {
      console.error('Erreur suppression image chat:', error);
      this.setUploadFeedback('Impossible de supprimer cette image pour le moment.', 'error');
      this.setImageDeletingState(image.id, false);
    }
  }

  stop(): void {
    this.chat.stop();
  }

  regenerate(): void {
    if (this.chat.status !== 'ready' || this.chat.messages.length === 0) {
      return;
    }

    const { auditCriterion } = this.assistantForm.getRawValue();

    void this.chat.regenerate({
      body: {
        assistantRole: this.defaultAssistantRole,
        schoolContext: this.defaultSchoolContext,
        auditCriterion,
      },
    });
  }

  statusLabel(): string {
    switch (this.chat.status) {
      case 'submitted':
        return 'Requete envoyee';
      case 'streaming':
        return 'Reponse en streaming';
      case 'error':
        return 'Erreur';
      case 'ready':
      default:
        return 'Pret';
    }
  }

  statusClass(): string {
    switch (this.chat.status) {
      case 'submitted':
        return 'is-submitted';
      case 'streaming':
        return 'is-streaming';
      case 'error':
        return 'is-error';
      case 'ready':
      default:
        return 'is-ready';
    }
  }

  messageLabel(role: string): string {
    if (role === 'user') {
      return 'Vous';
    }

    if (role === 'assistant') {
      return 'Assistant qualite';
    }

    return 'Systeme';
  }

  renderMarkdown(text: string): string {
    const cleanedText = text.trim();

    if (!cleanedText) {
      return '';
    }

    const cached = this.markdownCache.get(cleanedText);
    if (cached) {
      return cached;
    }

    if (!this.markdownParser) {
      this.ensureMarkdownParserLoaded();
      return this.escapeHtml(cleanedText).replace(/\n/g, '<br>');
    }

    const html = this.markdownParser(cleanedText);

    if (this.markdownCache.size > 250) {
      this.markdownCache.clear();
    }

    this.markdownCache.set(cleanedText, html);
    return html;
  }

  private ensureMarkdownParserLoaded(): void {
    if (this.markdownParser || this.markdownParserLoader) {
      return;
    }

    this.markdownParserLoader = import('marked')
      .then(({ marked }) => {
        this.markdownParser = (value: string) =>
          marked.parse(value, {
            gfm: true,
            breaks: true,
            async: false,
          }) as string;

        this.markdownCache.clear();
        this.chat.messages = [...this.chat.messages];
      })
      .catch((error) => {
        console.warn('Chargement du parser markdown impossible:', error);
      })
      .finally(() => {
        this.markdownParserLoader = null;
      });
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  promptErrorMessage(): string {
    const control = this.assistantForm.controls.prompt;

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return `Le message ne doit pas depasser ${this.maxPromptLength} caracteres.`;
    }

    return '';
  }

  private hasPromptContent(): boolean {
    return this.assistantForm.controls.prompt.value.trim().length > 0;
  }

  private getPendingImagePartsForNextMessage(images: UploadedChatImage[]): FileUIPart[] {
    return images.map((image) => ({
      type: 'file',
      mediaType: image.mediaType,
      filename: image.filename,
      url: image.publicUrl,
    }));
  }

  private toPersistedImagePayload(
    images: UploadedChatImage[],
  ): PersistAiConversationImageRequest[] {
    return images.map((image) => ({
      filename: image.filename || null,
      mediaType: image.mediaType || null,
      bucketName: image.bucket || null,
      storagePath: image.path,
      publicUrl: image.publicUrl,
    }));
  }

  private extractLatestAssistantContent(): string {
    for (let index = this.chat.messages.length - 1; index >= 0; index -= 1) {
      const message = this.chat.messages[index];
      if (message.role !== 'assistant') {
        continue;
      }

      const textParts = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text.trim())
        .filter((text) => text.length > 0);

      return textParts.join('\n').trim();
    }

    return '';
  }

  private async initializeConversations(): Promise<void> {
    this.isLoadingConversations = true;
    this.conversationErrorMessage = '';

    try {
      const loadedConversations = await firstValueFrom(this.aiConversationService.listMine());
      this.conversations = this.sortConversations(loadedConversations);
      this.startDraftConversation();
    } catch (error) {
      console.error('Erreur chargement conversations IA:', error);
      this.conversationErrorMessage =
        'Impossible de charger vos conversations IA. Rechargez la page pour reessayer.';
    } finally {
      this.isLoadingConversations = false;
    }
  }

  private applyConversationDetails(details: AiConversationDetails): void {
    this.selectedConversationId = details.id;
    this.selectedConversationTitle = details.title;
    this.sentImageCount = Number.isFinite(details.imageCount) ? details.imageCount : 0;
    this.uploadedImages = [];

    const mappedMessages: UIMessage[] = details.messages.map((message) => {
      const fileParts: FileUIPart[] = (message.images || []).map((image) => ({
        type: 'file',
        mediaType: image.mediaType || 'image/jpeg',
        filename: image.filename || undefined,
        url: image.publicUrl,
      }));

      const normalizedContent = (message.content || '').trim();
      const textParts =
        normalizedContent.length > 0 ? [{ type: 'text', text: normalizedContent }] : [];

      const parts = [...fileParts, ...textParts];

      return {
        id: `conv-${details.id}-msg-${message.id}`,
        role: message.role === 'ASSISTANT' ? 'assistant' : 'user',
        parts: parts.length > 0 ? parts : [{ type: 'text', text: '' }],
      } as UIMessage;
    });

    this.chat.messages = mappedMessages;
    this.upsertConversationSummary(this.toSummaryFromDetails(details), true);
  }

  private startDraftConversation(): void {
    this.closeEditConversationModal(true);
    this.closeDeleteConversationModal(true);
    this.selectedConversationId = null;
    this.selectedConversationTitle = 'Nouveau Chat';
    this.chat.messages = [];
    this.sentImageCount = 0;
    this.uploadedImages = [];
    this.uploadFeedbackMessage = '';
  }

  private buildConversationTitle(prompt: string): string {
    const normalized = prompt.trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return 'Conversation IA';
    }

    if (normalized.length <= 180) {
      return normalized;
    }

    return `${normalized.slice(0, 177)}...`;
  }

  private toSummaryFromDetails(details: AiConversationDetails): AiConversationSummary {
    const lastMessage =
      details.messages.length > 0 ? details.messages[details.messages.length - 1] : null;

    return {
      id: details.id,
      title: details.title,
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
      lastMessageAt: lastMessage?.createdAt || null,
      lastMessagePreview: lastMessage ? this.truncatePreview(lastMessage.content) : null,
      messageCount: details.messageCount,
      imageCount: details.imageCount,
    };
  }

  private truncatePreview(content: string): string {
    const normalized = (content || '').trim().replace(/\s+/g, ' ');
    if (normalized.length <= 140) {
      return normalized;
    }

    return `${normalized.slice(0, 137)}...`;
  }

  private upsertConversationSummary(
    summary: AiConversationSummary,
    selectConversation: boolean,
  ): void {
    const others = this.conversations.filter((item) => item.id !== summary.id);
    this.conversations = this.sortConversations([summary, ...others]);

    if (selectConversation) {
      this.selectedConversationId = summary.id;
      this.selectedConversationTitle = summary.title;
    }
  }

  private sortConversations(conversations: AiConversationSummary[]): AiConversationSummary[] {
    return [...conversations].sort((left, right) => {
      const rightEpoch = this.toEpoch(right.updatedAt || right.createdAt);
      const leftEpoch = this.toEpoch(left.updatedAt || left.createdAt);
      return rightEpoch - leftEpoch;
    });
  }

  private toEpoch(iso: string | null | undefined): number {
    if (!iso) {
      return 0;
    }

    const timestamp = new Date(iso).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private formatTimestamp(iso: string | null | undefined): string {
    if (!iso) {
      return '';
    }

    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(parsed);
  }

  private async discardPendingUploadedImagesFromStorage(): Promise<void> {
    if (this.uploadedImages.length === 0) {
      return;
    }

    const pending = [...this.uploadedImages];
    this.uploadedImages = [];
    this.uploadFeedbackMessage = '';

    await Promise.all(
      pending.map((image) =>
        this.supabaseStorageService.deleteFileByPath(image.path, image.bucket).catch((error) => {
          console.warn('Nettoyage image en attente impossible:', error);
        }),
      ),
    );
  }

  private remainingImageSlots(): number {
    return this.maxConversationImages - this.totalConversationImageCount();
  }

  private totalConversationImageCount(): number {
    return this.sentImageCount + this.uploadedImages.length;
  }

  private setUploadFeedback(message: string, type: 'info' | 'error'): void {
    this.uploadFeedbackMessage = message;
    this.uploadFeedbackType = type;
  }

  private setImageDeletingState(imageId: string, isDeleting: boolean): void {
    this.uploadedImages = this.uploadedImages.map((image) =>
      image.id === imageId
        ? {
            ...image,
            isDeleting,
          }
        : image,
    );
  }

  private createUploadedImageRecord(
    file: File,
    uploadedAsset: UploadedStorageAsset,
  ): UploadedChatImage {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      filename: file.name,
      mediaType: file.type || 'image/jpeg',
      publicUrl: uploadedAsset.publicUrl,
      path: uploadedAsset.path,
      bucket: uploadedAsset.bucket,
      isDeleting: false,
    };
  }

  private currentAuditeId(): number | null {
    const id = this.authService.user()?.id;
    return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : null;
  }
}
