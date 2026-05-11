# cat-dir: Directory (File Tree) Bundler Tool (npm)

![CI](https://github.com/fm-elpac/cat-dir/actions/workflows/ci.yml/badge.svg)

cat-dir: Bundle directory tree into one plain-text file. (like tar, but you can
`cat` it)

<https://github.com/fm-elpac/cat-dir>

## Usage

For example, given a directory (files):

```sh
mkdir -p src
echo "console.log(666)" > src/1.js
echo "TODO" > src/README.md
```

Bundle:

```sh
> node bin/cat-dir.js src src.txt
--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
```

Then you get the file `src.txt`:

```sh
--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
> cat src/1.js
console.log(666)

--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6
> cat src/README.md
TODO

--FileBoundary-Dn5HYB8obSOXISFlDjHqGa6--
```

Hooray ~

## Documentation

- File format specification: `doc/cat-dir.en.md`

## LICENSE

`MIT`
