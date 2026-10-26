export type LogPoseStatus = "LOCKED" | "UNLOCKED";

export type WantedStatus = "AT_LARGE" | "CAPTURED" | "MISSING";

export type FruitType = "PARAMECIA" | "ZOAN" | "LOGIA";

export type FruitFilter = FruitType | "NONE";

export type CrewRole =
  | "CAPTAIN"
  | "FIRST_MATE"
  | "NAVIGATOR"
  | "SNIPER"
  | "COOK"
  | "DOCTOR"
  | "SHIPWRIGHT"
  | "MUSICIAN"
  | "ARCHAEOLOGIST"
  | "HELMSMAN"
  | "FIGHTER";

export type SortOption = "bounty,desc" | "name,asc" | "updatedAt,desc";

export type PageSize = 10 | 20 | 50;

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Team {
  code: string;
  name: string;
}

export interface AuthSession {
  token: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: User;
  team: Team;
}

export interface MeResponse {
  user: User;
  team: Team;
  expiresAt: string;
}

export interface CrewRef {
  id: string;
  name: string;
}

export interface Crew extends CrewRef {
  shipName: string;
  jollyRogerColor: string;
  memberCount: number;
  totalBounty: number;
}

export interface DevilFruit {
  name: string;
  type: FruitType;
}

export interface WantedSummary {
  id: string;
  name: string;
  epithet: string;
  bounty: number;
  status: WantedStatus;
  crew: CrewRef;
  role: CrewRole;
  devilFruit: DevilFruit | null;
  threatLevel: number;
  lastSeenIsland: string;
  updatedAt: string;
}

export interface BountyHistoryEntry {
  amount: number;
  issuedAt: string;
}

export interface WantedDetail extends WantedSummary {
  age: number;
  heightCm: number;
  bio: string;
  lastSeen: {
    island: string;
    seenAt: string;
  };
  bountyHistory: BountyHistoryEntry[];
}

export interface WantedPage {
  content: WantedSummary[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface DashboardSummary {
  team: Team;
  wanted: {
    total: number;
    totalBounty: number;
    averageBounty: number;
    byStatus: Record<WantedStatus, number>;
    byFruit: Record<FruitType | "NONE", number>;
  };
  crews: {
    total: number;
    mostWanted: Crew | null;
  };
  topBounties: WantedSummary[];
  generatedAt: string;
}

export interface LogPose {
  status: LogPoseStatus;
  grandLineUnlocked: boolean;
  unlockedAt: string | null;
  message: string;
}

export interface WantedQuery {
  page: number;
  size: PageSize;
  status: WantedStatus | null;
  crewId: string | null;
  fruit: FruitFilter | null;
  q: string;
  sort: SortOption;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}
