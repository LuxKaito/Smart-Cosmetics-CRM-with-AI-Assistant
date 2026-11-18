"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

// One motion system for route changes, streamed pages and asynchronously loaded cards.
export default function SiteMotion() {
    const pathname = usePathname();

    useEffect(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
            const seen = new WeakSet<Element>();
            let frame = 0;
            const dashboard = /^\/(admin|staff)(\/|$)/.test(pathname);
            const mobile = window.matchMedia("(max-width: 767px)").matches;
            const distance = dashboard || mobile ? 10 : 22;
            const duration = dashboard ? 0.35 : mobile ? 0.45 : 0.65;
            const context = gsap.context(() => {});
            const observer = new IntersectionObserver((entries) => {
                const entering = entries.filter((entry) => entry.isIntersecting);
                context.add(() => {
                    entering.forEach(({ target }, index) => {
                        observer.unobserve(target);
                        // Never move a form while the visitor is interacting with it.
                        if (target.contains(document.activeElement)) return;
                        gsap.fromTo(target, { opacity: 0, y: distance }, {
                            opacity: 1,
                            y: 0,
                            duration,
                            delay: Math.min(index * 0.045, 0.18),
                            ease: "power2.out",
                            clearProps: "opacity,transform",
                        });
                    });
                });
            }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

            const scan = () => {
                frame = 0;
                document.querySelectorAll<HTMLElement>("main").forEach((main) => {
                    const cards = main.querySelectorAll<HTMLElement>(
                        ".product-card:not(.empty), .category-icon-card, [data-motion-card]",
                    );
                    const targets = new Set<HTMLElement>(cards);
                    Array.from(main.children).forEach((child) => {
                        if (!(child instanceof HTMLElement)) return;
                        if (child.matches("script, style, aside, nav") || child.getAttribute("role") === "dialog") return;
                        // Keep the campaign artwork still; its banner has no animated copy.
                        if (child.matches(".promo-wide")) return;
                        // Keep product groups separate so cards can appear in a short stagger.
                        if (child.querySelector(".product-card, .category-icon-card, [data-motion-card]")) {
                            child.querySelectorAll<HTMLElement>("h1, h2, .section-header").forEach((heading) => {
                                if (heading.closest(".product-card, [data-motion-card]")) return;
                                if (heading.matches(".section-header") || !heading.closest(".section-header")) targets.add(heading);
                            });
                        } else if (child.offsetHeight > 0) targets.add(child);
                    });
                    targets.forEach((target) => {
                        if (seen.has(target) || target.closest('[data-motion="off"], [role="dialog"], [aria-busy="true"]')) return;
                        seen.add(target);
                        observer.observe(target);
                    });
                });
            };
            const mutations = new MutationObserver((records) => {
                if (records.some((record) => record.addedNodes.length) && !frame) {
                    frame = requestAnimationFrame(scan);
                }
                records.forEach((record) => record.removedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    observer.unobserve(node);
                    node.querySelectorAll("*").forEach((child) => observer.unobserve(child));
                }));
            });
            scan();
            mutations.observe(document.body, { childList: true, subtree: true });
            return () => {
                cancelAnimationFrame(frame);
                mutations.disconnect();
                observer.disconnect();
                context.revert();
            };
        });
        return () => media.revert();
    }, [pathname]);

    return null;
}
