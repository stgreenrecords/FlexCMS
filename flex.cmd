@echo off
REM FlexCMS CLI wrapper for Windows CMD / PowerShell
REM Usage: flex start local all
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0flex.ps1" %*
