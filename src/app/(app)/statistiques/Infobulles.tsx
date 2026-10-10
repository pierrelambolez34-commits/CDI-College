"use client";
import { useEffect, useRef } from "react";

/** Affiche le texte de l'attribut data-tip au survol (souris) ou au focus (clavier). */
export default function Infobulles() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tip = ref.current!;
    const montrer = (el: HTMLElement, x: number, y: number) => {
      tip.textContent = el.dataset.tip ?? "";
      tip.hidden = false;
      const r = tip.getBoundingClientRect();
      let l = x + 14, t = y + 14;
      if (l + r.width > innerWidth - 8) l = x - r.width - 14;
      if (t + r.height > innerHeight - 8) t = y - r.height - 14;
      tip.style.left = `${Math.max(8, l)}px`; tip.style.top = `${Math.max(8, t)}px`;
    };
    const bouge = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");
      if (el) montrer(el, e.clientX, e.clientY); else tip.hidden = true;
    };
    const focus = (e: FocusEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tip]");
      if (el) { const r = el.getBoundingClientRect(); montrer(el, r.left + r.width / 2, r.bottom); }
    };
    const cacher = () => { tip.hidden = true; };
    document.addEventListener("mousemove", bouge);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", cacher);
    return () => { document.removeEventListener("mousemove", bouge); document.removeEventListener("focusin", focus); document.removeEventListener("focusout", cacher); };
  }, []);
  return <div ref={ref} className="tip" hidden role="tooltip" />;
}
