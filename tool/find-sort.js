#!/usr/bin/env -S deno --allow-read
// find-sort.js
// 对 find 输出文件进行排序 (去重, 忽略空行与注释行, 目录内 README.md 优先)

// Unicode 码点升序比较: 若一个字符串是另一个的前缀, 则短的排在前面
function compareCodePoints(a, b) {
  const aChars = [...a];
  const bChars = [...b];
  const len = Math.min(aChars.length, bChars.length);
  for (let i = 0; i < len; i++) {
    const ca = aChars[i].codePointAt(0);
    const cb = bChars[i].codePointAt(0);
    if (ca !== cb) return ca - cb;
  }
  return aChars.length - bChars.length;
}

// 由去重后的路径集合构建目录树
// 返回 rootMap: Map<string, Map>, 文件对应空 Map
function buildTree(pathSet) {
  const rootMap = new Map();

  for (const path of pathSet) {
    const parts = path.split("/");
    let current = rootMap;
    for (const name of parts) {
      if (!current.has(name)) {
        current.set(name, new Map());
      }
      current = current.get(name);
    }
  }
  return rootMap;
}

// 根据目录树递归生成排序后的路径行
// prefix 为当前目录对应的路径前缀, node 为当前 Map
function* walk(prefix, node) {
  const entries = [...node.entries()];

  // 分离 README.md, 其余按 Unicode 码点排序
  const readme = [];
  const others = [];
  for (const [name, childMap] of entries) {
    if (name === "README.md") {
      readme.push([name, childMap]);
    } else {
      others.push([name, childMap]);
    }
  }
  others.sort((a, b) => compareCodePoints(a[0], b[0]));

  const sorted = [...readme, ...others];

  for (const [name, childMap] of sorted) {
    const fullPath = prefix ? prefix + "/" + name : name;
    if (childMap.size === 0) {
      // 文件
      yield fullPath;
    } else {
      // 目录: 递归输出内部文件
      yield* walk(fullPath, childMap);
    }
  }
}

async function main() {
  const args = Deno.args;
  if (args.length !== 1) {
    console.error("用法: deno run --allow-read find-sort.js 输入文件");
    Deno.exit(1);
  }

  const inputPath = args[0];
  let text;
  try {
    text = await Deno.readTextFile(inputPath);
  } catch (e) {
    console.error("读取文件出错:", e.message);
    Deno.exit(1);
  }

  const allLines = text.split(/\r?\n/);
  if (allLines.length < 2) {
    console.error("输入文件格式错误: 至少需要 2 行");
    Deno.exit(1);
  }

  // 格式验证: 第 1 行必须以 "--" 开头
  if (!allLines[0].startsWith("--")) {
    console.error("输入文件格式错误: 第 1 行必须以 -- 开头");
    Deno.exit(1);
  }

  // 格式验证: 第 2 行必须以 ">" 开头
  if (!allLines[1].startsWith(">")) {
    console.error("输入文件格式错误: 第 2 行必须以 > 开头");
    Deno.exit(1);
  }

  const boundary = allLines[0];
  const findCmd = allLines[1];

  // 验证 boundary 在整个文件中唯一 (不允许重复出现)
  const boundaryCount = allLines.filter((line) => line === boundary).length;
  if (boundaryCount > 1) {
    console.error("输入文件格式错误: 边界标记行在文件中重复出现");
    Deno.exit(1);
  }

  // 过滤路径行: 忽略完全空行 (长度 === 0) 和以 # 开头的行, 并去重
  const rawPaths = allLines.slice(2);
  const pathSet = new Set();
  for (const line of rawPaths) {
    if (line.length === 0 || line.startsWith("#")) continue;
    pathSet.add(line);
  }

  const rootMap = buildTree(pathSet);

  // 递归收集输出行 (文件路径)
  const outputLines = [...walk("", rootMap)];

  // 二次验证：不重不漏
  const outputSet = new Set(outputLines);
  if (pathSet.size !== outputSet.size) {
    console.error(
      `验证失败: 行数不匹配 (输入 ${pathSet.size} 行, 输出 ${outputSet.size} 行)`,
    );
    Deno.exit(1);
  }
  for (const p of pathSet) {
    if (!outputSet.has(p)) {
      console.error(`验证失败: 输出缺少行: ${p}`);
      Deno.exit(1);
    }
  }

  const result = [boundary, findCmd, ...outputLines].join("\n");
  console.log(result);
}

main();
