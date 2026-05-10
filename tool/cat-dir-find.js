#!/usr/bin/env deno run -S --allow-read
// cat-dir-find.js: 从已打包的 cat-dir 文件中, 输出 find 文件列表
// 用法: deno run --allow-read cat-dir-find.js 打包文件.txt

if (Deno.args.length !== 1) {
  console.error("Usage: cat-dir-find.js packed_file.txt");
  Deno.exit(1);
}

const filePath = Deno.args[0];
let text;
try {
  text = await Deno.readTextFile(filePath);
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  Deno.exit(1);
}

const lines = text.split(/\r?\n/);

let boundary = null;
const paths = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 检测开始边界 --XXX
  if (line.startsWith("--")) {
    if (!boundary) {
      // 边界字符串
      boundary = line;
    }
    // 下一行应该是 "> cat 文件路径"
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const match = nextLine.match(/^> cat (.+)$/);
      if (match) {
        paths.push(match[1]);
        // 跳过 cat 行
        i += 1;
      }
    }
  } else if ((boundary + "--") == line) {
    // 遇到结束边界 --XXX-- 可提前终止
    break;
  }
}

if (!boundary) {
  console.error("Error: no valid boundary found in the file");
  Deno.exit(1);
}

// 按要求的格式输出
console.log(boundary);
console.log("> find . -type f");

for (const p of paths) {
  console.log(p);
}
