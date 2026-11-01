#!/usr/bin/env bash
# Makes the exhibit open automatically when the Pi reaches its desktop.
# Run once on the Pi. Undo with: rm ~/.config/autostart/through-the-lens.desktop
set -eu

KIOSK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOSTART_DIR="${HOME}/.config/autostart"

chmod +x "${KIOSK_DIR}/start-kiosk.sh"
mkdir -p "$AUTOSTART_DIR"

cat > "${AUTOSTART_DIR}/through-the-lens.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Through the Lens
Exec="${KIOSK_DIR}/start-kiosk.sh"
X-GNOME-Autostart-enabled=true
EOF

echo "Installed. The exhibit will open at the next desktop login."
echo "Also turn on desktop auto-login: sudo raspi-config > System Options > Boot / Auto Login."
echo "Also turn off screen blanking: sudo raspi-config > Display Options > Screen Blanking."
