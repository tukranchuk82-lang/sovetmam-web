# Извлекает из docx/xlsx файлов папки _input_regions тройки {file, region, title, link}
# и пишет в scripts/_regions.json (UTF-8). Запуск: powershell -File scripts/extract-regions.ps1
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src = "c:\Таня\РАБОТА\Dev\SovetMam\_input_regions"
$out = "c:\Таня\РАБОТА\Dev\SovetMam\sovetmam-web\scripts\_regions.json"

function Get-ZipEntryText($zipPath, $entryName) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq $entryName }
    if (-not $entry) { return $null }
    $r = New-Object System.IO.StreamReader($entry.Open())
    $t = $r.ReadToEnd(); $r.Close(); return $t
  } finally { $zip.Dispose() }
}

function CellText($tcXml) {
  $m = [regex]::Matches($tcXml, '<w:t[^>]*>(.*?)</w:t>')
  $s = ($m | ForEach-Object { $_.Groups[1].Value }) -join ''
  return [System.Net.WebUtility]::HtmlDecode($s).Trim()
}

function Parse-Docx($path) {
  $xml = Get-ZipEntryText $path "word/document.xml"
  if (-not $xml) { return @() }
  $rows = [regex]::Matches($xml, '<w:tr[ >].*?</w:tr>')
  $result = @()
  foreach ($row in $rows) {
    $cells = [regex]::Matches($row.Value, '<w:tc[ >].*?</w:tc>')
    if ($cells.Count -lt 2) { continue }
    $c = @(); foreach ($cell in $cells) { $c += (CellText $cell.Value) }
    $result += ,@($c)
  }
  return $result
}

function ColLetter($ref) { return ($ref -replace '[0-9]', '') }

function Parse-Xlsx($path) {
  $shared = @()
  $ssXml = Get-ZipEntryText $path "xl/sharedStrings.xml"
  if ($ssXml) {
    # каждый <si> может содержать несколько <t>
    $sis = [regex]::Matches($ssXml, '<si>.*?</si>')
    foreach ($si in $sis) {
      $ts = [regex]::Matches($si.Value, '<t[^>]*>(.*?)</t>')
      $val = ($ts | ForEach-Object { $_.Groups[1].Value }) -join ''
      $shared += [System.Net.WebUtility]::HtmlDecode($val)
    }
  }
  # ищем первый лист
  $sheetName = "xl/worksheets/sheet1.xml"
  $sheetXml = Get-ZipEntryText $path $sheetName
  if (-not $sheetXml) { return @() }
  $rowsM = [regex]::Matches($sheetXml, '<row[ >].*?</row>')
  $result = @()
  foreach ($rowM in $rowsM) {
    $cellsM = [regex]::Matches($rowM.Value, '<c [^>]*r="([A-Z]+)\d+"[^>]*?(t="[^"]*")?\s*>\s*(?:<v>(.*?)</v>|<is><t[^>]*>(.*?)</t></is>)?\s*</c>')
    $map = @{}
    foreach ($cm in $cellsM) {
      $col = $cm.Groups[1].Value
      $tattr = $cm.Groups[2].Value
      $v = $cm.Groups[3].Value
      $inline = $cm.Groups[4].Value
      $text = ''
      if ($tattr -match 's') { if ($v -ne '') { $idx = [int]$v; if ($idx -lt $shared.Count) { $text = $shared[$idx] } } }
      elseif ($inline -ne '') { $text = [System.Net.WebUtility]::HtmlDecode($inline) }
      elseif ($v -ne '') { $text = $v }
      $map[$col] = $text.Trim()
    }
    $a = if ($map.ContainsKey('A')) { $map['A'] } else { '' }
    $b = if ($map.ContainsKey('B')) { $map['B'] } else { '' }
    $cc = if ($map.ContainsKey('C')) { $map['C'] } else { '' }
    if ($a -or $b -or $cc) { $result += ,@($a, $b, $cc) }
  }
  return $result
}

$all = @()
$files = Get-ChildItem -LiteralPath $src -File | Where-Object { $_.Extension -in '.docx', '.xlsx' }
foreach ($f in $files) {
  try {
    $rows = if ($f.Extension -eq '.docx') { Parse-Docx $f.FullName } else { Parse-Xlsx $f.FullName }
  } catch { Write-Output "ОШИБКА в $($f.Name): $_"; continue }
  # регион — первое непустое значение колонки 0, не равное заголовку
  $regionFallback = $null
  foreach ($r in $rows) {
    $a = $r[0]
    if ($a -and $a -ne 'Регион' -and $a.Length -gt 2 -and $a.Length -lt 60) { $regionFallback = $a; break }
  }
  foreach ($r in $rows) {
    $region = if ($r[0] -and $r[0] -ne 'Регион') { $r[0] } else { $regionFallback }
    $title = if ($r.Count -ge 2) { $r[1] } else { '' }
    $link = if ($r.Count -ge 3) { $r[2] } else { '' }
    # пропускаем заголовки и пустые
    if (-not $title) { continue }
    if ($title -in 'Мера поддержки', 'Мера социальной поддержки', 'Наименование меры', 'Меры поддержки') { continue }
    if ($title.Length -lt 8) { continue }
    $all += [PSCustomObject]@{ file = $f.Name; region = $region; title = $title; link = $link }
  }
}

$json = $all | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($out, $json, (New-Object System.Text.UTF8Encoding($false)))

Write-Output "Извлечено строк: $($all.Count)"
Write-Output "Файлов обработано: $($files.Count)"
Write-Output "--- По регионам ---"
$all | Group-Object region | Sort-Object Name | ForEach-Object { "{0,-45} {1}" -f $_.Name, $_.Count }