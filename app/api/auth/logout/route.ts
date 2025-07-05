import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "ログアウトしました" });

    // cookieからトークンを削除
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("ログアウトエラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
