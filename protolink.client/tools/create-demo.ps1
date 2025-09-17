param(
	[string]$BaseUrl = 'http://localhost:5000/api'
)

$ErrorActionPreference = 'Stop'

$base = $BaseUrl

function Invoke-JsonPost($url, $bodyObj, $headers = @{}) {
	$body = $bodyObj | ConvertTo-Json -Depth 20
	return Invoke-RestMethod -Method Post -Uri $url -Body $body -ContentType 'application/json' -Headers $headers
}

# Login
$loginResp = Invoke-JsonPost "$base/authentication/login" @{ login = 'admin'; password = 'admin' }
if (-not $loginResp.accessToken) { throw 'Login failed' }
$headers = @{ Authorization = ('Bearer ' + $loginResp.accessToken) }

# Create view entity
$viewAddResp = Invoke-JsonPost "$base/entities/AddEntity" @{ name='Demo View'; description='View entity'; code='demo-view'; codeIsUnique=$false; order=0; parentIds=@(); hidden=$false } $headers
$viewId = $viewAddResp.id
if (-not $viewId) { throw 'AddEntity (view) failed' }

# Attach JSX view script value (parented to predefined viewScriptValue id)
$script = @'
const React = window["react"];
window['{id}'] = class extends React.Component {
  render(){
    return (
      <div style={{ padding: 20, fontSize: 18 }}>
        Hello JSX demo for <b>{this.props.entityId}</b>
      </div>
    );
  }
};
'@

$predefViewScriptParent = [guid]'00010001-0000-0000-0000-000000000000'

$null = Invoke-JsonPost "$base/entities/UpdateEntity" @{ 
	id = $viewId
	name = 'Demo View'
	description = 'View entity'
	code = 'demo-view'
	viewIds = @()
	mainParentId = $null
	order = 0
	hidden = $false
	values = @(@{ id = [guid]::NewGuid(); type = 'StringValue'; value = $script; parents = @($predefViewScriptParent) })
} $headers

# Create page entity
$pageAddResp = Invoke-JsonPost "$base/entities/AddEntity" @{ name='Demo Page'; description='Demo page entity'; code='demo-page'; codeIsUnique=$false; order=0; parentIds=@(); hidden=$false } $headers
$pageId = $pageAddResp.id
if (-not $pageId) { throw 'AddEntity (page) failed' }

# Link view to page
$null = Invoke-JsonPost "$base/entities/UpdateEntity" @{ 
	id = $pageId
	name = 'Demo Page'
	description = 'Demo page entity'
	code = 'demo-page'
	viewIds = @([guid]$viewId)
	mainParentId = $null
	order = 0
	hidden = $false
	values = @()
} $headers

Write-Host ("OK pageId=$pageId viewId=$viewId")
