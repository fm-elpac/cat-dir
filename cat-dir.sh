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
