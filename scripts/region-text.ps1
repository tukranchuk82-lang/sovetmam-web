param([int]$Index = -1)
# Без -Index: печатает индекс + регион + тип + примерное число строк по каждому docx/xlsx.
# С -Index N: печатает ЧИСТЫЙ текст файла N (теги убраны). UTF-8.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = "c:\Таня\РАБОТА\Dev\SovetMam\_input_regions"
$files = @(Get-ChildItem -LiteralPath $src -File | Where-Object { $_.Extension -in '.docx', '.xlsx' } | Sort-Object Name)

function ZipText($zipPath, $entryName) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $e = $zip.Entries | Where-Object { $_.FullName -eq $entryName }
    if (-not $e) { return $null }
    $r = New-Object System.IO.StreamReader($e.Open()); $t = $r.ReadToEnd(); $r.Close(); return $t
  } finally { $zip.Dispose() }
}

function CleanDocx($path) {
  $xml = ZipText $path "word/document.xml"
  if (-not $xml) { return "" }
  # конец абзаца/строки таблицы -> перевод строки
  $xml = [regex]::Replace($xml, '</w:p>', "`n")
  $xml = [regex]::Replace($xml, '</w:tr>', "`n")
  $xml = [regex]::Replace($xml, '</w:tc>', " | ")
  $xml = [regex]::Replace($xml, '<[^>]+>', '')
  $xml = [System.Net.WebUtility]::HtmlDecode($xml)
  $lines = $xml -split "`n" | ForEach-Object { ($_ -replace '\s+', ' ').Trim(' |') } | Where-Object { $_ -ne '' }
  return ($lines -join "`n")
}

function CleanXlsx($path) {
  $ssXml = ZipText $path "xl/sharedStrings.xml"
  $out = @()
  if ($ssXml) {
    $sis = [regex]::Matches($ssXml, '<si>.*?</si>')
    foreach ($si in $sis) {
      $ts = [regex]::Matches($si.Value, '<t[^>]*>(.*?)</t>')
      $val = ($ts | ForEach-Object { $_.Groups[1].Value }) -join ''
      $val = [System.Net.WebUtility]::HtmlDecode($val).Trim()
      if ($val) { $out += $val }
    }
  }
  return ($out -join "`n")
}

function CleanText($f) {
  if ($f.Extension -eq '.docx') { return CleanDocx $f.FullName } else { return CleanXlsx $f.FullName }
}

function DetectRegion($text) {
  foreach ($line in ($text -split "`n")) {
    $l = $line.Trim()
    if ($l.Length -gt 2 -and $l.Length -lt 55 -and $l -match '(область|край|Республика|округ|Москва|Севастополь|Кузбасс|Югра|Якутия)') {
      return $l
    }
  }
  return "(?)"
}

if ($Index -ge 0) {
  $f = $files[$Index]
  Write-Output ("### Файл #$Index : " + $f.Extension)
  Write-Output (CleanText $f)
} else {
  for ($i = 0; $i -lt $files.Count; $i++) {
    $t = CleanText $files[$i]
    $reg = DetectRegion $t
    $cnt = ($t -split "`n").Count
    Write-Output ("{0,3} | {1,-40} | {2,-5} | строк ~{3}" -f $i, $reg, $files[$i].Extension, $cnt)
  }
}