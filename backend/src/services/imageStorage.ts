import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { badRequest } from "../lib/errors";

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const ALLOWED: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024;

// What the client needs to push a file straight to the storage provider.
export type UploadTicket =
    | { provider: "local" } // no direct-to-CDN path: the client sends base64 to POST /resources/:id/images
    | {
          provider: "cloudinary";
          uploadUrl: string;
          fields: Record<string, string | number>; // append to the multipart form together with `file`
      };

export interface ImageStorage {
    /** Stores base64 image data and returns the URL/path to persist. */
    saveBase64(dataUrl: string): Promise<string>;
    /** Signed parameters for a direct-to-CDN upload (P2-03). */
    signUpload(folder: string): UploadTicket;
    /** True when `url` points at a file this storage owns (guards against attaching arbitrary URLs). */
    owns(url: string): boolean;
    /** Best effort removal of a stored file. */
    remove(url: string): Promise<void>;
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
    signUpload() {
        return { provider: "local" };
    },
    owns: (url) => /^\/uploads\/[A-Za-z0-9-]+\.(png|jpg|webp|gif)$/.test(url),
    async remove(url) {
        if (!this.owns(url)) return;
        await fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => undefined);
    },
};

// Cloudinary signed uploads: the API secret never leaves the server; the browser uploads straight to Cloudinary.
const cloudinaryPrefix = () => `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/`;

export const cloudinaryImageStorage: ImageStorage = {
    saveBase64: (dataUrl) => localImageStorage.saveBase64(dataUrl), // server-side fallback (e.g. avatars)
    signUpload(folder) {
        const timestamp = Math.floor(Date.now() / 1000);
        // Signature = sha1 of the sorted "k=v&k=v" params + api secret.
        const toSign = `folder=${folder}&timestamp=${timestamp}`;
        const signature = crypto.createHash("sha1").update(toSign + env.CLOUDINARY_API_SECRET).digest("hex");
        return {
            provider: "cloudinary",
            uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
            fields: { api_key: env.CLOUDINARY_API_KEY, timestamp, folder, signature },
        };
    },
    owns: (url) => url.startsWith(cloudinaryPrefix()) || localImageStorage.owns(url),
    async remove(url) {
        // Cloudinary assets are left in place (deletion needs an admin API call); local files are removed.
        await localImageStorage.remove(url);
    },
};

export const imageStorage: ImageStorage =
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
        ? cloudinaryImageStorage
        : localImageStorage;
