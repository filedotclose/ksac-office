import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";
import { connectDB } from "./db";
import User from "@/models/User";
import { IUser } from "@/types/user";

export async function getCookieFromRequestOrStore(
  name: string,
  req?: Request
): Promise<string | undefined> {
  if (req) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const pairs = cookieHeader.split(";");
      for (const pair of pairs) {
        const [k, ...vParts] = pair.trim().split("=");
        if (k === name) {
          return decodeURIComponent(vParts.join("="));
        }
      }
    }
  }
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch {
    return undefined;
  }
}

export async function getUserFromToken(req?: Request): Promise<IUser | null> {
  try {
    const token = await getCookieFromRequestOrStore("accessToken", req);

    if (!token) return null;

    const decoded: any = verifyAccessToken(token);

    await connectDB();
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) return null;

    const userObj = user.toObject();
    const dbTokenVersion = typeof userObj.tokenVersion === "number" ? userObj.tokenVersion : 0;
    const jwtTokenVersion = typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0;

    // Enforce JWT session versioning: reject tokens from a prior tokenVersion
    if (jwtTokenVersion !== dbTokenVersion) {
      return null;
    }

    const sanitizedSocietyPositions = Array.isArray(userObj.societyPositions)
      ? userObj.societyPositions.map((sp: any) => ({
          society: String(sp.society || ""),
          position: String(sp.position || ""),
          allocatedRoom: sp.allocatedRoom ? String(sp.allocatedRoom) : "",
        }))
      : [];

    return {
      _id: userObj._id.toString(),
      name: String(userObj.name || ""),
      rollNo: String(userObj.rollNo || ""),
      email: String(userObj.email || ""),
      role: userObj.role,
      hostel: userObj.hostel ? String(userObj.hostel) : "KP-7A",
      isSocietyLead: Boolean(userObj.isSocietyLead),
      society: userObj.society ? String(userObj.society) : undefined,
      position: userObj.position ? String(userObj.position) : undefined,
      allocatedRoom: userObj.allocatedRoom ? String(userObj.allocatedRoom) : undefined,
      societyPositions: sanitizedSocietyPositions,
      tokenVersion: dbTokenVersion,
    } as IUser;
  } catch {
    return null;
  }
}

