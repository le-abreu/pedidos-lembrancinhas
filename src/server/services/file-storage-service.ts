import { createHash, randomUUID } from "crypto";
import { Readable } from "stream";

import AWS from "aws-sdk";

import { prisma } from "@/lib/prisma";

export type AttachmentEntityTypeValue = "ORDER" | "ORDER_PHASE_EXECUTION" | "INVOICE";

function getStorageConfig() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !region || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Storage S3/MinIO não configurado.");
  }

  return {
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  };
}

let cachedClient: AWS.S3 | null = null;

function getS3Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getStorageConfig();
  cachedClient = new AWS.S3({
    region: config.region,
    endpoint: config.endpoint,
    s3ForcePathStyle: config.forcePathStyle,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    signatureVersion: "v4",
  });

  return cachedClient;
}

export function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function buildObjectKey(prefix: string, originalName: string) {
  const sanitizedName = sanitizeFileName(originalName || "arquivo");
  return `${prefix}/${randomUUID()}-${sanitizedName}`;
}

async function uploadStoredFile(params: {
  file: File;
  objectPrefix: string;
  uploadedById?: string | null;
}) {
  const { file, objectPrefix, uploadedById } = params;
  const storageConfig = getStorageConfig();
  const s3Client = getS3Client();
  const buffer = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
  const objectKey = buildObjectKey(objectPrefix, file.name);

  await s3Client
    .putObject({
      Bucket: storageConfig.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      ContentLength: buffer.byteLength,
    })
    .promise();

  return (prisma as any).storedFile.create({
    data: {
      bucket: storageConfig.bucket,
      objectKey,
      originalName: file.name || "arquivo",
      mimeType: file.type || "application/octet-stream",
      byteSize: buffer.byteLength,
      checksumSha256,
      uploadedById: uploadedById ?? null,
    },
  });
}

export async function uploadUserAvatar(params: {
  file: File;
  userId: string;
}) {
  return uploadStoredFile({
    file: params.file,
    objectPrefix: `users/${params.userId}/avatar`,
    uploadedById: params.userId,
  });
}

export async function uploadAndAttachFile(params: {
  file: File;
  entityType: AttachmentEntityTypeValue;
  entityId: string;
  uploadedById?: string | null;
}) {
  const { file, entityType, entityId, uploadedById } = params;
  const storedFile = await uploadStoredFile({
    file,
    objectPrefix: `${entityType.toLowerCase()}/${entityId}`,
    uploadedById,
  });

  await (prisma as any).fileAttachment.create({
    data: {
      storedFileId: storedFile.id,
      entityType,
      entityId,
    },
  });

  return storedFile;
}

export async function getAttachmentStream(storedFileId: string) {
  const storedFile = await (prisma as any).storedFile.findUnique({
    where: { id: storedFileId },
  });

  if (!storedFile) {
    return null;
  }

  const s3Client = getS3Client();
  const response = await s3Client
    .getObject({
      Bucket: storedFile.bucket,
      Key: storedFile.objectKey,
    })
    .promise();

  const body = response.Body;

  if (!body) {
    throw new Error("Arquivo sem conteúdo no storage.");
  }

  return {
    storedFile,
    body: Readable.from(body as any),
  };
}

export async function getAttachmentsByEntity(entityType: AttachmentEntityTypeValue, entityIds: string[]) {
  if (!entityIds.length) {
    return new Map<string, Array<any>>();
  }

  const attachments = await (prisma as any).fileAttachment.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
    },
    orderBy: { createdAt: "desc" },
    include: {
      storedFile: {
        include: {
          uploadedBy: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  const grouped = new Map<string, Array<any>>();

  for (const attachment of attachments) {
    const current = grouped.get(attachment.entityId) ?? [];
    current.push(attachment);
    grouped.set(attachment.entityId, current);
  }

  return grouped;
}
