param([ValidateSet('dev','build')][string]$Mode = 'dev')
$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
$taskNode = Get-Command node -ErrorAction SilentlyContinue
if ($taskNode) {
    $taskNodePath = $taskNode.Source
} else {
    $taskNodePath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $taskNodePath)) {
        throw 'Chưa có Node.js. Hãy cài Node.js phù hợp với Vite và mở lại PowerShell.'
    }
}
$taskVitePath = Join-Path $taskProjectRoot 'frontend\node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $taskVitePath)) {
    throw 'Chưa cài gói frontend. Vào thư mục frontend và chạy npm install trước.'
}
Push-Location (Join-Path $taskProjectRoot 'frontend')
try {
    & $taskNodePath $taskVitePath $Mode
    if ($LASTEXITCODE -ne 0) { throw 'Frontend khởi động/đóng gói thất bại.' }
} finally {
    Pop-Location
}
