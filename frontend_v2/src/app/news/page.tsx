"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { fetchBlogs } from "../../services/blogService";

interface NewsItem {
    _id: string;
    title: string;
    image?: string;
    summary?: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);

    useEffect(() => {
        fetchBlogs()
            .then((data) => setNews(data as NewsItem[]))
            .catch(() => setNews([]));
    }, []);

    return (
        <div className="page-shell">
            <Header />
            <main className="auth-page">
                <section className="auth-card" aria-label="Tin tức">
                    <h1>Tin tức</h1>
                    {news.length === 0 ? (
                        <p>Chưa có bài viết.</p>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {news.map((item: NewsItem) => (
                                <li key={item._id} style={{ marginBottom: 16 }}>
                                    <h3>{item.title}</h3>
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={960}
                                            height={540}
                                            style={{
                                                maxWidth: "100%",
                                                height: "auto",
                                                borderRadius: 8,
                                            }}
                                        />
                                    ) : null}
                                    <p>{item.summary}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    );
}
