param(
	[string]$AutomationApiBase = 'http://localhost:6000/api/web',
	[string]$HomeUrl,
	[string]$AdminUrl
)

$ErrorActionPreference = 'Stop'

function JsonPost($url, $obj) {
	$body = $obj | ConvertTo-Json -Depth 10
	Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType 'application/json'
}

if (-not $HomeUrl) { throw 'HomeUrl is required' }
if (-not $AdminUrl) { throw 'AdminUrl is required' }

# Navigate Home and screenshot
JsonPost ($AutomationApiBase + '/navigate') @{ url = $HomeUrl } | Out-Null
Start-Sleep -Seconds 2
JsonPost ($AutomationApiBase + '/screenshot-auto-paste') @{ fullPage = $true } | Out-Null
$homeErrors = Invoke-RestMethod -Method Get -Uri ($AutomationApiBase.Replace('/web','/web/console-errors'))
$homeNet = Invoke-RestMethod -Method Get -Uri ($AutomationApiBase.Replace('/web','/web/network-requests'))

# Navigate Admin and screenshot
JsonPost ($AutomationApiBase + '/navigate') @{ url = $AdminUrl } | Out-Null
Start-Sleep -Seconds 2
JsonPost ($AutomationApiBase + '/screenshot-auto-paste') @{ fullPage = $true } | Out-Null
$adminErrors = Invoke-RestMethod -Method Get -Uri ($AutomationApiBase.Replace('/web','/web/console-errors'))
$adminNet = Invoke-RestMethod -Method Get -Uri ($AutomationApiBase.Replace('/web','/web/network-requests'))

"HOME_ERRORS=" + (($homeErrors | ConvertTo-Json -Depth 5))
"HOME_NET_COUNT=" + ($homeNet.Count)
"ADMIN_ERRORS=" + (($adminErrors | ConvertTo-Json -Depth 5))
"ADMIN_NET_COUNT=" + ($adminNet.Count)
