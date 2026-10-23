$ErrorActionPreference = 'Continue'

# Folder name "Фото для проекта" built from Unicode code points (ASCII-safe script)
$folder = -join ([char[]](0x0424,0x043E,0x0442,0x043E,0x20,0x0434,0x043B,0x044F,0x20,0x043F,0x0440,0x043E,0x0435,0x043A,0x0442,0x0430))
New-Item -ItemType Directory -Force -Path $folder | Out-Null

$pairs = @(
  @{ n = '01-everest.jpg';        u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mt._Everest_from_Gokyo_Ri_November_5%2C_2012.jpg?width=600' },
  @{ n = '02-k2.jpg';             u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Chogori.jpg?width=600' },
  @{ n = '03-kanchenjunga.jpg';   u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Kangchenjunga_PangPema.JPG?width=600' },
  @{ n = '04-lhotse.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Lhotse-fromChukhungRi.jpg?width=600' },
  @{ n = '05-makalu.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Makalu.jpg?width=600' },
  @{ n = '06-chooyu.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Chooyu.jpg?width=600' },
  @{ n = '07-dhaulagiri.jpg';     u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Dhaulagiri_-_view_from_aircraft.jpg?width=600' },
  @{ n = '08-manaslu.jpg';        u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Sunrise%2C_Manaslu.jpg?width=600' },
  @{ n = '09-nangaparbat.jpg';    u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Fairy_Meadows_and_the_view_of_Nanga_Parbat.jpg?width=600' },
  @{ n = '10-annapurna.jpg';      u = 'https://commons.wikimedia.org/wiki/Special:FilePath/South_Face_of_Annapurna_I_%28Main%29.jpg?width=600' },
  @{ n = '11-shishapangma.jpg';   u = 'https://commons.wikimedia.org/wiki/Special:FilePath/8%2C013m_Shishapangma_Tibet_China_%E8%A5%BF%E8%97%8F_%E5%B8%8C%E5%A4%8F%E9%82%A6%E9%A9%AC%E5%B3%B0_-_panoramio.jpg?width=600' },
  @{ n = '12-gasherbrum.jpg';     u = 'https://commons.wikimedia.org/wiki/Special:FilePath/HiddenPeak.jpg?width=600' },
  @{ n = '13-broadpeak.jpg';      u = 'https://commons.wikimedia.org/wiki/Special:FilePath/7_15_BroadPeak.jpg?width=600' },
  @{ n = '14-montblanc.jpg';      u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mont_Blanc_Aiguille.jpg?width=600' },
  @{ n = '15-matterhorn.jpg';     u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=600' },
  @{ n = '16-elbrus.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mount_Elbrus_%28cropped%29.jpg?width=600' },
  @{ n = '17-kazbek.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/%D0%93%D0%BE%D1%80%D0%B0_%D0%9A%D0%B0%D0%B7%D0%B1%D0%B5%D0%BA%2C_%D0%93%D1%80%D1%83%D0%B7%D0%B8%D1%8F.jpg?width=600' },
  @{ n = '18-aconcagua.jpg';      u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Aconcagua2016.jpg?width=600' },
  @{ n = '19-denali.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Wonder_Lake_and_Denali.jpg?width=600' },
  @{ n = '20-kilimanjaro.jpg';    u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Kilimanjaro_from_Amboseli.jpg?width=600' },
  @{ n = '21-ayudag.jpg';         u = 'https://commons.wikimedia.org/wiki/Special:FilePath/Artek001.jpg?width=600' },
  @{ n = '22-belukha.jpg';        u = 'https://commons.wikimedia.org/wiki/Special:FilePath/2006-07_altaj_belucha.jpg?width=600' }
)

$count = 0
foreach ($p in $pairs) {
  $dest = Join-Path $folder $p.n
  if (Test-Path $dest) {
    Write-Host ("SKIP {0} (already exists)" -f $p.n)
    continue
  }
  try {
    Invoke-WebRequest -Uri $p.u -OutFile $dest -UseBasicParsing -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    $bytes = [System.IO.File]::ReadAllBytes($dest)
    $isJpeg = $bytes.Length -gt 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8
    if ($isJpeg) {
      Write-Host ("OK   {0}  {1} bytes (JPEG)" -f $p.n, $bytes.Length)
      $count++
    } else {
      Write-Host ("WARN {0}  not a JPEG, {1} bytes (probably an error page)" -f $p.n, $bytes.Length)
    }
  } catch {
    Write-Host ("FAIL {0} :: {1}" -f $p.n, $_.Exception.Message)
  }
  Start-Sleep -Milliseconds 350
}

Write-Host ("`nDone. Valid JPEGs downloaded: {0}/22" -f $count)