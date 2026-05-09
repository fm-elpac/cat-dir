# 喵夹 (cat-dir) 文件打包格式 规范文档 (草稿)

这个用于打包的 文件格式 叫 `cat-dir`, 实现的软件 (程序) 也叫 `cat-dir`.

功能: 把 目录 中的文件 (递归 下级目录) 打包成一个文件, 类似: tar, zip 等.

设计哲学: 类似 HTTP multipart/form-data 分隔 + Linux 命令 (子集).

## 简单示例 (文件格式)

这是最基本的多文件打包 (原始设计):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat pmks-2/tool/cat-dir.sh
echo 666
exit 0

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat pmks-2/README.md
TODO

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

## 功能扩展

这个格式很容易扩展, 添加功能:

- (1) 文件列表 (目录):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> find . -type f
pmks-2/README.md
pmks-2/tool/cat-dir.sh
pmks-2/发布/README.md
```

- (2) 文件内容校验 (hash):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> sha256sum src/README.md
8b51f72bbf8d852192e7a54a088cb18e1b5e654770231d5b7248b8fd0ead67ed  src/README.md
> cat src/README.md
666
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

- (3) 符号链接 (草稿, 非最终设计):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> ls -l src/current
lrwxrwxrwx 1 a202602u24 a202602u24 9 May  9 10:32 src/current -> README.md
```

- (4) 压缩 (加密):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> zstd src/README.md -o src/README.md.zst
> cat src/README.md.zst/

省略 (虚拟文件)
```

先调用 外部工具 进行 压缩/加密, 然后把结果打包.

- (5) 文件开头 格式版本 元数据:

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat-dir --version
0.1.0
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

- (6) 文件结尾 追加 元数据 (虚拟文件):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat-dir --print-meta
> cat /tmp/.CAT_DIR_FILE/meta.json/
{"此处":"省略"}
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha--
```

因为文件以 `--boundary--` 结尾, 所以从文件末尾倒着解析, 也能成功获取到各 块.

元数据 作为最后一块, 可以加入 前面各块 的列表, 包括 文件名, 字节偏移, 长度
等元数据, 从而支持 随机读取.

## 格式定义

- (1) 元数据编码: 文本编码 MUST 使用 `UTF-8`. 换行字符 MUST 使用 `\n` 单个字节
  (0x0a).

- (2) 块分隔符: 随机生成的多个字节, 类似 HTTP multipart/form-data 的格式.

  - (2.1) 字符集: 只能使用 ASCII 字符, 且 不得含有 控制字符 (中间不得含有 `\n`
    换行字符).

  - (2.2) 最大长度: 255 字节. (含 开头/结尾 的 `\n` 字节)

  - (2.3) 固定格式: `\n` (1 字节) + `--` (2 字节) + ? 个 随机字节
    (由具体实现决定) + `\n` (1 字节).

  也就是 开头/结尾 都是 `\n` 字节, 中间不能有 `n`, 然后开头是 `--`. 但是,
  文件开头位置 (第 1 行) 没有最前面的 `\n` 字节.

  - (2.4) 随机性. 具体实现 SHOULD 提供至少 64bit 的 `/dev/urandom` 级别的随机性.
    实现 MAY 自行选择使用 128bit 等更高的随机性.

  - (2.5) 文件结尾应该使用 `--boundary--` 的格式 (之后允许存在 空行, 会被忽略)

- (3) 每个块 只允许包含 0 个 (纯 元数据) 或 1 个文件内容. 如果包含文件内容,
  则元数据 必须 以 `> cat` 行 **结尾**, 其后直到本块结束, 都是文件内容.

- (4) cat 的字节透明性: 类似 Linux 的 `cat` 命令, `> cat` 行后的文件内容, 不区分
  文本/二进制, 原样包含所有字节. 根据 随机 boundary 字节 区分结束.

- (5) 元数据: 精确定义的 Linux 命令 子集.

  块 中 `> cat` 前面的 元数据, 每条以 `>` 行起始. 虽然使用 Linux 命令的格式,
  但在 本文档 中进行限制 (固定). 本文档明确规定, 允许使用哪些 命令,
  每个命令允许使用 的 格式 和 参数/选项, 参数/选项 的作用, 输出格式 等.

  能够作为 元数据 的命令, 必须输出 固定格式 (不得输出 任意内容), 且输出 不会混淆
  (不会输出 `>` 开头的行).

  TODO 具体 命令/参数/输出格式 待准确定义

- (6) 关于 同一个文件 的各种 元数据, 应该和文件内容放在同一个 块 里, SHOULD NOT
  分散到多个 块 里面.

- (7) 文件路径: 不支持 UTF-8 无法表示的路径. 不支持路径中含有 `\n` 字节.
  路径分隔 MUST 使用 `/` 字符. 不支持 单个文件名 (路径中的一级) 含有 `/` 字符.

- (8) cat 虚拟文件: 在 `> cat` 元数据 中, 如果后面跟的是 虚拟文件 (并非
  实际存在), 则路径以 `/` 结尾, 比如 `> cat XXX/`

  这模仿了 `cat` 命令的一个有趣特性, 比如:

```sh
u0@localhost ~> mkdir -p test
u0@localhost ~> cat test/
cat: test/: Is a directory
```

## 最初实现

仅供参考, 这个代码是 功能扩展 设计之前的版本, 未完整实现本规范.

- 文件 `cat-dir.sh`:

```sh
#!/bin/bash
# cat-dir.sh INPUT_DIR OUTPUT_FILE_TXT

if [ $# -ne 2 ]; then
  echo "Usage: $0 input_dir output.txt"
  exit 1
fi

DIR="$1"
OUT="$2"

if [ -f "${OUT}" ]; then
  rm "${OUT}"
fi

# Content-Type: multipart/form-data; boundary=FileBoundary-XXXX
BOUNDARY="--FileBoundary-$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 23)"

while IFS= read -r -d $'\0' file; do
  echo "${BOUNDARY}" >> "${OUT}"
  echo "> cat ${file}" >> "${OUT}"

  cat "${file}" >> "${OUT}"

  echo >> "${OUT}"
done < <(find "${DIR}" -type f -print0)

echo "${BOUNDARY}--" >> "${OUT}"

echo "${BOUNDARY}"
# ok

# rsync -rvm --exclude='图' --include='*/' --include='*.md' --exclude='*' pmks-2 pmks-2-rsync/
```

---

TODO
