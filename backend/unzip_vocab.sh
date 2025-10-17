#!/bin/bash

# Скрипт для распаковки ORBvoc.txt из архива

VOCAB_DIR="lib/orb_slam/vocab"
VOCAB_FILE="$VOCAB_DIR/ORBvoc.txt"
VOCAB_ZIP="$VOCAB_DIR/ORBvoc.txt.zip"

echo "Checking ORBvoc.txt..."

# Проверяем, существует ли уже распакованный файл
if [ -f "$VOCAB_FILE" ]; then
    echo "✓ ORBvoc.txt already exists. Skipping extraction."
    exit 0
fi

# Проверяем, существует ли архив
if [ ! -f "$VOCAB_ZIP" ]; then
    echo "✗ Error: $VOCAB_ZIP not found!"
    exit 1
fi

echo "Extracting ORBvoc.txt from archive..."

# Распаковываем архив
unzip -q "$VOCAB_ZIP" -d "$VOCAB_DIR"

# Проверяем успешность распаковки
if [ -f "$VOCAB_FILE" ]; then
    echo "✓ ORBvoc.txt extracted successfully!"
    echo "File size: $(du -h "$VOCAB_FILE" | cut -f1)"
else
    echo "✗ Error: Failed to extract ORBvoc.txt"
    exit 1
fi
