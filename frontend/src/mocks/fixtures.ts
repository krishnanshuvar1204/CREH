import type { Dispute, ExchangeRequest, Resource } from "../types";

// Demo data only. Never contains real user data. Typed against the API response types.

export const mockResources = (): Resource[] => [
  {
    id: 101,
    title: "DeWalt Power Drill",
    category: "tools",
    resource_type: "LOAN",
    sharing_radius_m: 2000,
    image_urls: [],
    availability: "AVAILABLE",
    description: "Hardly used power drill, perfect for home projects.",
    is_donation: false,
    lending_duration_days: 7,
    location: { coordinates: [-122.41, 37.79] },
    owner: { id: 9001, name: "Alice", reputation: 4.8 },
  },
  {
    id: 102,
    title: "Camping Tent (4 Person)",
    category: "outdoors",
    resource_type: "LOAN",
    sharing_radius_m: 2000,
    image_urls: [],
    availability: "AVAILABLE",
    description: "Waterproof tent, great for weekend trips.",
    is_donation: false,
    lending_duration_days: 14,
    location: { coordinates: [-122.39, 37.81] },
    owner: { id: 9002, name: "Bob", reputation: 5.0 },
  },
  {
    id: 103,
    title: "Folding Tables (x2)",
    category: "furniture",
    resource_type: "DONATION",
    sharing_radius_m: 5000,
    image_urls: [],
    availability: "AVAILABLE",
    description: "Perfect for garage sales or community events. Free to borrow.",
    is_donation: true,
    lending_duration_days: 2,
    location: { coordinates: [-122.43, 37.77] },
    owner: { id: 9001, name: "Alice", reputation: 4.8 },
  },
];

const now = () => new Date().toISOString();

// Requests for the signed-in user: one they are borrowing, one they are lending.
export const mockRequests = (userId: number, userName: string): ExchangeRequest[] => {
  const [drill, tent] = mockResources() as (Resource & { owner: NonNullable<Resource["owner"]> })[];
  return [
    {
      id: 9001,
      status: "ACCEPTED",
      security_deposit_amount: 50,
      deposit_paid: false,
      created_at: now(),
      resource: drill,
      requester: { id: userId, name: userName },
    },
    {
      id: 9002,
      status: "PENDING",
      security_deposit_amount: 40,
      deposit_paid: false,
      created_at: now(),
      resource: { ...tent, owner: { id: userId, name: userName } },
      requester: { id: 9003, name: "Carol" },
    },
  ];
};

export const mockDisputes = (): Dispute[] => {
  const [req] = mockRequests(9010, "Demo Owner");
  return [
    {
      id: 9001,
      reason: "Item returned with a cracked handle.",
      status: "OPEN",
      admin_notes: null,
      created_at: now(),
      request: { ...req, status: "DISPUTED" },
      raised_by: { id: 9001, name: "Alice", email: "alice@example.com" },
    },
  ];
};
