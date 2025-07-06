@echo off
echo Instalando dependências do Ultimate Ticket...
echo.

echo [1/4] Instalando dependências do projeto root...
call npm install

echo.
echo [2/4] Instalando dependências do backend...
cd backend
call npm install

echo.
echo [3/4] Instalando dependências do frontend...
cd ..\frontend
call npm install

echo.
echo [4/4] Instalação concluída!
cd ..
echo.
echo Para iniciar o desenvolvimento, execute: npm run dev
echo Para fazer deploy, consulte o arquivo DEPLOY.md
echo.
pause 