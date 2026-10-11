@echo off
chcp 65001 >nul
echo ========================================================
echo     PHOTOWEB - TIỆN ÍCH SAO LƯU DỮ LIỆU NHANH
echo ========================================================
echo.

cd /d "D:\PhotoWeb"

echo Đang tiến hành tạo bản sao lưu cơ sở dữ liệu và cấu hình...
powershell -Command "$ts = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'; $dest = 'D:\PhotoWeb\storage\backups\photoweb_manual_backup_' + $ts + '.zip'; Compress-Archive -Path 'D:\PhotoWeb\storage\photoweb.db', 'D:\PhotoWeb\.env' -DestinationPath $dest; Write-Host '[THÀNH CÔNG] Đã tạo bản sao lưu tại:' $dest"

echo.
pause
