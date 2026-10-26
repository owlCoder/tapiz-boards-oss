import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

export async function buildDemo() {
  const out = resolve("dist-pages");
  await rm(out, { recursive: true, force: true });
  await mkdir(`${out}/assets`, { recursive: true });
  const result = await build({
    entryPoints: ["pages-demo/main.tsx"],
    bundle: true,
    minify: true,
    platform: "browser",
    format: "esm",
    target: "es2020",
    outdir: `${out}/assets`,
    entryNames: "[name]-[hash]",
    assetNames: "[name]-[hash]",
    metafile: true,
    loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
    define: {
      "process.env.NODE_ENV": '"production"',
      "process.env.NEXT_PUBLIC_BROWSER_DEMO": '"true"',
      "process.env.NEXT_PUBLIC_APP_VERSION": '"0.1.0-demo"',
      "process.env.NEXT_PUBLIC_BUILD_DATE": JSON.stringify(
        new Date().toISOString(),
      ),
    },
    alias: {
      "@": resolve("src"),
      "next/link": resolve("pages-demo/runtime/link.tsx"),
      "next/navigation": resolve("pages-demo/runtime/navigation.ts"),
      "next/dynamic": resolve("pages-demo/runtime/dynamic.tsx"),
    },
    plugins: [
      {
        name: "browser-only-boundary",
        setup(b) {
          b.onResolve({ filter: /^@\/i18n\/server$/ }, () => ({
            path: resolve("pages-demo/runtime/i18n-server.ts"),
          }));
          b.onLoad(
            {
              filter:
                /\(public\)\/(changelog|privacy-policy|terms-of-service)\/page\.tsx$/,
            },
            async (args) => ({
              contents: (await readFile(args.path, "utf8"))
                .replace(
                  "export default async function",
                  "export default function",
                )
                .replace("await getDict()", "getDict()"),
              loader: "tsx",
            }),
          );
          b.onResolve({ filter: /^@\/lib\/actions\// }, () => ({
            path: resolve("pages-demo/runtime/actions.ts"),
          }));
          b.onLoad(
            { filter: /(?:LanguageSwitcher|LocaleSelector)\.tsx$/ },
            async (args) => {
              let contents = await readFile(args.path, "utf8");
              const cookie =
                "document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;";
              if (!contents.includes(cookie))
                throw new Error("Locale adapter no longer matches OSS source");
              contents = contents.replace(
                cookie,
                'localStorage.setItem("tapiz-demo-locale", value);',
              );
              return { contents, loader: "tsx" };
            },
          );
          b.onResolve(
            {
              filter:
                /^(node:|next\/headers|next\/cache|mysql2|drizzle-orm|next-auth)/,
            },
            (args) => {
              throw new Error(
                `Server dependency reached the demo: ${args.path}`,
              );
            },
          );
        },
      },
    ],
  });
  const forbidden = Object.keys(result.metafile.inputs).filter((x) =>
    /src\/(infrastructure|application)\/|src\/lib\/(actions|auth|guards)/.test(
      x,
    ),
  );
  if (forbidden.length)
    throw new Error(`Server modules in browser build: ${forbidden.join(", ")}`);
  const css = await postcss([
    tailwind({ base: process.cwd(), optimize: { minify: true } }),
  ]).process(await readFile("src/app/globals.css", "utf8"), {
    from: resolve("src/app/globals.css"),
  });
  const cssName = `oss-${createHash("sha256").update(css.css).digest("hex").slice(0, 12)}.css`;
  await writeFile(`${out}/assets/${cssName}`, css.css);
  const files = await readdir(`${out}/assets`);
  const js = files.find((x) => /^main-.*\.js$/.test(x));
  const fonts = files.find((x) => /^main-.*\.css$/.test(x));
  if (!js || !fonts) throw new Error("Missing browser build assets");
  let html = await readFile("pages-demo/index.html", "utf8");
  html = html
    .replace(
      "<!-- BUILD_STYLES -->",
      `<link rel="stylesheet" href="./assets/${fonts}"><link rel="stylesheet" href="./assets/${cssName}">`,
    )
    .replace(
      "<!-- BUILD_SCRIPT -->",
      `<script type="module" src="./assets/${js}"></script>`,
    );
  await writeFile(`${out}/index.html`, html);
  await writeFile(`${out}/.nojekyll`, "");
  const version = createHash("sha256").update(html).digest("hex").slice(0, 12);
  const assets = ["./", "./index.html", ...files.map((x) => `./assets/${x}`)];
  await writeFile(
    `${out}/sw.js`,
    `const CACHE='tapiz-demo-${version}';const ASSETS=${JSON.stringify(assets)};\nself.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));\nself.addEventListener('message',e=>{if(e.data==='ACTIVATE')self.skipWaiting()});\nself.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tapiz-demo-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match('./index.html'))));return}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))});`,
  );
  await writeFile(
    `${out}/build-meta.json`,
    JSON.stringify(
      { version, inputs: Object.keys(result.metafile.inputs) },
      null,
      2,
    ),
  );
  console.log(
    `Built browser demo (${version}): original OSS views, local actions, ${files.length} assets.`,
  );
}
if (process.argv[1] === new URL(import.meta.url).pathname) await buildDemo();
