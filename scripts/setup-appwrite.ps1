# MindMesh Appwrite Setup Script
# Run: .\scripts\setup-appwrite.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MindMesh - Appwrite Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Appwrite CLI is installed
Write-Host "[1/5] Checking Appwrite CLI..." -ForegroundColor Yellow
try {
    $cliVersion = appwrite -v 2>&1
    Write-Host "  Appwrite CLI found: $cliVersion" -ForegroundColor Green
} catch {
    Write-Host "  Appwrite CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g appwrite-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed to install Appwrite CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Appwrite CLI installed" -ForegroundColor Green
}

# 2. Login (skip if already logged in)
Write-Host "[2/5] Checking Appwrite login..." -ForegroundColor Yellow
try {
    $whoami = appwrite whoami 2>&1
    if ($whoami -match "Not logged in") {
        Write-Host "  Not logged in. Please login..." -ForegroundColor Yellow
        appwrite login
    } else {
        Write-Host "  Already logged in" -ForegroundColor Green
    }
} catch {
    Write-Host "  Please login to Appwrite..." -ForegroundColor Yellow
    appwrite login
}

# 3. Initialize project config (if not exists)
Write-Host "[3/5] Initializing project config..." -ForegroundColor Yellow
$configPath = Join-Path $PSScriptRoot ".." "appwrite.config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "  Creating appwrite.config.json..." -ForegroundColor Yellow
    
    # Read from .env
    $envContent = Get-Content (Join-Path $PSScriptRoot ".." ".env") -Raw
    $projectId = if ($envContent -match 'NEXT_PUBLIC_APPWRITE_PROJECT_ID\s*=\s*"([^"]+)"') { $Matches[1] } else { "" }
    $dbName = if ($envContent -match 'NEXT_PUBLIC_APPWRITE_DATABASE_ID\s*=\s*"([^"]+)"') { $Matches[1] } else { "" }
    $bucketId = if ($envContent -match 'NEXT_PUBLIC_APPWRITE_BUCKET_ID\s*=\s*"([^"]+)"') { $Matches[1] } else { "" }

    $config = @{
        projectId = $projectId
        projectName = "MindMesh"
        endpoint = "https://fra.cloud.appwrite.io/v1"
        includes = @{
            functions = "appwrite/functions.json"
        }
        settings = @{
            services = @{
                account = $true
                databases = $true
                functions = $true
                storage = $true
                messaging = $true
            }
            auth = @{
                methods = @{
                    "email-password" = $true
                    "magic-url" = $true
                }
                security = @{
                    sessionsLimit = 10
                    passwordDictionary = $true
                }
            }
        }
        tablesDB = @()
        tables = @()
        buckets = @(
            @{
                "$id" = $bucketId
                name = "MindMesh Storage"
                enabled = $true
                maximumFileSizeBytes = 10485760
                allowedFileExtensions = @()
                encryption = $true
                antivirus = $true
            }
        )
        teams = @()
        topics = @()
    } | ConvertTo-Json -Depth 10

    Set-Content -Path $configPath -Value $config
    Write-Host "  Created appwrite.config.json" -ForegroundColor Green
} else {
    Write-Host "  appwrite.config.json already exists" -ForegroundColor Green
}

# 4. Create appwrite directory for function definitions
Write-Host "[4/5] Setting up appwrite directories..." -ForegroundColor Yellow
$appwriteDir = Join-Path $PSScriptRoot ".." "appwrite"
if (-not (Test-Path $appwriteDir)) {
    New-Item -ItemType Directory -Path $appwriteDir -Force | Out-Null
    Write-Host "  Created appwrite/ directory" -ForegroundColor Green
}

$functionsDir = Join-Path $appwriteDir "functions"
if (-not (Test-Path $functionsDir)) {
    New-Item -ItemType Directory -Path $functionsDir -Force | Out-Null
    Write-Host "  Created appwrite/functions/ directory" -ForegroundColor Green
}

# Create functions.json if not exists
$functionsConfig = Join-Path $appwriteDir "functions.json"
if (-not (Test-Path $functionsConfig)) {
    Set-Content -Path $functionsConfig -Value "[]"
    Write-Host "  Created appwrite/functions.json" -ForegroundColor Green
}

# 5. Link project
Write-Host "[5/5] Linking project..." -ForegroundColor Yellow
$envContent = Get-Content (Join-Path $PSScriptRoot ".." ".env") -Raw
$projectId = if ($envContent -match 'NEXT_PUBLIC_APPWRITE_PROJECT_ID\s*=\s*"([^"]+)"') { $Matches[1] } else { "" }
$endpoint = if ($envContent -match 'NEXT_PUBLIC_APPWRITE_ENDPOINT\s*=\s*"([^"]+)"') { $Matches[1] } else { "" }

if ($projectId -and $endpoint) {
    appwrite client --endpoint $endpoint --project-id $projectId
    Write-Host "  Project linked" -ForegroundColor Green
} else {
    Write-Host "  Warning: Could not read project config from .env" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project ID:     $projectId" -ForegroundColor White
Write-Host "Endpoint:       $endpoint" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'appwrite pull all --all' to sync existing resources" -ForegroundColor White
Write-Host "  2. Add functions to appwrite/functions.json" -ForegroundColor White
Write-Host "  3. Deploy with 'appwrite push all --all'" -ForegroundColor White
Write-Host ""
