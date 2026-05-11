# cat-dir 插件框架 (plugin)

可以使用 外部插件 增强 cat-dir 的功能.

## 插件类别

- (1) 元数据插件 (`plugin_meta`): 为文件添加 自定义元数据.

  外部插件:

  ```sh
  > cat-dir plugin NAME
  ```

- (2) 文件内容验证插件 (`plugin_check`): 用于检查 文件数据 是否正确.

  外部插件;

  ```sh
  > cat-dir plugin --check
  ```

  比如实现 自定义 hash.

- (3) 文件内容转换插件 (`plugin_transform`): 虚拟文件, 对 文件数据 进行转换处理.

  外部插件:

  ```sh
  > cat-dir plugin --transform
  ```

  比如实现 自定义 压缩/加密.

## 实现方式

- (1) 代码插件. 当一个程序以 库 形式调用 cat-dir (API) 时, 可以通过 回调函数
  等方式, 注入 自定义插件.

  代码插件 可以实现 一个 实际文件 对应 多个 虚拟文件 (分块/合并) 等高级功能.

- (2) CLI 插件. 作为外部 进程 运行, 通过 stdin/stdout 等与 cat-dir 进程交互.

  CLI 插件 只能实现 块 和 文件 的一一对应.

## CLI 插件

环境变量 (启动 插件进程 时设置):

- `CAT_DIR_PLUGIN_NAME`: 被调用的插件名称.

- `CAT_DIR_PLUGIN_CMDLINE`: 此插件对应的元数据行.

  比如 `> cat-dir plugin --check sha3`

- `CAT_DIR_PLUGIN_STDOUT`: 专属于本插件的元数据.

  比如:

  ```sh
  > cat-dir plugin XXX
  666
  2133
  > cat-dir plugin --check sha3
  ```

  对于 `XXX` 来说, 此环境变量为 `666\n2133\n`.

- `CAT_DIR_PLUGIN_BLOCK_HEADER`: 本块的完整元数据.

- `CAT_DIR_PLUGIN_OP=r`: 操作模式. `r` 表示正在 读取 cat-dir 文件. `w` 表示正在
  写入 cat-dir 文件.

- `CAT_DIR_PLUGIN_PATH`: 文件路径 (当前块对应的文件).

---

插件类型 `plugin_meta`:

w 模式:

- stdin: 输入 (原始文件) 数据.
- stdout: 输出的 元数据, 经过 格式检查 后, 追加到 本块的 元数据 中.
  如果插件输出为空, 表示不添加元数据.
- exit code: 返回 0 表示 成功, 否则失败.

stdout 输出格式举栗:

```sh
> cat-dir plugin --check sha3
HEX
```

r 模式:

- stdin: 输入 块 包含的数据 (`> cat` 后面).
- exit code: 返回 0 表示 成功.

---

插件类型 `plugin_check`:

w 模式: 同 plugin_meta.

r 模式:

- exit code: 返回 0 表示 检查通过. 否则表示 数据损坏, 应该报错
  (对应文件不应该生成).

---

插件类型 `plugin_transform`:

w 模式:

- stdout: 输出的 元数据, 如果最后一行是 `> cat` 则表示, 后面是 处理后的数据.

r 模式:

- stdin: 同上 (输入 打包后的数据).

- stdout: 如果输出 `> cat` 行, 表示后面是 "还原" 后的数据 (可以写入 最终文件).
  否则, 表示无需创建最终文件.

---

TODO
