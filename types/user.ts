export type Role = "student" | "fic" | "dean" | "admin" | "warden" | "ksac" | "president" | "vice_president";

export interface ISocietyPosition {
  society: string;
  position: "President" | "Vice-President" | string;
  allocatedRoom?: string;
}

export interface IUser {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  role: Role;
  department?: string;
  hostel?: string;
  isSocietyLead?: boolean;
  society?: string;
  assignedSocieties?: string[];
  position?: string;
  allocatedRoom?: string;
  societyPositions?: ISocietyPosition[];
  tokenVersion?: number;
}
