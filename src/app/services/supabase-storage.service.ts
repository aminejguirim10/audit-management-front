import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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
    const uploadOptions = {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    };

    let targetBucket = this.profileBucket;

    const primaryUpload = await this.client.storage
      .from(this.profileBucket)
      .upload(path, file, uploadOptions);

    if (primaryUpload.error) {
      const canTryFallback =
        this.isBucketNotFound(primaryUpload.error) && this.profileBucket !== this.fallbackBucket;

      if (canTryFallback) {
        const fallbackUpload = await this.client.storage
          .from(this.fallbackBucket)
          .upload(path, file, uploadOptions);

        if (!fallbackUpload.error) {
          targetBucket = this.fallbackBucket;
        } else {
          throw new Error(this.mapStorageError(primaryUpload.error));
        }
      } else {
        throw new Error(this.mapStorageError(primaryUpload.error));
      }
    }

    const { data } = this.client.storage.from(targetBucket).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error('Impossible de recuperer l URL publique de la photo.');
    }

    return data.publicUrl;
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
}
