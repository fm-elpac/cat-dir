// cat-dir.js
import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

const randomBytesAsync = promisify(randomBytes);

/**
 * 生成随机 boundary 字符串
 * shell 等效: head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 23
 */
async function generateBoundary() {
  const buf = await randomBytesAsync(32);
  const base64 = buf.toString("base64");
  const filtered = base64.replace(/[^A-Za-z0-9]/g, "");
  return `--FileBoundary-${filtered.slice(0, 23)}`;
}

/**
 * 递归收集目录下所有普通文件的路径 (包含原始 DIR 前缀)
 * 与 find DIR -type f 行为一致
 */
async function collectFiles(dir) {
  const result = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile()) {
        result.push(fullPath);
      } else if (entry.isDirectory()) {
        result.push(...(await collectFiles(fullPath)));
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
  }
  return result;
}

/**
 * 将一个文件的内容以流式方式追加到输出流中,
 * 并正确插入 boundary, 提示行 以及 尾随换行符
 */
async function appendFileToOutput(outputStream, filePath, boundary) {
  try {
    // 写入 boundary 行
    outputStream.write(`${boundary}\n`);
    // 写入提示行 "> cat 文件路径"
    outputStream.write(`> cat ${filePath}\n`);

    // 流式传输文件内容 (二进制安全)
    const readStream = createReadStream(filePath);
    await pipeline(readStream, outputStream, { end: false });

    // 文件内容后添加一个空行
    outputStream.write("\n");
  } catch (err) {
    console.error(`Error processing file ${filePath}: ${err.message}`);
    // 继续处理后续文件
  }
}

async function main() {
  // 参数校验
  if (process.argv.length !== 4) {
    console.error(`Usage: ${process.argv[1]} input_dir output.txt`);
    process.exit(1);
  }

  const DIR = process.argv[2];
  const OUT = process.argv[3];

  // 删除已存在的输出文件 (异步)
  await rm(OUT, { force: true });

  const boundary = await generateBoundary();

  // 收集所有待处理文件
  const files = await collectFiles(DIR);

  // 创建输出流 (截断模式)
  const outputStream = createWriteStream(OUT, { flags: "w" });

  for (const file of files) {
    await appendFileToOutput(outputStream, file, boundary);
  }

  // 写入结束标记
  outputStream.write(`${boundary}--\n`);

  outputStream.end();

  // 输出 boundary
  console.log(boundary);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
