import { UserRole, VerificationStatus } from "../entity/User";

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; email: string; name: string; role: UserRole; verification_status: VerificationStatus };
            valid?: { body?: any; query?: any; params?: any };
        }
    }
}

export {};
