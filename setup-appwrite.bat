@echo off
echo Running Appwrite setup...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-appwrite.ps1"
pause
