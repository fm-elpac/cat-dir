// 辅助命令 (小工具): 处理多种 cat-dir 辅助命令.
//
// cat-dir --version
// cat-dir --help
//   此帮助信息 不包括 cat-dir tar --help 的内容.
//
// cat-dir --版本
// cat-dir --帮助
//
// cat-dir --print-meta
// cat-dir --bh-crc32
//   保留的 "伪命令", 用于 cat-dir 文件内部的元数据标注.
//
// cat-dir --boundary
//   随机生成一个 boundary, 输出到 stdout.
//
// cat-dir --check 文件
//   检查文件格式 (cat-dir) 是否完好 (尽可能使用 各种校验).
//
// cat-dir cat 打包文件 路径
//   将 路径 指定的文件, 直接输出到 stdout
//
// cat-dir info 打包文件
//   输出关于 cat-dir 文件的信息.

// TODO
