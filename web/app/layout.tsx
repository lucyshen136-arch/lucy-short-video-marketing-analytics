import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucy 短视频研究 · 视频管理",
  description: "三层字段视频录入与管理",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/videos" className="font-semibold text-slate-800">
              短视频 Gold 数据集
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/videos" className="text-slate-600 hover:text-slate-900">
                视频列表
              </Link>
              <Link href="/dictionaries" className="text-slate-600 hover:text-slate-900">
                数据字典
              </Link>
              <Link href="/videos/new" className="text-blue-600 hover:text-blue-800">
                添加视频
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
