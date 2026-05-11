# cat-dir: Directory Tree Bundling Tool

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

Bundle it:

```sh
> ./cat-dir.sh src src.txt
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

Then you get the file `src.txt`:

```sh
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat src/1.js
console.log(666)

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat src/README.md
TODO

--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha--
```

Hooray ~

---

TODO

## Documentation

- File format specification: `doc/cat-dir.en.md`

TODO

## LICENSE

`MIT`
