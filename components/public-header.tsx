"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowUpRight,
  HeartPulse,
  Leaf,
  Truck,
  ShieldCheck,
  BookOpen,
  CircleHelp,
  X,
  Menu,
} from "lucide-react";
import { Brand } from "./brand";
import { PremiumIcon } from "./premium-icon";
import { publicMenus } from "@/lib/public-content";

function MenuIcon({ name }: { name: string }) {
  if (name === "health") return <HeartPulse size={23} />;
  if (name === "nature") return <Leaf size={23} />;
  if (name === "ambulance") return <Truck size={23} />;
  if (name === "shield") return <ShieldCheck size={23} />;
  if (name === "guide") return <BookOpen size={23} />;
  if (name === "help") return <CircleHelp size={23} />;
  const asset = name === "pharmacy" ? "business" : name;
  if (
    ["business", "settings", "lock", "team", "profile", "message"].includes(
      asset,
    )
  )
    return (
      <PremiumIcon
        name={
          asset as
            "business" | "settings" | "lock" | "team" | "profile" | "message"
        }
        size={27}
      />
    );
  return <HeartPulse size={23} />;
}

export function PublicHeader() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const header = useRef<HTMLElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  function close() {
    setOpen(null);
    setMobile(false);
  }
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (open) {
        setOpen(null);
        triggers.current[open]?.focus();
      } else if (mobile) {
        setMobile(false);
        mobileTrigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, mobile]);
  return (
    <header
      className={`public-header ${mobile ? "public-menu-open" : ""}`}
      ref={header}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <a className="skip-link" href="#public-main">
        Skip to content
      </a>
      <div className="public-brand">
        <Brand />
        <span>Care. Cultivate. Connect.</span>
      </div>
      <button
        className="public-menu-toggle icon-button"
        ref={mobileTrigger}
        aria-label={
          mobile ? "Close public navigation" : "Open public navigation"
        }
        aria-expanded={mobile}
        aria-controls={`${id}-navigation`}
        onClick={() => {
          setMobile(!mobile);
          setOpen(null);
        }}
      >
        {mobile ? <X size={23} /> : <Menu size={23} />}
      </button>
      <nav
        id={`${id}-navigation`}
        className="public-navigation"
        aria-label="Public navigation"
      >
        <ul className="public-nav-groups">
          {publicMenus.map((menu) => (
            <li key={menu.id}>
              <button
                className="public-nav-trigger"
                ref={(node) => {
                  triggers.current[menu.id] = node;
                }}
                aria-expanded={open === menu.id}
                aria-controls={`${id}-${menu.id}`}
                onClick={() => setOpen(open === menu.id ? null : menu.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setOpen(menu.id);
                    requestAnimationFrame(() =>
                      document
                        .getElementById(`${id}-${menu.id}`)
                        ?.querySelector<HTMLAnchorElement>("a")
                        ?.focus(),
                    );
                  }
                }}
              >
                {menu.label}
                <PremiumIcon name="dropdown" size={11} />
              </button>
              <div
                id={`${id}-${menu.id}`}
                className="public-mega"
                hidden={open !== menu.id}
              >
                <div className="public-mega-story">
                  <span>{menu.eyebrow}</span>
                  <h2>{menu.title}</h2>
                  <p>{menu.description}</p>
                  <Link
                    href={
                      menu.id === "providers"
                        ? "/sign-up?account=business"
                        : "/explore"
                    }
                    onClick={close}
                  >
                    Explore Pinnaa <ArrowUpRight size={17} />
                  </Link>
                </div>
                <div className="public-mega-directory">
                  <div className="public-mega-heading">
                    <span>{menu.label}</span>
                    <button
                      className="icon-button"
                      aria-label={`Close ${menu.label} menu`}
                      onClick={() => {
                        setOpen(null);
                        triggers.current[menu.id]?.focus();
                      }}
                    >
                      <X size={19} />
                    </button>
                  </div>
                  {menu.links.map((link) => (
                    <Link
                      className="public-mega-link"
                      href={link.href}
                      key={link.title}
                      onClick={close}
                    >
                      <span className="public-mega-icon">
                        <MenuIcon name={link.icon} />
                      </span>
                      <span>
                        <strong>{link.title}</strong>
                        <small>{link.detail}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="public-nav-actions">
          <Link className="public-signin" href="/sign-in" onClick={close}>
            Sign in
          </Link>
          <Link className="button primary" href="/sign-up" onClick={close}>
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
