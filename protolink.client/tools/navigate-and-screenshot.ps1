param(
	[string]$AutomationApiBase = 'http://localhost:7000/api/web',
	[string]$Url,
	[switch]$FullPage
)

$ErrorActionPreference = 'Stop'
if (-not $Url) { throw 'Url is required' }

function JsonPost($url, $obj) {
	$body = $obj | ConvertTo-Json -Depth 10
	Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType 'application/json'
}

# Navigate
JsonPost ($AutomationApiBase + '/navigate') @{ url = $Url } | Out-Null
Start-Sleep -Seconds 2

# Screenshot auto-paste
if ($FullPage) {
	JsonPost ($AutomationApiBase + '/screenshot-auto-paste') @{ fullPage = $true } | Out-Null
} else {
	JsonPost ($AutomationApiBase + '/screenshot-auto-paste') @{ } | Out-Null
}

Write-Host "DONE"
