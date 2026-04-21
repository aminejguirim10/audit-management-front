import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface UploadedStorageAsset {
  publicUrl: string;
  path: string;
  bucket: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseStorageService {
  private readonly fallbackBucket = 'user-assets';
  private readonly client = createClient(environment.supabase.url, environment.supabase.anonKey);
  private readonly profileBucket = environment.supabase.profileBucket;

  async uploadUserProfilePhoto(userId: number, file: File): Promise<string> {
    this.assertConfiguration();

    const extension = this.resolveExtension(file);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = `users/${userId}/profile-${timestamp}.${extension}`;
    const uploadResult = await this.uploadWithFallback(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

    const { data } = this.client.storage.from(uploadResult.bucket).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error('Impossible de recuperer l URL publique de la photo.');
    }

    return data.publicUrl;
  }

  async uploadAuditChatImage(auditeId: number, file: File): Promise<UploadedStorageAsset> {
    this.assertConfiguration();

    if (!file.type.startsWith('image/')) {
      throw new Error('Seules les images sont autorisees pour le chat IA.');
    }

    const extension = this.resolveExtension(file);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeAuditeId = this.slugifySegment(String(auditeId));
    const safeName = this.slugifySegment(file.name.replace(/\.[^/.]+$/, ''));
    const randomToken = Math.random().toString(36).slice(2, 8);
    const path = `chat/audite/${safeAuditeId}/${timestamp}-${safeName}-${randomToken}.${extension}`;

    const uploadResult = await this.uploadWithFallback(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

    const { data } = this.client.storage.from(uploadResult.bucket).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error('Impossible de recuperer l URL publique de l image du chat.');
    }

    return {
      publicUrl: data.publicUrl,
      path,
      bucket: uploadResult.bucket,
    };
  }

  async deleteFileByPath(path: string, bucket?: string): Promise<void> {
    this.assertConfiguration();

    const candidateBuckets = this.uniqueBuckets(
      bucket ? [bucket] : [this.profileBucket, this.fallbackBucket],
    );

    let lastErrorMessage = '';

    for (const targetBucket of candidateBuckets) {
      const result = await this.client.storage.from(targetBucket).remove([path]);

      if (!result.error) {
        return;
      }

      if (this.isBucketNotFound(result.error)) {
        continue;
      }

      if (this.isObjectNotFound(result.error)) {
        return;
      }

      lastErrorMessage = result.error.message;
    }

    if (lastErrorMessage) {
      throw new Error(`Suppression Supabase echouee: ${lastErrorMessage}`);
    }

    throw new Error('Suppression Supabase echouee: bucket introuvable.');
  }

  private async uploadWithFallback(
    path: string,
    file: File,
    options: {
      cacheControl: string;
      contentType: string;
      upsert: boolean;
    },
  ): Promise<{ bucket: string }> {
    let targetBucket = this.profileBucket;

    const primaryUpload = await this.client.storage
      .from(this.profileBucket)
      .upload(path, file, options);

    if (!primaryUpload.error) {
      return { bucket: targetBucket };
    }

    const canTryFallback =
      this.isBucketNotFound(primaryUpload.error) && this.profileBucket !== this.fallbackBucket;

    if (!canTryFallback) {
      throw new Error(this.mapStorageError(primaryUpload.error));
    }

    const fallbackUpload = await this.client.storage
      .from(this.fallbackBucket)
      .upload(path, file, options);

    if (fallbackUpload.error) {
      throw new Error(this.mapStorageError(primaryUpload.error));
    }

    targetBucket = this.fallbackBucket;
    return { bucket: targetBucket };
  }

  private assertConfiguration(): void {
    if (!environment.supabase.url || !environment.supabase.anonKey || !this.profileBucket) {
      throw new Error('Configuration Supabase manquante dans les fichiers environment.');
    }
  }

  private isBucketNotFound(error: { message: string }): boolean {
    const normalized = error.message.toLowerCase();
    return normalized.includes('bucket not found') || normalized.includes('not found');
  }

  private isObjectNotFound(error: { message: string }): boolean {
    const normalized = error.message.toLowerCase();
    return normalized.includes('object not found') || normalized.includes('not found');
  }

  private mapStorageError(error: { message: string }): string {
    if (this.isBucketNotFound(error)) {
      return `Bucket introuvable. Cree un bucket Storage nomme '${this.profileBucket}' (ou '${this.fallbackBucket}') dans Supabase.`;
    }

    return `Upload Supabase echoue: ${error.message}`;
  }

  private resolveExtension(file: File): string {
    const extensionFromName = file.name.split('.').pop()?.toLowerCase();
    if (extensionFromName && /^[a-z0-9]+$/.test(extensionFromName)) {
      return extensionFromName;
    }

    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    return mimeMap[file.type] ?? 'jpg';
  }

  private slugifySegment(value: string): string {
    const cleaned = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return cleaned || 'asset';
  }

  private uniqueBuckets(buckets: string[]): string[] {
    return Array.from(new Set(buckets.filter(Boolean)));
  }
}
