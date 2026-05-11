# 喵夹 (cat-dir) 目录 (文件树) 打包工具

![CI](https://github.com/fm-elpac/cat-dir/actions/workflows/ci.yml/badge.svg)

cat-dir: Bundle directory tree into one plain-text file. (like tar, but you can
`cat` it)

<https://github.com/fm-elpac/cat-dir>

## 用法

比如有这样一个目录 (文件):

```sh
mkdir -p src
echo "console.log(666)" > src/1.js
echo "TODO" > src/README.md
```

进行打包:

```sh
> cat-dir -s src.txt src
--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
```

然后获得文件 `src.txt`:

```sh
--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
> cat src/1.js
console.log(666)

--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
> cat src/README.md
TODO

--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6--
```

撒花 ~

## 文档

- 文件格式定义: `doc/cat-dir.md`

## LICENSE

`MIT`
