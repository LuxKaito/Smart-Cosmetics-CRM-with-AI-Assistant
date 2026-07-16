import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import type { EditorialArticle } from "../../data/editorialContent";
import Footer from "../layout/Footer";
import Header from "../layout/Header";

type ContentBlock =
    | { type: "heading"; level: 2 | 3; text: string; id: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; ordered: boolean; items: string[] }
    | { type: "kv"; items: { label: string; value: string }[] };

const listHeadingLabels = new Set([
    "lưu ý",
    "điểm nổi bật",
    "điểm cộng nổi bật",
    "đặc điểm nổi bật",
    "công dụng nổi bật",
    "phù hợp với",
    "ưu điểm",
    "nhược điểm",
    "hướng dẫn dùng",
    "hướng dẫn sử dụng",
    "cách dùng",
    "cách sử dụng",
]);

const noiseExact = new Set([
    "0",
    "DANH MỤC SẢN PHẨM",
    "SẢN PHẨM MỚI",
    "LUXBERRY BEAUTY",
    "GÓC LÀM ĐẸP",
    "TRA CỨU ĐƠN HÀNG",
    "TRANG CHỦ",
    "REVIEWS MỸ PHẨM",
    "ADMIN",
    "CÁC NỘI DUNG CHÍNH",
    "CÁC BÀI VIẾT LIÊN QUAN",
    "⭐️",
]);

const normalizeLine = (line: string) => line.replace(/\s+/g, " ").trim();

const isDecorativeImage = (url: string) => {
    const normalized = url.toLowerCase();
    return (
        normalized.includes("/face.webp") ||
        normalized.includes("/ins.png") ||
        normalized.includes("facebook") ||
        normalized.includes("instagram")
    );
};

const isNoiseLine = (
    line: string,
    article: EditorialArticle,
    listingLabel: string,
) => {
    const normalized = normalizeLine(line);
    if (!normalized) return true;
    if (/^[-_]{3,}$/.test(normalized)) return true;
    const upper = normalized.toUpperCase();
    if (noiseExact.has(upper)) return true;
    if (upper.startsWith("NHẬP MÃ") || upper.startsWith("HỖ TRỢ GÓI QUÀ"))
        return true;
    if (upper.startsWith("ĐỊA CHỈ:")) return true;
    if (
        normalized === article.title ||
        normalized === article.category ||
        normalized === article.publishedAt ||
        normalized === listingLabel
    )
        return true;
    return false;
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const isBulletLine = (line: string) =>
    /^[-•]\s+/.test(line) || /^✔️\s+/.test(line) || /^✅\s+/.test(line);

const stripBullet = (line: string) =>
    line
        .replace(/^[-•]\s+/, "")
        .replace(/^✔️\s+/, "")
        .replace(/^✅\s+/, "");

const isStepLine = (line: string) => /^Bước\s+\d+:/i.test(line);

const stripStep = (line: string) => line.replace(/^Bước\s+\d+:\s*/i, "");

const isKeyValueLine = (line: string) => /^[^:]{2,40}:\s+.+/.test(line);

const isHeadingCandidate = (line: string) => {
    if (line.length > 120) return false;
    if (isBulletLine(line) || isStepLine(line) || isKeyValueLine(line))
        return false;
    if (line.endsWith("?")) return true;
    if (line.endsWith(":")) return true;
    return !/[.!?]$/.test(line) && line.length <= 80;
};

const isSoftListHeading = (line: string) => {
    const text = line.replace(/:$/, "").trim().toLowerCase();
    return listHeadingLabels.has(text);
};

const parseContentBlocks = (
    article: EditorialArticle,
    listingLabel: string,
) => {
    const rawLines = article.content?.split(/\r?\n/) ?? [];
    const cleanedLines = rawLines
        .map(normalizeLine)
        .filter((line) => !isNoiseLine(line, article, listingLabel))
        .filter((line, index, arr) => line !== arr[index - 1]);

    const blocks: ContentBlock[] = [];
    const seenIds: Record<string, number> = {};

    const pushHeading = (text: string, level: 2 | 3) => {
        const baseId = slugify(text) || "section";
        const count = seenIds[baseId] ?? 0;
        const id = count ? `${baseId}-${count + 1}` : baseId;
        seenIds[baseId] = count + 1;
        blocks.push({ type: "heading", level, text, id });
    };

    for (let i = 0; i < cleanedLines.length; ) {
        const line = cleanedLines[i];

        if (isStepLine(line)) {
            const items: string[] = [];
            while (i < cleanedLines.length && isStepLine(cleanedLines[i])) {
                items.push(stripStep(cleanedLines[i]));
                i += 1;
            }
            blocks.push({ type: "list", ordered: true, items });
            continue;
        }

        if (isBulletLine(line)) {
            const items: string[] = [];
            while (i < cleanedLines.length && isBulletLine(cleanedLines[i])) {
                items.push(stripBullet(cleanedLines[i]));
                i += 1;
            }
            blocks.push({ type: "list", ordered: false, items });
            continue;
        }

        if (isKeyValueLine(line)) {
            const items: { label: string; value: string }[] = [];
            while (i < cleanedLines.length && isKeyValueLine(cleanedLines[i])) {
                const [label, ...rest] = cleanedLines[i].split(":");
                items.push({
                    label: label.trim(),
                    value: rest.join(":").trim(),
                });
                i += 1;
            }
            blocks.push({ type: "kv", items });
            continue;
        }

        if (isSoftListHeading(line)) {
            const text = line.replace(/:$/, "").trim();
            pushHeading(text, 3);
            i += 1;

            const items: string[] = [];
            while (i < cleanedLines.length) {
                const next = cleanedLines[i];
                if (
                    isHeadingCandidate(next) ||
                    isBulletLine(next) ||
                    isStepLine(next) ||
                    isKeyValueLine(next)
                )
                    break;
                if (next.length > 160) break;
                items.push(next);
                i += 1;
            }

            if (items.length >= 2) {
                blocks.push({ type: "list", ordered: false, items });
            } else if (items.length === 1) {
                blocks.push({ type: "paragraph", text: items[0] });
            }
            continue;
        }

        if (isHeadingCandidate(line)) {
            const text = line.replace(/:$/, "").trim();
            const level: 2 | 3 = line.endsWith(":") ? 3 : 2;
            pushHeading(text, level);
            i += 1;
            continue;
        }

        blocks.push({ type: "paragraph", text: line });
        i += 1;
    }

    return { blocks };
};

const isHighlightLine = (text: string) =>
    /^GIÁ:/i.test(text) || /MUA NGAY/i.test(text);

export default function EditorialDetailPage({
    article,
    listingHref,
    listingLabel,
}: {
    article: EditorialArticle;
    listingHref: string;
    listingLabel: string;
}) {
    const { blocks } = parseContentBlocks(article, listingLabel);
    const filteredImages = (article.detailImages ?? []).filter(
        (imageUrl) => !isDecorativeImage(imageUrl),
    );
    const contentNodes: JSX.Element[] = [];
    let imageIndex = 0;

    blocks.forEach((block, index) => {
        if (block.type === "heading") {
            const imageUrl = filteredImages[imageIndex];
            const HeadingTag = block.level === 2 ? "h2" : "h3";

            if (imageUrl) {
                imageIndex += 1;
                contentNodes.push(
                    <div
                        key={`section-${block.id}-${index}`}
                        className="space-y-3">
                        <HeadingTag
                            id={block.id}
                            className={`scroll-mt-28 font-bold text-[#2B1B24] ${
                                block.level === 2
                                    ? "text-xl md:text-2xl"
                                    : "text-lg"
                            }`}>
                            {block.text}
                        </HeadingTag>
                        <figure className="overflow-hidden rounded-2xl border border-[#F4DEE6] bg-[#FFF9FB] shadow-[0_10px_24px_rgba(154,88,111,0.08)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={`Hình ảnh minh họa: ${block.text}`}
                                className="w-full object-cover"
                                loading="lazy"
                            />
                        </figure>
                    </div>,
                );
                return;
            }

            contentNodes.push(
                <HeadingTag
                    key={`${block.id}-${index}`}
                    id={block.id}
                    className={`scroll-mt-28 font-bold text-[#2B1B24] ${
                        block.level === 2 ? "text-xl md:text-2xl" : "text-lg"
                    }`}>
                    {block.text}
                </HeadingTag>,
            );
            return;
        }

        if (block.type === "list") {
            const ListTag = block.ordered ? "ol" : "ul";
            contentNodes.push(
                <ListTag
                    key={`list-${index}`}
                    className={`space-y-2 pl-5 marker:text-[#B14063] ${
                        block.ordered ? "list-decimal" : "list-disc"
                    }`}>
                    {block.items.map((item, itemIndex) => (
                        <li key={`${item}-${itemIndex}`}>{item}</li>
                    ))}
                </ListTag>,
            );
            return;
        }

        if (block.type === "kv") {
            contentNodes.push(
                <dl
                    key={`kv-${index}`}
                    className="grid gap-3 rounded-2xl border border-[#F4DEE6] bg-[#FFF7FA] p-4">
                    {block.items.map((item) => (
                        <div
                            key={`${item.label}-${item.value}`}
                            className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                            <dt className="font-semibold text-[#2B1B24] sm:w-40">
                                {item.label}
                            </dt>
                            <dd className="flex-1">{item.value}</dd>
                        </div>
                    ))}
                </dl>,
            );
            return;
        }

        contentNodes.push(
            <p
                key={`paragraph-${index}`}
                className={
                    isHighlightLine(block.text)
                        ? "rounded-2xl border border-[#F4DEE6] bg-[#FFF7FA] p-4 font-medium text-[#6E5962]"
                        : "text-[#5A4850]"
                }>
                {block.text}
            </p>,
        );
    });

    return (
        <div className="min-h-screen bg-[#FFF9FB] text-[#2B1B24]">
            <Header />
            <main className="mx-auto max-w-4xl px-4 py-8">
                <nav className="flex flex-wrap items-center gap-1 text-sm text-[#8A747D]">
                    <Link href="/">Trang chủ</Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href={listingHref}>{listingLabel}</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="line-clamp-1">{article.title}</span>
                </nav>

                <article className="mt-5 overflow-hidden rounded-[28px] border border-[#F4DEE6] bg-white shadow-[0_10px_28px_rgba(154,88,111,0.08)]">
                    <div className="p-5 md:p-8">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#B14063]">
                            <span className="rounded-full bg-[#FFF0F5] px-3 py-1">
                                {article.category}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#8A747D]">
                                <CalendarDays className="h-4 w-4" />
                                {article.publishedAt}
                            </span>
                        </div>
                        <h1 className="mt-4 text-2xl font-bold leading-tight md:text-4xl">
                            {article.title}
                        </h1>
                        <p className="mt-4 text-base font-medium leading-7 text-[#6E5962]">
                            {article.summary}
                        </p>

                        <div className="mt-8 space-y-6 text-[15px] leading-7 text-[#5A4850]">
                            {contentNodes}
                        </div>
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
