// 环境变量 处理
//
// 支持的环境变量有:
//
// CAT_DIR_HASH=sha256
//   默认启用 sha256 元数据, 设为 0 禁用.
// CAT_DIR_COMPRESS=zstd
//   默认无压缩.
// CAT_DIR_COMPRESS_RATIO=0.9
//   如果压缩后的文件, 体积超过未压缩的 90%, 则直接打包未压缩的数据.
//   默认关闭此功能.
//
// CAT_DIR_FIND=0
//   不生成 find 文件列表.
// CAT_DIR_PRINT_META=0
//   在文件结尾不生成 --print-meta 元数据 (禁用随机读取).
// CAT_DIR_SCAN=1
//   忽略文件结尾的元数据 (块索引), 强制从头开始 扫描.
//
// CAT_DIR_FORCE_UNSAFE_BOUNDARY=
//   强制使用环境变量指定的 boundary (禁用 内部随机生成).
//
// CAT_DIR_MAX_FILE_SIZE=100
//   允许打包的 最大 单个文件 长度 (单位 MB).
//   在 简单实现 中, 会一次读取一个文件的完整内容到内存.
// CAT_DIR_FORCE_STREAM=1
//   强制流式处理, 禁止读取完整文件到内存.
//
// CAT_DIR_PLUGIN={"config":"detail"}
//   CLI 插件配置.

// TODO
