param([Parameter(Mandatory=$true)][string]$ProjectRoot)
$ErrorActionPreference = 'Stop'
$project=(Resolve-Path -LiteralPath $ProjectRoot).Path
$source=$PSScriptRoot
if (!(Test-Path -LiteralPath (Join-Path $project 'package.json'))) {throw 'Wrong project: package.json not found in this directory. Open the INNER arone-bd folder.'}
if (!(Test-Path -LiteralPath (Join-Path $project 'app/admin/layout.js'))) {throw 'Admin V2 layout.js is not installed at app/admin/layout.js.'}
if (!(Test-Path -LiteralPath (Join-Path $project 'app/admin/admin-v2.css'))) {throw 'Admin V2 CSS is missing: app/admin/admin-v2.css. Check the project folder.'}
$schemaPath=Join-Path $project 'prisma/schema.prisma'
if (!(Test-Path $schemaPath)) {throw 'Missing Prisma schema.'}
$utf8=New-Object System.Text.UTF8Encoding($false)
$schema=[System.IO.File]::ReadAllText($schemaPath)
if (-not $schema.Contains('model StockAdjustment {')) {throw 'Admin V2 stock migration/schema is missing. Install and verify Admin V2 first.'}
if ($schema.Contains('model CourierShipment {') -and (-not $schema.Contains('  shipment CourierShipment?') -or -not $schema.Contains('  courierEvents CourierShipmentEvent[]'))) {throw 'Partial courier schema detected. Inspect manually before rerunning.'}
if (-not $schema.Contains('model CourierShipment {')) {
 if (-not $schema.Contains('  stockAdjustments StockAdjustment[]') -or -not $schema.Contains('  items OrderItem[]')) {throw 'Expected V2 schema fields not found. Inspect Prisma schema before installing.'}
}
$timestamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$backup=Join-Path $project ('.courier-backup-'+$timestamp)
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach($relative in @('prisma/schema.prisma','app/admin/layout.js')) {
 $file=Join-Path $project $relative
 if(Test-Path -LiteralPath $file) {
  $destination=Join-Path $backup $relative
  New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
  Copy-Item -LiteralPath $file -Destination $destination -Force
 }
}
# Explicit file manifest; NEVER copy the extracted patch as a nested app/ or components/ directory.
$files=@(
 'app/admin/courier.css',
 'app/admin/courier/layout.js',
 'app/admin/courier/page.js',
 'app/admin/courier/[id]/page.js',
 'app/api/admin/courier/route.js',
 'app/api/admin/courier/[id]/route.js',
 'components/AdminCourier.jsx',
 'components/AdminCourierDetail.jsx',
 'lib/courier-rules.cjs',
 'prisma/migrations/202609290003_courier_management/migration.sql',
 'tests/courier-rules.test.cjs'
)
foreach($relative in $files){
 $from=Join-Path $source $relative
 if(!(Test-Path -LiteralPath $from)){throw "Missing patch file: $relative"}
}
if(!(Test-Path -LiteralPath (Join-Path $source 'REFERENCE-ONLY/CourierSchemaExtension.txt'))){throw 'Schema extension missing from patch.'}
foreach($relative in $files){
 $from=Join-Path $source $relative
 $to=Join-Path $project $relative
 if(Test-Path -LiteralPath $to){
  $saved=Join-Path $backup $relative
  [System.IO.Directory]::CreateDirectory((Split-Path $saved -Parent)) | Out-Null
  [System.IO.File]::Copy($to,$saved,$true)
 }
 [System.IO.Directory]::CreateDirectory((Split-Path $to -Parent)) | Out-Null
 [System.IO.File]::Copy($from,$to,$true)
}
# Update existing Prisma schema additively; preserve other models/changes.
if(-not $schema.Contains('model CourierShipment {')){
 $userMarker='  stockAdjustments StockAdjustment[]'
 $orderMarker='  items OrderItem[]'
 if(-not $schema.Contains($userMarker)){throw 'Expected User.stockAdjustments field not found. Restore backup and inspect schema.'}
 if(-not $schema.Contains($orderMarker)){throw 'Expected Order.items field not found. Restore backup and inspect schema.'}
 $at=$schema.IndexOf($userMarker)
 $schema=$schema.Substring(0,$at)+$userMarker+"`n  courierEvents CourierShipmentEvent[]"+$schema.Substring($at+$userMarker.Length)
 $schema=$schema.Replace($orderMarker, $orderMarker+"`n  shipment CourierShipment?")
 $extension=[System.IO.File]::ReadAllText((Join-Path $source 'REFERENCE-ONLY/CourierSchemaExtension.txt'))
 $schema=$schema.TrimEnd()+"`n`n"+$extension.Trim()+"`n"
 [System.IO.File]::WriteAllText($schemaPath,$schema,$utf8)
}
# Insert just the navigation link without overwriting the user's current Admin V2 layout.
$layoutPath=Join-Path $project 'app/admin/layout.js'
$layout=[System.IO.File]::ReadAllText($layoutPath)
if(-not $layout.Contains("href:'/admin/courier'")){
 $pattern="(?m)^(\s*\{href:'/admin/invoices'[^\r\n]*\},?)"
 if([regex]::IsMatch($layout,$pattern)){
  $match=[regex]::Match($layout,$pattern)
  $newLink="`n  {href:'/admin/courier',icon:'↗',label:'Courier & Delivery'},"
  $layout=$layout.Substring(0,$match.Index+$match.Length)+$newLink+$layout.Substring($match.Index+$match.Length)
  [System.IO.File]::WriteAllText($layoutPath,$layout,$utf8)
 } else { Write-Warning 'Sidebar format differs; direct URL /admin/courier is available. Add a link manually.' }
}
Write-Host 'Courier Phase 2 files installed into the correct project root.' -ForegroundColor Green
Write-Host "Backup saved at: $backup"
Write-Host 'NEXT: Back up your Neon database. Then run npm run db:deploy; npm run db:generate; npm test; npm run dev'
Write-Host 'DO NOT run db:seed, db:reset or prisma migrate dev on live data.'
