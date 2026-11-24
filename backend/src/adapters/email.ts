import { env } from "../config/env";
import { logger } from "../lib/logger";

export interface EmailMessage {
    to: string;
    subject: string;
    text: string;
}

// Third-party mail goes only through this interface (SPEC section 7).
export interface EmailProvider {
    send(message: EmailMessage): Promise<void>;
}

// Dev implementation: prints the email in the API log so verification codes are copy-pasteable.
export class ConsoleEmailProvider implements EmailProvider {
    async send(m: EmailMessage) {
        logger.info(
            `\n----- EMAIL (console provider) -----\nTo: ${m.to}\nSubject: ${m.subject}\n\n${m.text}\n------------------------------------`
        );
    }
}

export class ResendEmailProvider implements EmailProvider {
    async send(m: EmailMessage) {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: env.EMAIL_FROM, to: [m.to], subject: m.subject, text: m.text }),
        });
        if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
    }
}

const build = (): EmailProvider => {
    if (env.EMAIL_PROVIDER === "resend") {
        if (!env.RESEND_API_KEY) throw new Error("EMAIL_PROVIDER=resend requires RESEND_API_KEY");
        return new ResendEmailProvider();
    }
    return new ConsoleEmailProvider();
};

export const emailProvider: EmailProvider = build();
