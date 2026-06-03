// app.jsx — Sans Noise Home · Tweaks island
// Drives a few restrained controls by setting data-* attributes and CSS
// variables on <html>, keeping the page itself as plain semantic HTML.
const { useEffect } = React;

const SN_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "midblue",
  "fonts": "editorial",
  "density": "comfortable"
}/*EDITMODE-END*/;

const DENSITY_PAD = { compact: "72px", comfortable: "104px", spacious: "148px" };
const ACCENT_HEX = { midblue: "#2E5D9E", navy: "#1F3864" };

function SansNoiseTweaks() {
  const [t, setTweak] = useTweaks(SN_TWEAK_DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fonts = t.fonts;
    root.dataset.density = t.density;
    root.style.setProperty("--accent", ACCENT_HEX[t.accent] || ACCENT_HEX.midblue);
    root.style.setProperty("--sec-pad-y", DENSITY_PAD[t.density] || DENSITY_PAD.comfortable);
  }, [t.accent, t.fonts, t.density]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakRadio
        label="Emphasis color"
        value={t.accent}
        options={[
          { value: "midblue", label: "Mid blue" },
          { value: "navy", label: "Deep navy" },
        ]}
        onChange={(v) => setTweak("accent", v)}
      />

      <TweakSection label="Typography" />
      <TweakRadio
        label="Headline type"
        value={t.fonts}
        options={[
          { value: "editorial", label: "Editorial" },
          { value: "modern", label: "Modern" },
        ]}
        onChange={(v) => setTweak("fonts", v)}
      />

      <TweakSection label="Spacing" />
      <TweakRadio
        label="Density"
        value={t.density}
        options={[
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfortable" },
          { value: "spacious", label: "Spacious" },
        ]}
        onChange={(v) => setTweak("density", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<SansNoiseTweaks />);
