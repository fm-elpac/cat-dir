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

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha--
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
> sha256sum
8b51f72bbf8d852192e7a54a088cb18e1b5e654770231d5b7248b8fd0ead67ed  -
> cat src/README.md
666

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

- (3) 符号链接:

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> readlink .pmbs/latest
2026/1778414735
```

- (4) 压缩 (加密):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> zstd
> cat src/README.md/

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

## 元数据 命令 定义

TODO

### 文件结尾 元数据

```sh
> cat-dir --print-meta
> sha256sum
HEX  -
> cat /tmp/.CAT_DIR_FLIE/meta.json/
```

注意: 可以插入 sha256 对 元数据内容 进行校验 (检查损坏).

示例:

```json
{
  "cat-dir --version": "0.1.0-b1",
  "block": [
    {
      "t": "v",
      "s": 0,
      "b": 64,
      "h": 25
    },
    {
      "s": 64,
      "b": 144,
      "h": 100,
      "p": "src/README.md",
      "sha256": "8b51f72bbf8d852192e7a54a088cb18e1b5e654770231d5b7248b8fd0ead67ed",
      "du -b": 4
    }
  ],
  "boundary": "\n--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha\n",
  "t": "1778501114935"
}
```

详细说明:

- `cat-dir --version`: 生成此元数据的程序版本.

- `block`: 块列表.

- (block.) `t` (可选): 块类型. 默认为 文件 (含有一个 文件/虚拟文件). `v` 表示
  `> cat-dir --version` 元数据块. `find` 表示 `> find` 块.

- `s`: 块起始偏移 (字节), 从 cat-dir 打包文件的开头算起. 指向本块开始 boundary
  的第 1 个字节 (`\n`).

- `b`: 块长度 (字节). 不包括下一个 boundary.

- `h`: 块元数据长度 (字节). 不包括 boundary.

  所以一个块中 `> cat` 行后面的数据 长度 = b - h - BS. 其中 BS 是 boundary 长度.

- `p` (可选): 文件路径 (如果这个块包含文件).

- `sha256` (可选): 原始文件内容数据的校验.

- `du -b` (可选): 原始文件长度 (字节).

- `boundary`: 重复本文件的 boundary.

- `t` (可选): 生成此元数据的 时间戳.

---

TODO
