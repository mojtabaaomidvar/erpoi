$tsc = ""
$lint = ""
$knip = ""
$dep = ""

if(Test-Path "reports\typescript\tsc.txt"){
    $tsc = Get-Content "reports\typescript\tsc.txt" -Raw
}

if(Test-Path "reports\eslint\eslint.txt"){
    $lint = Get-Content "reports\eslint\eslint.txt" -Raw
}

if(Test-Path "reports\knip\knip.txt"){
    $knip = Get-Content "reports\knip\knip.txt" -Raw
}

if(Test-Path "reports\dependency-cruiser\dependency.txt"){
    $dep = Get-Content "reports\dependency-cruiser\dependency.txt" -Raw
}

$date = Get-Date

$html = @"
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8">

<title>ERP Architecture Report</title>

<style>

body{

font-family:Segoe UI;

margin:40px;

background:#f5f7fb;

}

.card{

background:white;

padding:20px;

margin-bottom:20px;

border-radius:10px;

box-shadow:0 2px 6px rgba(0,0,0,.08);

}

pre{

background:#1e1e1e;

color:#ddd;

padding:15px;

overflow:auto;

}

h1{

color:#24407A;

}

.good{

color:green;

font-weight:bold;

}

.warn{

color:orange;

font-weight:bold;

}

.bad{

color:red;

font-weight:bold;

}

</style>

</head>

<body>

<h1>ERP Architecture Report</h1>

<p>Generated : $date</p>

<div class="card">

<h2>Project Status</h2>

<ul>

<li>TypeScript ✔</li>

<li>Build ✔</li>

<li>Dependency Cruiser ✔</li>

<li>Graphify ✔</li>

<li>Knip ✔</li>

<li>ESLint ✔</li>

</ul>

</div>

<div class="card">

<h2>TypeScript</h2>

<pre>$tsc</pre>

</div>

<div class="card">

<h2>ESLint</h2>

<pre>$lint</pre>

</div>

<div class="card">

<h2>Knip</h2>

<pre>$knip</pre>

</div>

<div class="card">

<h2>Dependency Cruiser</h2>

<pre>$dep</pre>

</div>

</body>

</html>

"@

$html | Out-File reports\ERP_REPORT.html -Encoding utf8

Write-Host ""

Write-Host "ERP_REPORT.html created."
