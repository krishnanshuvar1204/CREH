import type { UserProfile } from "../types";

// Demo profile shown only when the API is unreachable (SPEC section 7b). Contains no real user data.
export const mockProfile = (user: { id: number; name: string; email: string }): UserProfile => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: "member",
  verification_status: "email_verified",
  phone: null,
  address: "Sample Street, Demo City",
  bio: "This is sample profile data.",
  avatar_url: null,
  reputation_score: "5.00",
  community_verification_note: null,
  community_verification_submitted_at: null,
  home_location: { lat: 37.78, lng: -122.41 },
  created_at: new Date().toISOString(),
});
