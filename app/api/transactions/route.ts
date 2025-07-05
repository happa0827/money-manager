import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 取引データの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 },
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("取引データの取得エラー:", error);
    return NextResponse.json(
      { error: "取引データの取得に失敗しました" },
      { status: 500 },
    );
  }
}

// 取引データの作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, amount, description, date, formattedDate, userId } = body;

    if (!type || !amount || !description || !date || !userId) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 },
      );
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "取引タイプが無効です" },
        { status: 400 },
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        description,
        date,
        formattedDate,
        userId,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("取引データの作成エラー:", error);
    return NextResponse.json(
      { error: "取引データの作成に失敗しました" },
      { status: 500 },
    );
  }
}

// 取引データの削除（全削除）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 },
      );
    }

    await prisma.transaction.deleteMany({
      where: {
        userId: userId,
      },
    });

    return NextResponse.json({ message: "取引データを削除しました" });
  } catch (error) {
    console.error("取引データの削除エラー:", error);
    return NextResponse.json(
      { error: "取引データの削除に失敗しました" },
      { status: 500 },
    );
  }
}
