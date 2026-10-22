import { interactiveAppearance } from "../../src/scene/appearance.mjs";
import { INTERACTIVE_STYLES, INTERACTIVE_THEMES } from "../../src/edition/appearance.mjs";

const palettes = {
  "signal-flow": {
    light: {
      paper: "#f4f9fc",
      panel: "#ffffff",
      ink: "#102638",
      muted: "#587287",
      rule: "#bfd5e2",
      line: "#7b97aa",
      accent: "#0f766e",
      onAccent: "#ffffff",
      soft: "#e8f3f8",
      cool: "#0789a1",
      control: "#7254c7",
      warm: "#b9670b",
      alert: "#c53a59",
    },
    dark: {
      paper: "#030711",
      panel: "#07101e",
      ink: "#f5fbff",
      muted: "#9eb0c7",
      rule: "#1d3350",
      line: "#7890ad",
      accent: "#2dd4bf",
      onAccent: "#030711",
      soft: "#091628",
      cool: "#67e8f9",
      control: "#c4b5fd",
      warm: "#fcd34d",
      alert: "#fda4af",
    },
  },
  editorial: {
    light: {
      paper: "#f5f3ed",
      panel: "#fffefa",
      ink: "#21332a",
      muted: "#526158",
      rule: "#c4ccc2",
      line: "#60786a",
      accent: "#365b49",
      onAccent: "#fffefa",
      soft: "#e7eee6",
      cool: "#356276",
      control: "#65587a",
      warm: "#805c33",
      alert: "#904d55",
    },
    dark: {
      paper: "#191d19",
      panel: "#232a24",
      ink: "#edf1e9",
      muted: "#b4bfb4",
      rule: "#4b594e",
      line: "#9eafa2",
      accent: "#9dbea7",
      onAccent: "#191d19",
      soft: "#2f3b31",
      cool: "#9cc0d0",
      control: "#b5a6cd",
      warm: "#d2b48c",
      alert: "#d8a3ae",
    },
  },
  blueprint: {
    light: {
      paper: "#edf3f6",
      panel: "#fbfdfe",
      ink: "#172d39",
      muted: "#4b6472",
      rule: "#bfced6",
      line: "#557581",
      accent: "#24576e",
      onAccent: "#fbfdfe",
      soft: "#dfeaf0",
      cool: "#216784",
      control: "#625b7e",
      warm: "#7a5d34",
      alert: "#8d505b",
    },
    dark: {
      paper: "#101d26",
      panel: "#1a2b35",
      ink: "#e4f0f5",
      muted: "#a6bcc8",
      rule: "#48616f",
      line: "#93b0c0",
      accent: "#98c5dc",
      onAccent: "#101d26",
      soft: "#253e4b",
      cool: "#9ccce0",
      control: "#b8b0d8",
      warm: "#d5ba91",
      alert: "#d9a6b5",
    },
  },
  classic: {
    light: {
      paper: "#f7f8f9",
      panel: "#ffffff",
      ink: "#1f2428",
      muted: "#505b64",
      rule: "#c7cdd2",
      line: "#65727a",
      accent: "#3c596b",
      onAccent: "#ffffff",
      soft: "#e8edf0",
      cool: "#3e6577",
      control: "#655e7a",
      warm: "#7c623b",
      alert: "#8c525b",
    },
    dark: {
      paper: "#15181b",
      panel: "#20252a",
      ink: "#edf0f2",
      muted: "#adb7be",
      rule: "#4f5c65",
      line: "#8d99a2",
      accent: "#a7bed0",
      onAccent: "#15181b",
      soft: "#2b343c",
      cool: "#a5c5d5",
      control: "#beb3d2",
      warm: "#cfb992",
      alert: "#d4a9b1",
    },
  },
};

/** Shared paint only: no typography, dimensions, routes or camera ownership. */
export function interactiveAppearanceCss() {
  return (
    INTERACTIVE_STYLES.flatMap((style) =>
      INTERACTIVE_THEMES.map((theme) => {
        const tokens = Object.entries(palettes[style][theme])
          .map(([name, color]) => `--reader-${name}:${color}`)
          .join(";");
        return `html[data-style="${style}"][data-theme="${theme}"]{color-scheme:${theme};${tokens};
      --paper:var(--reader-paper);--panel:var(--reader-panel);--ink:var(--reader-ink);--muted:var(--reader-muted);--rule:var(--reader-rule);--accent:var(--reader-accent);
      --bg:var(--reader-paper);--text:var(--reader-ink);--text-muted:var(--reader-muted);--text-dim:var(--reader-muted);--text-faint:var(--reader-muted);--mask:var(--reader-panel);
      --grid:var(--reader-rule);--panel-border:var(--reader-rule);--lane-fill:var(--reader-soft);--lane-stroke:var(--reader-line);--arrow:var(--reader-line);--arrow-emphasis:var(--reader-accent);
      --frontend-fill:var(--reader-soft);--frontend-stroke:var(--reader-cool);--backend-fill:var(--reader-soft);--backend-stroke:var(--reader-accent);
      --database-fill:var(--reader-soft);--database-stroke:var(--reader-control);--cloud-fill:var(--reader-soft);--cloud-stroke:var(--reader-warm);
      --security-fill:var(--reader-soft);--security-stroke:var(--reader-alert);--messagebus-fill:var(--reader-soft);--messagebus-stroke:var(--reader-warm);--external-fill:var(--reader-soft);--external-stroke:var(--reader-line)} `;
      }),
    ).join("\n") +
    `
    .reader-appearance{display:flex;align-items:center;gap:.6rem;color:var(--reader-muted)}
    .reader-appearance label{display:flex;align-items:center;gap:.35rem;font:500 .7rem/1.3 system-ui,sans-serif}
    .reader-appearance select{border:1px solid var(--reader-rule);border-radius:.35rem;background:var(--reader-panel);color:var(--reader-ink);font:500 .72rem/1.3 system-ui,sans-serif;padding:.38rem .45rem}
    .reader-appearance select:focus-visible{outline:2px solid var(--reader-accent);outline-offset:2px}
  `
  );
}

export function interactiveAppearanceControls(value) {
  const selected = interactiveAppearance(value);
  const control = (name, choices) =>
    `<label for="interactive-${name}"><span>${name[0].toUpperCase() + name.slice(1)}</span><select id="interactive-${name}">${choices.map((choice) => `<option value="${choice}"${choice === selected[name] ? " selected" : ""}>${choice[0].toUpperCase() + choice.slice(1)}</option>`).join("")}</select></label>`;
  return `<div class="reader-appearance" aria-label="Diagram appearance">${control("style", INTERACTIVE_STYLES)}${control("theme", INTERACTIVE_THEMES)}</div>`;
}

/** A closed classic script: appearance changes neither input nor acceptance. */
export function interactiveAppearanceScript() {
  return `(() => {
    'use strict';
    const root = document.documentElement;
    const styles = ${JSON.stringify(INTERACTIVE_STYLES)};
    const themes = ${JSON.stringify(INTERACTIVE_THEMES)};
    const style = document.getElementById('interactive-style');
    const theme = document.getElementById('interactive-theme');
    const currentFrame = () => document.getElementById('interactive-frame');
    const native = !!(window.Archify && window.Archify.preset);
    const nativeTokens = {paper:'--bg',panel:'--mask',ink:'--text',muted:'--text-muted',rule:'--panel-border',line:'--arrow',accent:'--arrow-emphasis',onAccent:'--bg',soft:'--lane-fill',cool:'--frontend-stroke',control:'--database-stroke',warm:'--cloud-stroke',alert:'--security-stroke'};
    const send = () => {
      const frame = currentFrame();
      if (frame && frame.contentWindow) frame.contentWindow.postMessage({
        type:'architecture-interactive:appearance', page:frame.dataset.page,
        style:root.dataset.style, theme:root.dataset.theme
      }, '*');
    };
    const apply = (nextStyle, nextTheme) => {
      if (!styles.includes(nextStyle) || !themes.includes(nextTheme)) return;
      if (native) {
        window.Archify.preset.apply(nextStyle);
        if (root.dataset.theme !== nextTheme) window.Archify.theme.toggle();
      }
      root.dataset.style = nextStyle; root.dataset.theme = nextTheme;
      if (style) style.value = nextStyle;
      if (theme) theme.value = nextTheme;
      send();
    };
    const reflectNative = () => {
      if (!native) return;
      const current = window.Archify.preset.current();
      if (!styles.includes(current) || !themes.includes(root.dataset.theme)) return;
      root.dataset.style = current;
      if (root.dataset.interactiveMember) {
        const url = new URL(location.href);
        url.searchParams.set('theme', root.dataset.theme);
        history.replaceState(null, '', url.href);
      }
      const computed = getComputedStyle(root);
      const palette = Object.fromEntries(Object.entries(nativeTokens).map(([name, token]) => [name,computed.getPropertyValue(token).trim()]));
      parent.postMessage({type:'architecture-interactive:native-appearance',page:root.dataset.interactiveMember,style:current,theme:root.dataset.theme,palette}, '*');
    };
    if (style) style.addEventListener('change', () => apply(style.value, root.dataset.theme));
    if (theme) theme.addEventListener('change', () => apply(root.dataset.style, theme.value));
    if (style || theme) document.addEventListener('load', event => {
      if (event.target === currentFrame()) send();
    }, true);
    window.addEventListener('message', event => {
      const frame = currentFrame();
      const message = event.data;
      if (frame && event.source === frame.contentWindow && message && message.type === 'architecture-interactive:native-appearance' && message.page === frame.dataset.page) {
        if (!styles.includes(message.style) || !themes.includes(message.theme)) return;
        const palette = message.palette;
        if (!palette || Object.keys(palette).length !== Object.keys(nativeTokens).length ||
            Object.keys(nativeTokens).some(name => typeof palette[name] !== 'string' || palette[name].length > 80 || !/^(?:#[\\da-f]{3,8}|rgba?\\([\\d.,%\\s]+\\))$/i.test(palette[name]) || !CSS.supports('color',palette[name]))) return;
        root.dataset.style = message.style; root.dataset.theme = message.theme;
        for (const [name, value] of Object.entries(palette)) root.style.setProperty('--reader-'+name,value);
        return;
      }
      if (event.source !== parent || !message || message.type !== 'architecture-interactive:appearance' ||
          message.page !== root.dataset.interactiveMember) return;
      apply(message.style, message.theme);
    });
    if (native) {
      const initialStyle = root.dataset.appearanceStyle;
      const initialTheme = root.dataset.appearanceTheme;
      apply(initialStyle, initialTheme);
      new MutationObserver(reflectNative).observe(root,{attributes:true,attributeFilter:['data-preset','data-theme']});
      reflectNative();
    }
  })();`;
}
