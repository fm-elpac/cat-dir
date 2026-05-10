// cat-sort.js: 输入 打包后的内容文件, find 列表文件, 根据列表 顺序, 重新输出 内容 (排序 / 部分提取 功能)
// 用法: deno run --allow-read cat-sort.js 文件1 文件2

// 异步读取文件并按行分割, 去除末尾纯空行
async function readFileLines(path) {
  let text;
  try {
    text = await Deno.readTextFile(path);
  } catch (err) {
    console.error(`错误: 无法读取文件 ${path}  (${err.message})`);
    Deno.exit(1);
  }
  const lines = text.split(/\r?\n/);
  // 去掉末尾的空行 (只去掉空字符串)
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

// 判断文件类型: "dir" | "cat" | null
function detectFileType(lines) {
  if (lines.length < 2) return null;
  if (!lines[0].startsWith("--")) return null;
  if (!lines[1].startsWith(">")) return null;
  if (lines[1].startsWith("> find")) return "dir";
  if (lines[1].startsWith("> cat")) return "cat";
  return null;
}

/**
 * 解析目录文件
 * @returns {{ paths: string[], boundary: string }}
 */
function parseDirFile(lines) {
  const B = lines[0];
  // 检查 boundary 行只能出现一次 (第 0 行), 之后不能再出现与 B 完全相同的行
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === B) {
      console.error(
        `错误: 输入文件格式不正确, 目录文件中 boundary 行重复出现 (第 ${
          i + 1
        } 行)`,
      );
      Deno.exit(1);
    }
  }
  // 第 2 行已由 detectFileType 验证为 > find 开头
  // 从第 3 行提取路径 (跳过空行)
  const paths = [];
  for (let i = 2; i < lines.length; i++) {
    if (lines[i] !== "") {
      paths.push(lines[i]);
    }
  }
  if (paths.length === 0) {
    console.error("错误: 输入文件格式不正确, 目录文件中没有列出任何路径");
    Deno.exit(1);
  }
  return { paths, boundary: B };
}

/**
 * 解析内容文件
 * @returns {{ boundary: string, pathBlocks: Map<string, {start: number, end: number}>, lines: string[] }}
 */
function parseCatFile(lines) {
  const B = lines[0];
  if (lines.length < 2) {
    console.error("错误: 输入文件格式不正确, 内容文件太短");
    Deno.exit(1);
  }
  const last = lines[lines.length - 1];
  if (last !== B + "--") {
    console.error(
      `错误: 输入文件格式不正确, 内容文件必须以 boundary-- 结尾 (期望 "${B}--", 得到 "${last}")`,
    );
    Deno.exit(1);
  }

  const pathBlocks = new Map();

  // i 始终指向当前块的 boundary 行
  let i = 0;
  while (i < lines.length - 1) {
    // 最后一个 boundary-- 行不进入循环
    const catLine = lines[i + 1];
    if (!catLine.startsWith("> cat ")) {
      console.error(
        `错误: 输入文件格式不正确, 期望 "> cat <路径>" 在第 ${
          i + 2
        } 行, 但得到 "${catLine}"`,
      );
      Deno.exit(1);
    }

    // 提取路径
    const path = catLine.slice(6);
    // 当前块 boundary 行索引
    const start = i;

    // 寻找下一个 boundary 行 (B 或 B--)
    let j = i + 2;
    while (j < lines.length && lines[j] !== B && lines[j] !== B + "--") {
      j++;
    }
    // 因为文件末尾已保证存在 B--, j 不会越界
    if (lines[j] === B + "--" && j !== lines.length - 1) {
      console.error(
        `错误: 输入文件格式不正确, boundary-- 行出现在文件中间 (第 ${
          j + 1
        } 行)`,
      );
      Deno.exit(1);
    }
    // 不包含该 boundary 行
    const end = j;
    pathBlocks.set(path, { start, end });

    // 指向下一个 boundary 行
    i = j;
  }

  return { boundary: B, pathBlocks, lines };
}

async function main() {
  const args = Deno.args;
  if (args.length !== 2) {
    console.error("错误: 命令行参数不正确, 需要两个输入文件名");
    Deno.exit(1);
  }

  const [fileA, fileB] = args;

  // 读取文件, 并自动判断文件类型
  const linesA = await readFileLines(fileA);
  const linesB = await readFileLines(fileB);

  const typeA = detectFileType(linesA);
  const typeB = detectFileType(linesB);

  if (!typeA || !typeB) {
    console.error(
      "错误: 输入文件格式不正确, 两个文件都必须以 -- 开头, 第二行以 > find 或 > cat 开头",
    );
    Deno.exit(1);
  }
  if (typeA === typeB) {
    console.error(
      "错误: 输入文件格式不正确, 必须同时提供一个目录文件和一个内容文件",
    );
    Deno.exit(1);
  }

  const dirLines = typeA === "dir" ? linesA : linesB;
  const catLines = typeA === "cat" ? linesA : linesB;

  // 解析目录文件
  const { paths: dirPaths } = parseDirFile(dirLines);
  // 解析内容文件
  const { boundary: catBoundary, pathBlocks, lines: catFileLines } =
    parseCatFile(catLines);

  // 构建输出结果
  const result = [];

  for (const path of dirPaths) {
    const block = pathBlocks.get(path);
    if (!block) {
      console.error(`警告: "${path}" 在内容文件中未找到, 已跳过`);
      continue;
    }
    // 按行的区间直接提取 (包含 boundary 行, > cat 行和内容行)
    const slice = catFileLines.slice(block.start, block.end);
    result.push(...slice);
  }

  if (result.length === 0) {
    console.error(
      "错误: 输入文件内容不正确, 目录文件指定的所有路径在内容文件中均不存在",
    );
    Deno.exit(1);
  }

  // 结尾 boundary-- 行
  result.push(catBoundary + "--");

  const output = result.join("\n") + "\n";
  await Deno.stdout.write(new TextEncoder().encode(output));
}

main();
