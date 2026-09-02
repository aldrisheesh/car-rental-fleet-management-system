import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

import {
  assertSafeArtifactKey,
  BackupError,
  type BackupObject,
  type BackupObjectStore,
} from "./backup-domain.ts";

type S3Sender = {
  send(command: unknown): Promise<{
    Body?: { transformToByteArray?: () => Promise<Uint8Array> };
    Contents?: Array<{ Key?: string }>;
    IsTruncated?: boolean;
    NextContinuationToken?: string;
  }>;
};

export class R2BackupObjectStore implements BackupObjectStore {
  private readonly client: S3Sender;
  private readonly bucket: string;

  constructor(
    bucket: string,
    options: {
      accountId?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      client?: S3Sender;
    },
  ) {
    this.bucket = bucket;
    if (options.client) {
      this.client = options.client;
      return;
    }
    const config: S3ClientConfig = {
      region: "auto",
      endpoint: `https://${options.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: options.accessKeyId ?? "",
        secretAccessKey: options.secretAccessKey ?? "",
      },
    };
    this.client = new S3Client(config);
  }

  async put(object: BackupObject) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: assertSafeArtifactKey(object.key),
          Body: object.bytes,
        }),
      );
    } catch {
      throw new BackupError("ArtifactUploadFailed");
    }
  }

  async get(key: string) {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: assertSafeArtifactKey(key),
        }),
      );
      if (!response.Body?.transformToByteArray)
        throw new BackupError("IntegrityValidationFailed");
      return new Uint8Array(await response.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof BackupError) throw error;
      throw new BackupError("IntegrityValidationFailed");
    }
  }

  async list(prefix: string) {
    assertSafeArtifactKey(prefix);
    const keys: string[] = [];
    let continuationToken: string | undefined;
    try {
      do {
        const response = await this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        for (const object of response.Contents ?? []) {
          if (object.Key) keys.push(assertSafeArtifactKey(object.Key));
        }
        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);
      return keys;
    } catch {
      throw new BackupError("UnknownBackupError");
    }
  }

  async delete(key: string) {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: assertSafeArtifactKey(key),
        }),
      );
    } catch {
      throw new BackupError("RetentionCleanupFailed");
    }
  }
}
