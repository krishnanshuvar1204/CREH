// Shapes returned by the API. Mock fixtures in src/mocks use these same types so they cannot drift silently.

export interface PublicUser {
  id: number;
  name: string;
  email?: string;
  reputation?: number;
}

export type ResourceCategory = "tools" | "electronics" | "outdoors" | "furniture" | "kitchen" | "books" | "other";
export type ResourceAvailability = "AVAILABLE" | "RESERVED" | "BORROWED" | "UNAVAILABLE";
export type ResourceType = "LOAN" | "DONATION";

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: ResourceCategory;
  resource_type: ResourceType;
  is_donation: boolean;
  lending_duration_days: number | null;
  sharing_radius_m: number;
  image_urls: string[];
  availability: ResourceAvailability;
  location: { type?: "Point"; coordinates: [number, number] }; // [lng, lat]
  owner?: PublicUser;
}

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "ACTIVE"
  | "RETURNED_PENDING_REVIEW"
  | "COMPLETED"
  | "DISPUTED"
  | "RESOLVED_REFUNDED"
  | "RESOLVED_PAID_TO_OWNER";

export interface ExchangeRequest {
  id: number;
  status: RequestStatus;
  security_deposit_amount: number | null;
  deposit_paid: boolean;
  created_at: string;
  resource: Resource & { owner: PublicUser };
  requester: PublicUser;
}

export interface Dispute {
  id: number;
  reason: string;
  status: "OPEN" | "RESOLVED";
  admin_notes: string | null;
  created_at: string;
  request: ExchangeRequest;
  raised_by: PublicUser;
}

export type VerificationStatus = "unverified" | "email_verified" | "community_pending" | "community_verified";

// GET /users/me
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin";
  verification_status: VerificationStatus;
  phone: string | null;
  address: string | null;
  bio: string | null;
  avatar_url: string | null;
  reputation_score: string;
  community_verification_note: string | null;
  community_verification_submitted_at: string | null;
  home_location: { lat: number; lng: number } | null;
  created_at: string;
}
