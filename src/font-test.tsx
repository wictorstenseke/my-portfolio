export function FontTest() {
  const fonts = [
    { name: "Fugaz One" },
    { name: "Barlow" },
    { name: "Fredoka" },
    { name: "Titan One" },
  ];

  return (
    <div class="font-test">
      {fonts.map((font, i) => (
        <div class="font-card" style={{ animationDelay: `${i * 0.1}s` }}>
          <span class="font-label">{i + 1}. {font.name}</span>
          <p
            class="font-preview"
            style={{ fontFamily: `"${font.name}", sans-serif` }}
          >
            Wictor Stenseke
          </p>
          <p
            class="font-preview uppercase"
            style={{ fontFamily: `"${font.name}", sans-serif` }}
          >
            Wictor Stenseke
          </p>
        </div>
      ))}
    </div>
  );
}
