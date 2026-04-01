const W = "#ffffff";
const P = "#ff8fb0";
const D = "#111111";
const B = "#ffb8cc";
const Y = "#ffe84a";
const G = "#aaaaaa";
const R = "#d43224";
const N = "#5cb85c";
const _ = "transparent";
const S = "rgba(180,180,180,0.60)";  // shadow



// ── Bunny 11 × 15 ──────────────────────────────────────────────
const BUNNY: string[][] = [
  [_,W,W,_,_,_,_,_,W,W,_],
  [W,W,W,_,_,_,_,_,W,W,W],
  [W,P,W,_,_,_,_,_,W,P,W],
  [W,P,W,_,_,_,_,_,W,P,W],
  [W,W,W,W,W,W,W,W,W,W,W],
  [W,W,W,W,W,W,W,W,W,W,W],
  [W,W,D,W,W,W,W,W,D,W,W],
  [W,W,W,W,W,W,W,W,W,W,W],
  [W,W,B,W,W,W,W,W,B,W,W],
  [W,W,W,W,P,P,P,W,W,W,W],
  [W,W,W,W,W,W,W,W,W,W,W],
  [_,W,W,W,W,W,W,W,W,W,_],
  [_,_,W,W,W,W,W,W,W,_,_],
  [_,_,W,W,_,_,_,W,W,_,_],
  [_,_,W,W,_,_,_,W,W,_,_],
];

// ── Frog 11 × 13 ───────────────────────────────────────────────
const FROG: string[][] = [
  [_,_,N,N,_,_,_,_,N,N,_],
  [_,N,N,N,_,_,_,N,N,N,_],
  [_,N,D,N,_,_,_,N,D,N,_],
  [N,N,N,N,N,N,N,N,N,N,N],
  [N,N,N,N,N,N,N,N,N,N,N],
  [N,N,W,W,W,W,W,W,W,N,N],
  [N,N,W,W,W,W,W,W,W,N,N],
  [N,N,W,W,P,P,P,W,W,N,N],
  [N,N,N,N,N,N,N,N,N,N,N],
  [N,N,N,N,N,N,N,N,N,N,N],
  [_,N,N,N,_,_,_,N,N,N,_],
  [_,N,N,_,_,_,_,_,N,N,_],
  [_,_,_,_,_,_,_,_,_,_,_],
];


// ── Pacman 11 × 11 ─────────────────────────────────────────────
const PACMAN: string[][] = [
  [_,_,_,Y,Y,Y,Y,Y,_,_,_],
  [_,_,Y,Y,Y,Y,Y,Y,Y,_,_],
  [_,Y,Y,Y,Y,Y,Y,Y,Y,Y,_],
  [Y,Y,Y,D,Y,Y,Y,Y,Y,Y,_],
  [Y,Y,Y,Y,Y,Y,Y,Y,_,_,_],
  [Y,Y,Y,Y,Y,Y,_,_,_,_,_],
  [Y,Y,Y,Y,Y,Y,Y,Y,_,_,_],
  [Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,_],
  [_,Y,Y,Y,Y,Y,Y,Y,Y,Y,_],
  [_,_,Y,Y,Y,Y,Y,Y,Y,_,_],
  [_,_,_,Y,Y,Y,Y,Y,_,_,_],
];

// ── Heart 9 × 7 ────────────────────────────────────────────────
const HEART: string[][] = [
  [_,P,P,P,_,P,P,P,_],
  [P,P,P,P,P,P,P,P,P],
  [P,P,P,P,P,P,P,P,P],
  [P,P,P,P,P,P,P,P,P],
  [_,P,P,P,P,P,P,P,_],
  [_,_,P,P,P,P,P,_,_],
  [_,_,_,P,P,P,_,_,_],
  [_,_,_,_,P,_,_,_,_],
];
const BUBBLE: string[][] = [
  [_,B,B,B,B,B,B,B,B,B,B,B,B,B,_],
  [B,W,W,W,W,W,W,W,W,W,W,W,W,W,B],
  [B,W,B,W,B,B,W,B,W,B,B,W,B,W,B],
  [B,W,B,W,B,W,W,B,W,B,W,W,B,W,B],
  [B,W,B,W,B,B,W,B,W,B,W,W,B,B,B],
  [B,W,B,W,B,W,W,B,W,B,W,W,W,W,B],
  [B,W,B,B,B,B,W,B,B,B,B,W,B,B,B],
  [B,W,W,W,W,W,W,W,W,W,W,W,W,W,B],
  [_,B,B,B,W,W,W,W,W,W,W,B,B,B,_],
  [_,_,_,B,W,W,W,W,W,W,B,_,_,_,_],
  [_,_,_,_,B,B,_,_,_,_,_,_,_,_,_],
];

const GRIDS: Record<string, string[][]> = {
  bunny: BUNNY,
  frog: FROG,
  pacman: PACMAN,
  heart: HEART,
  bubble: BUBBLE,

};

interface PixelSpriteProps {
  type: "bunny" | "frog" | "pacman" | "heart" |"bubble";
  size?: number;
  flip?: boolean;
  className?: string;
  animate?: boolean;
}

export function PixelSprite({
  type,
  size = 4,
  flip = false,
  className = "",
  animate = true,
}: PixelSpriteProps) {
  const grid = GRIDS[type];
  const px = size;

  return (
    <div
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{ transform: flip ? "scaleX(-1)" : undefined, imageRendering: "pixelated" }}
    >
      {grid.map((row, ri) => (
        <div key={ri} style={{ display: "flex" }}>
          {row.map((color, ci) => (
            <div
              key={ci}
              style={{
                width: px,
                height: px,
                backgroundColor: color,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
