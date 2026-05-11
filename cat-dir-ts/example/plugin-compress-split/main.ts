// 示例外部插件: plugin-compress-split
//
// 功能: 将输入的大文件分块, 然后分别对每块调用 gzip 并行压缩, 输出多个 虚拟文件.
//
// 解包时, 将多个 虚拟文件 并行解压缩, 合并成完整的输出文件.
//
// 环境变量:
//
// COMPRESS_SPLIT_SIZE=4
//   输入文件分块大小, 单位 MB
// COMPRESS_SPLIT_THREAD=8
//   并行调用的 gzip 数量 (线程数)

// TODO
