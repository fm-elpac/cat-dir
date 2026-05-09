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
> ./cat-dir.sh src src.txt
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

然后获得文件 `src.txt`:

```sh
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat src/1.js
console.log(666)

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat src/README.md
TODO

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha--
```

撒花 ~

---

TODO

## 文档

- 文件格式定义: `doc/cat-dir.md`

TODO

## LICENSE

`MIT`
