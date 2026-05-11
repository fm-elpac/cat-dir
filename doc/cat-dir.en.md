# cat-dir File Packaging Format Specification (Draft)

This file packaging format is called `cat-dir`, and the software (program)
implementing it is also called `cat-dir`.

Function: Pack files within a directory (recursively into subdirectories) into a
single file, similar to: tar, zip, etc.

Design Philosophy: Analogous to HTTP multipart/form-data boundary separation + a
subset of Linux commands.

## Simple Example (File Format)

This is the most basic multi-file packaging (original design):

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

## Feature Extensions

This format is easily extensible to add features:

- (1) File list (directory listing):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> find . -type f
pmks-2/README.md
pmks-2/tool/cat-dir.sh
pmks-2/发布/README.md
```

- (2) File content verification (hash):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> sha256sum
8b51f72bbf8d852192e7a54a088cb18e1b5e654770231d5b7248b8fd0ead67ed  -
> cat src/README.md
666
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

- (3) Symbolic links:

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> readlink .pmbs/latest
2026/1778414735
```

- (4) Compression (and encryption):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> zstd
> cat src/README.md/

(content omitted, virtual file)
```

First invoke external tools for compression/encryption, then pack the result.

- (5) Format version metadata at the file start:

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat-dir --version
0.1.0
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
```

- (6) Appending metadata at the end of the file (virtual file):

```
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha
> cat-dir --print-meta
> cat /tmp/.CAT_DIR_FILE/meta.json/
{"content":"omitted"}
--FileBoundary-DqFD5ORwVLZsT2Usq4Clvha--
```

Since the file ends with `--boundary--`, parsing the file from the end backwards
can also successfully extract each block.

Placing metadata as the last block allows the inclusion of a list of preceding
blocks, including file names, byte offsets, lengths, and other metadata, thereby
enabling random access.

## Format Definition

- (1) Metadata encoding: Text encoding MUST use `UTF-8`. Newline characters MUST
  use the single byte `\n` (0x0a).

- (2) Block separator (boundary): Randomly generated multiple bytes, similar to
  the format used in HTTP multipart/form-data.

  - (2.1) Character set: Only ASCII characters MAY be used, and control
    characters MUST NOT be present (no `\n` newline characters within the
    boundary string).

  - (2.2) Maximum length: 255 bytes (including the leading/trailing `\n` bytes).

  - (2.3) Fixed format: `\n` (1 byte) + `--` (2 bytes) + ? random bytes (chosen
    by the implementation) + `\n` (1 byte).

  That is, both the beginning and end of the boundary line contain a `\n` byte,
  with no `\n` allowed in between, and the line starts with `--`. However, the
  very first line of the file (position 0) lacks the preceding `\n` byte.

  - (2.4) Randomness: Implementations SHOULD provide at least 64 bits of
    randomness equivalent to `/dev/urandom`. Implementations MAY choose to use
    128-bit or higher randomness.

  - (2.5) The end of the file SHOULD use the `--boundary--` format (trailing
    blank lines are allowed and will be ignored).

- (3) Each block may contain zero (pure metadata) or one file content. If file
  content is included, the metadata MUST end with a `> cat` line, after which
  all bytes until the end of the block constitute the file content.

- (4) Byte transparency of cat: Similar to the Linux `cat` command, file content
  after the `> cat` line is included verbatim, not distinguishing between text
  or binary, preserving all bytes. The end is determined by the random boundary
  bytes.

- (5) Metadata: A precisely defined subset of Linux commands.

  Metadata within a block, preceding the `> cat` line, each starts with a `>`
  line. Although it uses the format of Linux commands, it is restricted (fixed)
  in this specification. This document explicitly defines which commands are
  permitted, the exact format and parameters/options allowed for each, the
  effects of those parameters/options, and the output format.

  Commands eligible to serve as metadata MUST produce fixed-format output (no
  arbitrary content) and the output MUST NOT create confusion (e.g., must not
  output lines starting with `>`).

  TODO Exact commands/parameters/output formats to be precisely defined.

- (6) Metadata for the same file SHOULD be placed in the same block as the file
  content, and SHOULD NOT be scattered across multiple blocks.

- (7) File paths: Paths that cannot be represented in UTF-8 are unsupported.
  Paths containing the `\n` byte are unsupported. Path separators MUST use the
  `/` character. Individual file name components (a single level in the path)
  containing the `/` character are unsupported.

- (8) Virtual cat files: If the path following `> cat` refers to a virtual file
  (one that does not actually exist), the path ends with `/`, e.g.,
  `> cat XXX/`.

  This mimics an interesting behavior of the `cat` command, for example:

```sh
u0@localhost ~> mkdir -p test
u0@localhost ~> cat test/
cat: test/: Is a directory
```

## Initial Implementation

For reference only, this code predates the feature extension design and does not
fully implement this specification.

- File `cat-dir.sh`:

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
