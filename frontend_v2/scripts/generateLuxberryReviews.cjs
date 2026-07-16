const fs = require("node:fs/promises");
const path = require("node:path");
const ExcelJS = require(path.resolve(__dirname, "../../backend/node_modules/exceljs"));

const workbookPath = path.resolve(__dirname, "../public/Luxberry_Reviews_My_Pham.xlsx");
const outputPath = path.resolve(__dirname, "../src/data/luxberryReviews.json");

const asText = (value) => String(value ?? "").trim();

const main = async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);

    const worksheet = workbook.worksheets[0];
    const headers = worksheet.getRow(1).values.slice(1).map(asText);
    const articles = [];

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 1) {
        const values = worksheet.getRow(rowIndex).values.slice(1);
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));

        if (!asText(row.article_id)) {
            continue;
        }

        articles.push({
            slug: asText(row.article_id),
            title: asText(row.title),
            summary: asText(row.excerpt).replace(/\s+/g, " "),
            category: "Review mỹ phẩm",
            publishedAt: asText(row.published_date),
            imageUrl: asText(row.image_url),
            detailImages: asText(row.detail_image_urls)
                .split(/\r?\n/)
                .map((url) => url.trim())
                .filter((url) => /cdn\.hstatic\.net/i.test(url)),
            content: asText(row.content).replace(/\r\n/g, "\n"),
        });
    }

    await fs.writeFile(outputPath, `${JSON.stringify(articles, null, 2)}\n`, "utf8");
    console.log(`Generated ${articles.length} LuxBerry review articles.`);
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
