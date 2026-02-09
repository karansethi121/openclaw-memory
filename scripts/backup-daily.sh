#!/bin/bash
# OpenClaw Backup Script - Daily Automated Backup
# Creates backups of memory, sessions, config, and workspace files
# Run via cron job at specified interval

BACKUP_DIR="$HOME/.openclaw/backups"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
BACKUP_NAME="backup_${DATE}_${TIME}"
CURRENT_BACKUP="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
mkdir -p "$CURRENT_BACKUP"

echo "🔄 Starting OpenClaw backup..."
echo "📅 Date: $(date)"
echo "💾 Backup location: $CURRENT_BACKUP"
echo ""

# Backup memory files
echo "📝 Backing up memory files..."
mkdir -p "$CURRENT_BACKUP/memory"
cp -r "$HOME/.openclaw/workspace/memory/"* "$CURRENT_BACKUP/memory/" 2>/dev/null || echo "⚠️  No memory files to backup"

# Backup sessions
echo "💬 Backing up sessions..."
mkdir -p "$CURRENT_BACKUP/sessions"
cp -r "$HOME/.openclaw/agents/main/sessions/"*.jsonl "$CURRENT_BACKUP/sessions/" 2>/dev/null || echo "⚠️  No session files to backup"
cp "$HOME/.openclaw/agents/main/sessions/sessions.json" "$CURRENT_BACKUP/sessions/" 2>/dev/null || echo "⚠️  No sessions index to backup"

# Backup config
echo "⚙️  Backing up config..."
cp "$HOME/.openclaw/openclaw.json" "$CURRENT_BACKUP/" 2>/dev/null || echo "⚠️  No config to backup"

# Backup workspace
echo "📁 Backing up workspace (website, research, brand)..."
mkdir -p "$CURRENT_BACKUP/workspace"
cp -r "$HOME/.openclaw/workspace/one4health-website/" "$CURRENT_BACKUP/workspace/" 2>/dev/null || echo "⚠️  No website to backup"
cp -r "$HOME/.openclaw/workspace/research/" "$CURRENT_BACKUP/workspace/" 2>/dev/null || echo "⚠️  No research to backup"
cp -r "$HOME/.openclaw/workspace/brand/" "$CURRENT_BACKUP/workspace/" 2>/dev/null || echo "⚠️  No brand folder to backup"
cp "$HOME/.openclaw/workspace/IDENTITY.md" "$CURRENT_BACKUP/workspace/" 2>/dev/null
cp "$HOME/.openclaw/workspace/SOUL.md" "$CURRENT_BACKUP/workspace/" 2>/dev/null
cp "$HOME/.openclaw/workspace/USER.md" "$CURRENT_BACKUP/workspace/" 2>/dev/null

# Create backup manifest
echo "📋 Creating backup manifest..."
{
  echo "=== OpenClaw Backup Manifest ==="
  echo "Date: $(date)"
  echo "Backup Location: $CURRENT_BACKUP"
  echo ""
  echo "=== Memory Files ==="
  ls -la "$CURRENT_BACKUP/memory/" 2>/dev/null || echo "None"
  echo ""
  echo "=== Session Files ==="
  ls -la "$CURRENT_BACKUP/sessions/" 2>/dev/null || echo "None"
  echo ""
  echo "=== Workspace ==="
  ls -la "$CURRENT_BACKUP/workspace/" 2>/dev/null || echo "None"
} > "$CURRENT_BACKUP/MANIFEST.txt"

# Compress backup
echo "📦 Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

# Show backup summary
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz | wc -l)
echo ""
echo "✅ Backup completed!"
echo "📦 Archive: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "📊 Size: $BACKUP_SIZE"
echo "📦 Total backups: $BACKUP_COUNT"
echo ""
echo "=== Backup Summary ==="
echo "✅ Memory files backed up"
echo "✅ Sessions backed up"
echo "✅ Configuration backed up"
echo "✅ Workspace (website, research, brand) backed up"
echo "✅ Manifest created"
echo "✅ Old backups cleaned up (30-day retention)"