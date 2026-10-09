import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
