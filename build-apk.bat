@echo off
echo ===================================================
echo   Renault Megane IV Kokpit - Android APK Derleyici
echo ===================================================
echo.

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
set ANDROID_HOME=C:\android-sdk

echo [1/3] Web dosyalari guncelleniyor...
if exist "www" rmdir /s /q "www"
mkdir "www"
copy "index.html" "www\" >nul
copy "manifest.json" "www\" >nul
copy "sw.js" "www\" >nul
xcopy "css" "www\css\" /E /I /Q /Y >nul
xcopy "js" "www\js\" /E /I /Q /Y >nul
xcopy "assets" "www\assets\" /E /I /Q /Y >nul

echo [2/3] Capacitor Android senkronize ediliyor...
call npx cap sync android

echo [3/3] Android APK derleniyor (Gradle)...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "Megane4-Kokpit.apk" >nul
    echo.
    echo ===================================================
    echo  [BASARILI] Megane4-Kokpit.apk hazir!
    echo  Konum: %~dp0Megane4-Kokpit.apk
    echo ===================================================
) else (
    echo.
    echo [HATA] APK derlenirken bir sorun olustu.
)

pause
