"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import {
    useAnimate,
    useReducedMotion,
    type Transition,
} from "framer-motion";

type TactileButtonProps = {
    children: ReactNode;
    href?: string;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
    className?: string;
    wrapperClassName?: string;
    fullWidth?: boolean;
    size?: "compact" | "regular";
    variant?: "primary" | "secondary";
    fill?: string;
    textColor?: string;
    hoverFill?: string;
    hoverTextColor?: string;
    baseColor?: string;
    ariaLabel?: string;
    tabIndex?: number;
    target?: "_blank" | "_self";
};

const RELEASE: Transition = {
    type: "spring",
    stiffness: 700,
    damping: 22,
    mass: 0.6,
};

const PRESS: Transition = {
    type: "tween",
    ease: "easeOut",
    duration: 0.05,
};

const INSTANT: Transition = { duration: 0 };
const DEPTH = 5;

/** Originkit's tactile keycap interaction, themed for LuxBerry's rose palette. */
export default function TactileButton({
    children,
    href,
    type = "button",
    disabled = false,
    onClick,
    className = "",
    wrapperClassName = "",
    fullWidth = false,
    size = "regular",
    variant = "primary",
    fill,
    textColor,
    hoverFill,
    hoverTextColor,
    baseColor,
    ariaLabel,
    tabIndex,
    target,
}: TactileButtonProps) {
    const [scope, animate] = useAnimate();
    const capRef = useRef<HTMLElement | null>(null);
    const hovered = useRef(false);
    const pressed = useRef(false);
    const reducedMotion = useReducedMotion();
    const isSecondary = variant === "secondary";
    const colors = {
        fill: fill ?? (isSecondary ? "#FFFFFF" : "#F999B7"),
        text: textColor ?? (isSecondary ? "#8F3857" : "#FFFFFF"),
        hoverFill:
            hoverFill ?? (isSecondary ? "#FFE8EF" : "#F27EA5"),
        hoverText:
            hoverTextColor ?? (isSecondary ? "#702C47" : "#FFFFFF"),
        base: baseColor ?? (isSecondary ? "#DFA0B5" : "#B95776"),
    };
    const paint = useCallback(
        (isHovered: boolean, immediate = false) => {
            const cap = capRef.current;
            if (!cap) return;

            animate(
                cap,
                {
                    backgroundColor: isHovered ? colors.hoverFill : colors.fill,
                    color: isHovered ? colors.hoverText : colors.text,
                } as any,
                (immediate || reducedMotion ? INSTANT : RELEASE) as any,
            );
        },
        [animate, colors.fill, colors.hoverFill, colors.hoverText, colors.text, reducedMotion],
    );

    const press = useCallback(
        (isPressed: boolean) => {
            const cap = capRef.current;
            if (!cap) return;

            animate(
                cap,
                { x: 0, y: isPressed ? DEPTH : 0 } as any,
                (reducedMotion ? INSTANT : isPressed ? PRESS : RELEASE) as any,
            );
        },
        [animate, reducedMotion],
    );

    useEffect(() => {
        paint(hovered.current, true);
    }, [paint]);

    useEffect(() => {
        press(pressed.current);
    }, [press]);

    useEffect(() => {
        const release = () => {
            if (!pressed.current) return;
            pressed.current = false;
            press(false);
        };

        window.addEventListener("pointerup", release);
        window.addEventListener("pointercancel", release);
        return () => {
            window.removeEventListener("pointerup", release);
            window.removeEventListener("pointercancel", release);
        };
    }, [press]);

    const handlePointerEnter = () => {
        if (disabled) return;
        hovered.current = true;
        paint(true);
    };

    const handlePointerLeave = () => {
        hovered.current = false;
        paint(false);
        if (pressed.current) {
            pressed.current = false;
            press(false);
        }
    };

    const Tag: any = href ? Link : "button";
    const capProps = href
        ? {
              href,
              target,
              rel: target === "_blank" ? "noopener noreferrer" : undefined,
              "aria-disabled": disabled || undefined,
          }
        : { type, disabled };

    return (
        <div
            ref={scope}
            className={wrapperClassName}
            style={{
                position: "relative",
                display: fullWidth ? "flex" : "inline-flex",
                width: fullWidth ? "100%" : "fit-content",
                paddingBottom: DEPTH,
                verticalAlign: "middle",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: DEPTH,
                    left: 0,
                    transform: `translateY(${DEPTH}px)`,
                    borderRadius: 999,
                    backgroundColor: colors.base,
                    pointerEvents: "none",
                }}
            />
            <Tag
                {...capProps}
                ref={capRef}
                aria-label={ariaLabel}
                tabIndex={tabIndex}
                className={`tactile-button-cap ${className}`.trim()}
                onClick={onClick}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={() => {
                    if (disabled) return;
                    pressed.current = true;
                    press(true);
                }}
                onPointerUp={() => {
                    if (!pressed.current) return;
                    pressed.current = false;
                    press(false);
                }}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: fullWidth ? "100%" : "auto",
                    minHeight: size === "compact" ? 36 : 46,
                    padding: size === "compact" ? "8px 15px" : "12px 22px",
                    border: isSecondary
                        ? "1px solid #F2C1CF"
                        : "1px solid transparent",
                    borderRadius: 999,
                    backgroundColor: colors.fill,
                    color: colors.text,
                    boxShadow: isSecondary
                        ? "0 4px 12px rgba(185, 87, 118, 0.08)"
                        : "0 6px 16px rgba(185, 87, 118, 0.16)",
                    boxSizing: "border-box",
                    fontFamily: "var(--font-site, inherit)",
                    fontSize: size === "compact" ? 13 : 14,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textAlign: "center",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.6 : 1,
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {children}
            </Tag>
        </div>
    );
}
