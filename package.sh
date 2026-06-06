#!/bin/bash
set -e

echo "=== Preparando o diretório de build ==="
rm -rf build
mkdir -p build/AppDir/usr/bin
mkdir -p build/AppDir/usr/share/turtlestation

echo "=== Copiando binário compilado e dados ==="
# Copia o binário compilado (que agora será turtlestation-game-frontend por conta do package.json)
if [ -f turtlestation-game-frontend ]; then
    cp turtlestation-game-frontend build/AppDir/usr/bin/turtlestation-game-frontend
else
    # Fallback caso ainda não tenha sido recompilado
    cp antigravity-game-frontend build/AppDir/usr/bin/turtlestation-game-frontend 2>/dev/null || cp antigravity-game-frontend build/AppDir/usr/bin/turtlestation-game-frontend
fi

# Copiar configurações default se houver
if [ -f data/settings.json ]; then
    cp data/settings.json build/AppDir/usr/share/turtlestation/settings.json
fi

echo "=== Copiando ícone do aplicativo ==="
ICON_SRC="/home/tartaruga/.gemini/antigravity-cli/brain/3c74c002-4379-43fc-8472-225688a178d6/antigravity_app_icon_1780765614614.png"
if [ -f "$ICON_SRC" ]; then
    cp "$ICON_SRC" build/AppDir/turtlestation.png
    cp "$ICON_SRC" build/AppDir/.DirIcon
else
    echo "Aviso: Ícone não encontrado, criando um vazio"
    touch build/AppDir/turtlestation.png
fi

echo "=== Criando AppRun ==="
cat << 'EOF' > build/AppDir/AppRun
#!/bin/sh
SELF=$(readlink -f "$0")
HERE=$(dirname "$SELF")

# Define persistent data directory on the host filesystem
export TURTLESTATION_DATA_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/turtlestation"
mkdir -p "$TURTLESTATION_DATA_DIR"

# Seed default settings if not exists
if [ ! -f "$TURTLESTATION_DATA_DIR/settings.json" ] && [ -f "$HERE/usr/share/turtlestation/settings.json" ]; then
    cp "$HERE/usr/share/turtlestation/settings.json" "$TURTLESTATION_DATA_DIR/settings.json"
fi

# Start the Node.js server in the background
"$HERE/usr/bin/turtlestation-game-frontend" &
SERVER_PID=$!

# Wait for server to start
sleep 1.5

# Open the browser to the app
if which xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000"
elif which sensible-browser >/dev/null 2>&1; then
    sensible-browser "http://localhost:3000"
elif which x-www-browser >/dev/null 2>&1; then
    x-www-browser "http://localhost:3000"
fi

# Keep AppImage running as long as the server is running
wait $SERVER_PID
EOF
chmod +x build/AppDir/AppRun

echo "=== Criando arquivo .desktop ==="
cat << 'EOF' > build/AppDir/turtlestation.desktop
[Desktop Entry]
Type=Application
Name=TurtleStation
Comment=Premium Steam Deck style game frontend launcher for Linux
Exec=turtlestation-game-frontend
Icon=turtlestation
Categories=Game;Utility;
Terminal=false
EOF

echo "=== Baixando appimagetool ==="
if [ ! -f build/appimagetool ]; then
    curl -Lo build/appimagetool https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x build/appimagetool
fi

echo "=== Gerando AppImage ==="
export ARCH=x86_64
./build/appimagetool --appimage-extract-and-run build/AppDir TurtleStation-x86_64.AppImage

echo "=== Sucesso! AppImage gerada: TurtleStation-x86_64.AppImage ==="
