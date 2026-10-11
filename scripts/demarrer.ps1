<#
  Passages CDI : démarrage automatique et mises à jour en continu (Windows).

  Lancement : double-cliquer sur « demarrer.cmd » à la racine du projet
             (ou taper .\demarrer.cmd dans PowerShell).

  Ce que fait le script :
    1. démarre la base de données (Docker) ;
    2. récupère la dernière version depuis GitHub, installe et met à jour la base si besoin ;
    3. lance l'application sur http://localhost:3000 ;
    4. vérifie GitHub toutes les 15 secondes et, à chaque nouvelle version,
       recommence les étapes 2 et 3 tout seul.

  Pour arrêter : Ctrl + C dans cette fenêtre.
#>

# « Continue » : les messages d'information de Git ne doivent pas arrêter le script.
# Les vraies erreurs sont détectées par Executer, qui vérifie le code de retour.
$ErrorActionPreference = "Continue"
$Intervalle = 15   # secondes entre deux vérifications sur GitHub
Set-Location (Split-Path -Parent $PSScriptRoot)

function Info($texte)   { Write-Host "[$(Get-Date -Format HH:mm:ss)] $texte" -ForegroundColor Cyan }
function Succes($texte) { Write-Host "[$(Get-Date -Format HH:mm:ss)] $texte" -ForegroundColor Green }
function Alerte($texte) { Write-Host "[$(Get-Date -Format HH:mm:ss)] $texte" -ForegroundColor Yellow }

function Executer($commande) {
  cmd.exe /c $commande
  if ($LASTEXITCODE -ne 0) { throw "La commande « $commande » a échoué (code $LASTEXITCODE)." }
}

# npm modifie parfois package-lock.json tout seul : on remet la version de GitHub
# pour que la mise à jour ne soit jamais bloquée.
function Nettoyer-FichiersNpm {
  $modifies = @(git status --porcelain -- package.json package-lock.json | ForEach-Object { $_.Substring(3).Trim() })
  if ($modifies.Count -gt 0) {
    Alerte "Annulation des modifications locales de $($modifies -join ', ')."
    git checkout -- @modifies 2>$null
  }
}

function Verifier-Docker {
  cmd.exe /c "docker info >nul 2>&1"
  if ($LASTEXITCODE -ne 0) {
    Alerte "Docker n'est pas lancé. Ouvre Docker Desktop, attends qu'il soit prêt, puis relance ce script."
    Read-Host "Appuie sur Entrée pour fermer"
    exit 1
  }
  Info "Démarrage de la base de données…"
  Executer "docker compose up -d"
}

$serveur = $null
function Demarrer-Serveur {
  Info "Lancement de l'application sur http://localhost:3000"
  $script:serveur = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -NoNewWindow -PassThru
}
function Arreter-Serveur {
  if ($script:serveur -and -not $script:serveur.HasExited) {
    Info "Arrêt de l'application…"
    # /T arrête aussi les programmes lancés par npm (Node.js)
    cmd.exe /c "taskkill /PID $($script:serveur.Id) /T /F >nul 2>&1"
    Start-Sleep -Seconds 2
  }
  $script:serveur = $null
}

# Installe les bibliothèques et met la base à jour selon les fichiers modifiés.
function Preparer($fichiers, [switch]$Tout) {
  if ($Tout -or ($fichiers -match '^package(-lock)?\.json$')) {
    Info "Installation des bibliothèques (npm install)…"
    Executer "npm install --no-audit --no-fund"
    Nettoyer-FichiersNpm
  }
  if ($Tout -or ($fichiers -match '^drizzle/')) {
    Info "Mise à jour de la base de données…"
    Executer "npm run db:migrate"
  }
}

# Renvoie la liste des fichiers modifiés si une nouvelle version a été récupérée, sinon $null.
function Recuperer-NouvelleVersion {
  git fetch --quiet origin 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }   # pas de réseau : on réessaiera plus tard
  $local = git rev-parse HEAD
  $distant = git rev-parse "@{u}"
  if ($local -eq $distant) { return $null }

  Nettoyer-FichiersNpm
  git pull --ff-only --quiet
  if ($LASTEXITCODE -ne 0) {
    Alerte "La mise à jour a été bloquée par des modifications faites sur ce PC :"
    git status --short
    Alerte "Tape « git stash » dans une autre fenêtre PowerShell, le script réessaiera tout seul."
    return $null
  }
  $fichiers = git diff --name-only $local HEAD
  Succes "Nouvelle version récupérée : $(git log -1 --pretty=format:'%s')"
  return ,@($fichiers)
}

try {
  Write-Host ""
  Write-Host "  Passages CDI : démarrage automatique" -ForegroundColor White
  Write-Host "  Les nouvelles versions sont récupérées toutes seules. Ctrl + C pour arrêter." -ForegroundColor DarkGray
  Write-Host ""

  Verifier-Docker
  Nettoyer-FichiersNpm
  $null = Recuperer-NouvelleVersion
  Preparer @() -Tout
  Demarrer-Serveur

  while ($true) {
    Start-Sleep -Seconds $Intervalle
    $fichiers = Recuperer-NouvelleVersion
    if ($null -ne $fichiers) {
      Arreter-Serveur
      try { Preparer $fichiers }
      catch { Alerte $_.Exception.Message }
      Demarrer-Serveur
      Succes "Application à jour. Recharge la page dans le navigateur (F5)."
    }
    elseif ($serveur -and $serveur.HasExited) {
      Alerte "L'application s'est arrêtée. Nouvelle tentative dans $Intervalle secondes…"
      Demarrer-Serveur
    }
  }
}
catch {
  Alerte $_.Exception.Message
  Read-Host "Appuie sur Entrée pour fermer"
}
finally {
  Arreter-Serveur
}
