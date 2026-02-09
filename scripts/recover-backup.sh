#!/bin/bash
# OpenClaw Recovery Script
# Restores from a previous backup

BACKUP_DIR="$HOME/.openclaw/backups"

echo "🔧 OpenClaw Recovery Script"
echo "=========================="
echo ""

# List available backups
echo "📦 Available Backups:"
echo ""
ls -lht "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -10 || echo "⚠️  No backups found!"
echo ""

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo ""
    echo "Example: $0 backup_2026-02-03_08-00-00.tar.gz"
    echo ""
    echo "Or use the latest backup:"
    echo "Usage: $0 latest"
    exit 1
fi

BACKUP_FILE="$1"

if [ "$BACKUP_FILE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz | head -1)
    echo "📦 Using latest backup: $(basename $BACKUP_FILE)"
    echo ""
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "📦 Selected backup: $(basename $BACKUP_FILE)"
echo ""

# Confirm restore
read -p "⚠️  This will overwrite your current files. Continue? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Extract backup
echo "📦 Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_NAME=$(basename "$BACKUP_FILE" .tar.gz)

# Restore memory files
echo "📝 Restoring memory files..."
if [ -d "$TEMP_DIR/$BACKUP_NAME/memory" ]; then
    mkdir -p "$HOME/.openclaw/workspace/memory"
    cp -r "$TEMP_DIR/$BACKUP_NAME/memory/"* "$HOME/.openclaw/workspace/memory/"
    echo "✅ Memory files restored"
fi

# Restore sessions
echo "💬 Restoring sessions..."
if [ -d "$TEMP_DIR/$BACKUP_NAME/sessions" ]; then
    mkdir -p "$HOME/.openclaw/agents/main/sessions"
    cp -r "$TEMP_DIR/$BACKUP_NAME/sessions/"*.jsonl "$HOME/.openclaw/agents/main/sessions/" 2>/dev/null
    cp "$TEMP_DIR/$BACKUP_NAME/sessions/sessions.json" "$HOME/.openclaw/agents/main/sessions/" 2>/dev/null
    echo "✅ Sessions restored"
fi

# Restore config
echo "⚙️  Restoring config..."
if [ -f "$TEMP_DIR/$BACKUP_NAME/openclaw.json" ]; then
    cp "$TEMP_DIR/$BACKUP_NAME/openclaw.json" "$HOME/.openclaw/"
    echo "✅ Config restored"
fi

# Restore workspace
echo "📁 Restoring workspace..."
if [ -d "$TEMP_DIR/$BACKUP_NAME/workspace" ]; then
    cp -r "$TEMP_DIR/$BACKUP_NAME/workspace/"* "$HOME/.openclaw/workspace/"
    echo "✅ Workspace restored"
fi

# Cleanup
rm -rf "$TEMP_DIR"
echo ""
echo "✅ Recovery completed!"
echo ""
echo "🔄 Next steps:"
echo "   1. Review restored files"
echo "   2. Restart OpenClaw gateway:"
echo "   $ openclaw gateway restart"
echo ""
echo "📋 Restore from: $(basename $BACKUP_FILE)"