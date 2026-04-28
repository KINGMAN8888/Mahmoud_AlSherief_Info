# سكريبت التحديث التلقائي (Auto Update Script)
# تأكد من حفظ التعديلات وتغيير IP الخادم قبل التشغيل

$VPS_IP = "YOUR_VPS_IP" # <<< قم بتغيير هذا إلى IP الخادم الخاص بك (مثال: 194.164.77.100)

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  بدء عملية التحديث للنظام..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan

# 1. إضافة وتأكيد الملفات في جيت هاب
Write-Host "`n[1/2] رفع التحديثات إلى GitHub..." -ForegroundColor Yellow
cd "f:\Dashboard my father"
git add .
git commit -m "chore: auto update from local script"
git push origin main

# 2. الاتصال بالخادم وجلب التحديثات وبناء المشروع
Write-Host "`n[2/2] الاتصال بالخادم وتطبيق التحديثات وبناء المشروع..." -ForegroundColor Yellow

$SSH_COMMAND = "cd /var/www/vcard && git pull origin main && cd frontend && npm install && npm run build && cd ../backend && npm install --omit=dev && pm2 restart vcard"

ssh root@$VPS_IP $SSH_COMMAND

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "  تم التحديث بنجاح! ✅" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
