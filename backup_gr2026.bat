@echo off
:: ================================================
:: BACKUP DATABASE GR2026 - Railway MySQL
:: Klik 2x untuk jalankan backup
:: ================================================

set HOST=shinkansen.proxy.rlwy.net
set PORT=29975
set USER=root
set PASSWORD=tXpyyHhIBEzxLXrbhrbLmnIQgcZUBKnb
set DATABASE=railway
set MYSQLDUMP=C:\mysql-9.7.0-winx64\bin\mysqldump.exe

:: Buat folder backup kalau belum ada
if not exist "C:\Projects\job-fair-planner\backup-db" mkdir "C:\Projects\job-fair-planner\backup-db"

:: Format nama file dengan tanggal dan jam
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%

set FILENAME=C:\Projects\job-fair-planner\backup-db\gr2026_%TIMESTAMP%.sql

echo ================================================
echo   BACKUP DATABASE GR2026
echo   %date% %time%
echo ================================================
echo.
echo Memulai backup ke:
echo %FILENAME%
echo.

"%MYSQLDUMP%" -h %HOST% -P %PORT% -u %USER% -p%PASSWORD% --protocol=TCP --ssl-mode=DISABLED %DATABASE% > "%FILENAME%"

if %ERRORLEVEL% == 0 (
    echo.
    echo ================================================
    echo   BACKUP BERHASIL!
    echo   File: gr2026_%TIMESTAMP%.sql
    echo ================================================
) else (
    echo.
    echo ================================================
    echo   BACKUP GAGAL! Cek koneksi internet.
    echo ================================================
)

echo.
pause
