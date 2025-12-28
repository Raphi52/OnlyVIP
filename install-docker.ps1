# Script d'installation Docker pour OnlyVIP
# Executer en tant qu'Administrateur

Write-Host "=== Installation Docker pour OnlyVIP.fun ===" -ForegroundColor Cyan

# Etape 1: Installer WSL2
Write-Host "`n[1/3] Installation de WSL2..." -ForegroundColor Yellow
wsl --install

Write-Host "`n[2/3] Telechargement de Docker Desktop..." -ForegroundColor Yellow
$dockerInstaller = "$env:TEMP\DockerInstaller.exe"
Invoke-WebRequest -Uri "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile $dockerInstaller

Write-Host "`n[3/3] Installation de Docker Desktop..." -ForegroundColor Yellow
Start-Process -FilePath $dockerInstaller -ArgumentList "install --quiet --accept-license" -Wait

Write-Host "`n=== Installation terminee! ===" -ForegroundColor Green
Write-Host "Redemarrez le VPS puis executez:" -ForegroundColor Cyan
Write-Host "cd C:\Users\viral\Desktop\OnlyVIP\chat-sell-media" -ForegroundColor White
Write-Host "docker compose up -d --build" -ForegroundColor White

Read-Host "`nAppuyez sur Entree pour redemarrer"
Restart-Computer
