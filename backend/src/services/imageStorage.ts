import fs from "fs";
import path from "path";
import crypto from "crypto";
import { badRequest } from "../lib/errors";

// Local-disk implementation behind a small interface so a Cloudinary adapter can replace it (Phase 2).
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const ALLOWED: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024;

export interface ImageStorage {
    saveBase64(dataUrl: string): Promise<string>;
}

export const localImageStorage: ImageStorage = {
    async saveBase64(dataUrl: string) {
        const match = dataUrl.match(/^data:([A-Za-z0-9.+\/-]+);base64,(.+)$/);
        if (!match) throw badRequest("Invalid image data");
        const ext = ALLOWED[match[1]];
        if (!ext) throw badRequest("Unsupported image type (use PNG, JPEG, WebP or GIF)");
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.length > MAX_BYTES) throw badRequest("Image too large (max 8 MB)");

        await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
        const filename = `${crypto.randomUUID()}.${ext}`;
        await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
        return `/uploads/${filename}`;
    },
};
