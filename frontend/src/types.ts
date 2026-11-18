// Shapes returned by the API. Mock fixtures in src/mocks use these same types so they cannot drift silently.

export interface PublicUser {
  id: number;
  name: string;
  email?: string;
  reputation?: number;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  is_donation: boolean;
  lending_duration_days: number | null;
  sharing_radius_km?: number;
  image_url?: string | null;
  status?: "AVAILABLE" | "BORROWED" | "UNAVAILABLE";
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
