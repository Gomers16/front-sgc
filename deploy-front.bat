@echo off
echo Subiendo dist al servidor...
scp -r "C:\Users\Diego Gomez\front-sgc\dist" deploy@activautossgc.org:/home/deploy/apps/frontend-sgc/

echo Aplicando permisos...
ssh deploy@activautossgc.org "chmod -R 755 /home/deploy/apps/frontend-sgc/dist/"

echo Listo!
