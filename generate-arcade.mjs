import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const isDemo = args.includes("--demo");
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0
  ? args[outIndex + 1]
  : "assets/contribution-arcade.svg";

if (!outputPath) {
  throw new Error("--out must be followed by a file path");
}

const username = process.env.GITHUB_USERNAME || "YOUR-USERNAME";
const token = process.env.GITHUB_TOKEN;

const FONT = {
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  "W": ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};

const PALETTE = {
  NONE: "#2b1827",
  FIRST_QUARTILE: "#5b2347",
  SECOND_QUARTILE: "#913467",
  THIRD_QUARTILE: "#d55398",
  FOURTH_QUARTILE: "#ff7fbe",
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function measurePixelText(text, scale, spacing = 1) {
  const normalized = text.toUpperCase();
  if (!normalized.length) return 0;
  return normalized.length * (5 * scale + spacing * scale) - spacing * scale;
}

function pixelText(text, x, y, scale, color, options = {}) {
  const normalized = text.toUpperCase();
  const spacing = options.spacing ?? 1;
  const opacity = options.opacity ?? 1;
  const className = options.className ? ` class="${options.className}"` : "";
  const rects = [];
  let cursor = x;

  for (const character of normalized) {
    const glyph = FONT[character] || FONT[" "];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === "1") {
          rects.push(
            `<rect x="${cursor + columnIndex * scale}" y="${y + rowIndex * scale}" width="${scale}" height="${scale}" rx="${Math.max(0, scale * 0.08)}"/>`,
          );
        }
      });
    });
    cursor += 5 * scale + spacing * scale;
  }

  return `<g${className} fill="${color}" opacity="${opacity}" aria-label="${escapeXml(text)}">${rects.join("")}</g>`;
}

function hashSeed(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seededRandom(seedText) {
  let state = hashSeed(seedText) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function contributionLevel(count) {
  if (count <= 0) return "NONE";
  if (count <= 2) return "FIRST_QUARTILE";
  if (count <= 5) return "SECOND_QUARTILE";
  if (count <= 9) return "THIRD_QUARTILE";
  return "FOURTH_QUARTILE";
}

function createDemoWeeks() {
  const random = seededRandom("pink-contribution-arcade-demo");
  const today = new Date();
  const lastSunday = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() - today.getUTCDay(),
  ));
  const firstSunday = new Date(lastSunday);
  firstSunday.setUTCDate(firstSunday.getUTCDate() - 52 * 7);

  const weeks = [];
  for (let weekIndex = 0; weekIndex < 53; weekIndex += 1) {
    const days = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(firstSunday);
      date.setUTCDate(firstSunday.getUTCDate() + weekIndex * 7 + weekday);
      const active = random() > 0.64;
      const count = active ? 1 + Math.floor(random() * 13) : 0;
      days.push({
        date: date.toISOString().slice(0, 10),
        contributionCount: count,
        contributionLevel: contributionLevel(count),
        weekday,
      });
    }
    weeks.push({ contributionDays: days });
  }

  const demoLastWeek = [2, 5, 3, 6, 1, 4, 3];
  weeks.at(-1).contributionDays.forEach((day, index) => {
    day.contributionCount = demoLastWeek[index];
    day.contributionLevel = contributionLevel(demoLastWeek[index]);
  });

  return weeks;
}

async function fetchContributionWeeks() {
  if (!token) {
    throw new Error("GITHUB_TOKEN is required unless --demo is used");
  }

  const query = `
    query ContributionArcade($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
                weekday
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "pink-contribution-arcade",
    },
    body: JSON.stringify({
      query,
      variables: {
        login: username,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  const weeks = payload.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
  if (!weeks) {
    throw new Error(`No contribution calendar was returned for ${username}`);
  }

  return weeks.slice(-53);
}

function lastSevenDayCount(weeks) {
  return weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .reduce((total, day) => total + day.contributionCount, 0);
}

function renderStars(seedText) {
  const random = seededRandom(seedText);
  const stars = [];
  for (let index = 0; index < 72; index += 1) {
    const x = 45 + Math.floor(random() * 1005);
    const y = 102 + Math.floor(random() * 202);
    const size = random() > 0.84 ? 2 : 1;
    const delay = (random() * 3.5).toFixed(2);
    const duration = (2.3 + random() * 3.2).toFixed(2);
    stars.push(
      `<rect class="star" x="${x}" y="${y}" width="${size}" height="${size}" fill="#ffd8eb" style="animation-delay:-${delay}s;animation-duration:${duration}s"/>`,
    );
  }
  return stars.join("");
}

function renderContributionGrid(weeks) {
  const startX = 48;
  const startY = 126;
  const cell = 10;
  const gap = 3;
  const cells = [];

  weeks.slice(-53).forEach((week, weekIndex) => {
    week.contributionDays.forEach((day) => {
      const x = startX + weekIndex * (cell + gap);
      const y = startY + day.weekday * (cell + gap);
      const level = PALETTE[day.contributionLevel] ? day.contributionLevel : contributionLevel(day.contributionCount);
      const color = PALETTE[level];
      const activeClass = day.contributionCount > 0 ? " contribution active" : " contribution";
      const delay = ((weekIndex * 7 + day.weekday) % 31) / 10;
      cells.push(
        `<rect class="${activeClass.trim()}" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${color}" data-date="${escapeXml(day.date)}" data-count="${day.contributionCount}" style="animation-delay:-${delay}s"/>`,
      );
    });
  });

  return cells.join("");
}

function pixelHeart(x, y, scale, className) {
  const pixels = [
    [1, 0], [2, 0], [4, 0], [5, 0],
    [0, 1], [3, 1], [6, 1],
    [0, 2], [6, 2],
    [1, 3], [5, 3],
    [2, 4], [4, 4],
    [3, 5],
  ];
  return `<g class="${className}" fill="#ff8fc8">${pixels.map(([px, py]) => `<rect x="${x + px * scale}" y="${y + py * scale}" width="${scale}" height="${scale}"/>`).join("")}</g>`;
}

function renderMascot() {
  return `
    <g class="player" aria-label="Cute pixel spaceship firing heart projectiles">
      ${pixelHeart(527, 247, 2, "heart heart-one")}
      ${pixelHeart(541, 247, 2, "heart heart-two")}
      ${pixelHeart(555, 247, 2, "heart heart-three")}

      <g class="ship" shape-rendering="crispEdges">
        <rect x="539" y="275" width="6" height="6" fill="#ff79ba"/>
        <rect x="533" y="281" width="18" height="6" fill="#ff79ba"/>
        <rect x="527" y="287" width="30" height="12" fill="#d94d9b"/>
        <rect x="521" y="293" width="12" height="12" fill="#ff79ba"/>
        <rect x="551" y="293" width="12" height="12" fill="#ff79ba"/>
        <rect x="533" y="281" width="18" height="18" fill="#fff4fa"/>
        <rect x="533" y="281" width="6" height="6" fill="#ffd4e8"/>
        <rect x="545" y="281" width="6" height="6" fill="#ffd4e8"/>
        <rect x="536" y="287" width="4" height="4" fill="#241321"/>
        <rect x="544" y="287" width="4" height="4" fill="#241321"/>
        <rect x="540" y="293" width="4" height="3" fill="#d94d9b"/>
        <rect x="533" y="299" width="6" height="6" fill="#ff79ba"/>
        <rect x="545" y="299" width="6" height="6" fill="#ff79ba"/>
      </g>
    </g>
  `;
}

function renderSvg(weeks, weeklyCount) {
  const width = 1100;
  const height = 360;
  const title = "CONTRIBUTION ARCADE";
  const liveText = "LIVE SIGNAL / ONLINE";
  const cardTitle = "WEEKLY RUN";
  const cardSubtitle = "CONTRIBUTIONS / LAST 7 DAYS";
  const countText = String(weeklyCount);

  const liveWidth = measurePixelText(liveText, 1.5);
  const countScale = countText.length >= 4 ? 4 : countText.length === 3 ? 5 : 6;
  const countWidth = measurePixelText(countText, countScale);
  const cardX = 815;
  const cardWidth = 235;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Pink contribution arcade for ${escapeXml(username)}</title>
  <desc id="description">An animated pink pixel arcade showing ${weeklyCount} contributions during the last seven days.</desc>

  <defs>
    <filter id="pink-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ff9dcc" opacity="0.025"/>
    </pattern>
  </defs>

  <style>
    .star { animation: twinkle 3s steps(2, end) infinite; }
    .active { animation: cell-pulse 3.4s ease-in-out infinite; }
    .status-light { animation: status-pulse 1.8s ease-in-out infinite; }
    .player { animation: drift 10s ease-in-out infinite; transform-origin: center; }
    .heart { opacity: 0; }
    .heart-one { animation: shoot 2.4s linear infinite; }
    .heart-two { animation: shoot 2.4s linear -0.8s infinite; }
    .heart-three { animation: shoot 2.4s linear -1.6s infinite; }

    @keyframes twinkle {
      0%, 100% { opacity: 0.22; }
      50% { opacity: 1; }
    }
    @keyframes cell-pulse {
      0%, 100% { opacity: 0.72; }
      50% { opacity: 1; }
    }
    @keyframes status-pulse {
      0%, 100% { opacity: 0.45; }
      50% { opacity: 1; }
    }
    @keyframes drift {
      0%, 100% { transform: translateX(-105px); }
      50% { transform: translateX(105px); }
    }
    @keyframes shoot {
      0% { transform: translateY(24px); opacity: 0; }
      12% { opacity: 1; }
      82% { opacity: 1; }
      100% { transform: translateY(-135px); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .star, .active, .status-light, .player, .heart { animation: none; }
      .heart { opacity: 1; }
    }
  </style>

  <rect width="${width}" height="${height}" rx="22" fill="#0b080d"/>
  <rect x="8" y="8" width="1084" height="344" rx="20" fill="#120d18" stroke="#ff67ad" stroke-width="2" filter="url(#pink-glow)"/>
  <rect x="9" y="9" width="1082" height="342" rx="19" fill="url(#scanlines)"/>

  ${pixelText(title, 30, 31, 2, "#ff70b7")}
  <rect class="status-light" x="${1026 - liveWidth}" y="34" width="8" height="8" rx="2" fill="#ff8fc8" filter="url(#pink-glow)"/>
  ${pixelText(liveText, 1040 - liveWidth, 32, 1.5, "#ff9dce", { opacity: 0.9 })}

  <rect x="28" y="86" width="1044" height="238" rx="14" fill="#0e0911" stroke="#ff70b7" stroke-width="1" opacity="0.98"/>
  <rect x="29" y="87" width="1042" height="236" rx="13" fill="url(#scanlines)"/>
  ${renderStars(`${username}-${new Date().getUTCFullYear()}`)}

  <g aria-label="GitHub contribution grid">
    ${renderContributionGrid(weeks)}
  </g>

  ${renderMascot()}

  <g aria-label="Weekly contribution count">
    <rect x="${cardX}" y="150" width="${cardWidth}" height="150" rx="10" fill="#160d18" stroke="#ff70b7" stroke-width="1.5"/>
    ${pixelText(cardTitle, cardX + 22, 170, 2, "#ff70b7")}
    ${pixelText(countText, cardX + (cardWidth - countWidth) / 2, 207, countScale, "#ff79ba")}
    ${pixelText(cardSubtitle, cardX + 17, 274, 1, "#ffd4e8", { opacity: 0.92 })}
  </g>
</svg>`;
}

const weeks = isDemo ? createDemoWeeks() : await fetchContributionWeeks();
const weeklyCount = lastSevenDayCount(weeks);
const svg = renderSvg(weeks, weeklyCount);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, svg, "utf8");
console.log(`Generated ${outputPath} with a last-7-days count of ${weeklyCount}`);
