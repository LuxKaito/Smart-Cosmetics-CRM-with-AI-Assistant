interface NewsItem {
    title: string;
    summary: string;
}

export default function NewsSection({ news }: { news: NewsItem[] }) {
    return (
        <section className="news-section">
            <div className="section-head beauty-section-head">
                <div>
                    <h2>Bí quyết chăm sóc da</h2>
                </div>
                <a href="/news">Xem tất cả</a>
            </div>
            <div className="news-grid">
                {news.map((item, index) => (
                    <article
                        key={`${item.title}-${index}`}
                        className="news-card">
                        <div className="news-image" />
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <a href="/news">Đọc tiếp</a>
                    </article>
                ))}
            </div>
        </section>
    );
}
