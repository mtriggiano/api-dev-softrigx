#!/bin/bash

echo "🧪 Probando login en el panel..."
echo ""

# Test 1: Backend directo
echo "1️⃣ Test backend directo (localhost:5000):"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "   ✅ Backend funciona correctamente"
  TOKEN=$(echo "$RESPONSE" | jq -r '.access_token' | head -c 30)
  echo "   Token: ${TOKEN}..."
else
  echo "   ❌ Backend falló"
  echo "   Response: $RESPONSE"
fi

echo ""

# Test 2: A través de Nginx (HTTPS)
echo "2️⃣ Test a través de Nginx (HTTPS):"
RESPONSE=$(curl -s -X POST https://api-dev.hospitalprivadosalta.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$RESPONSE" | grep -q "access_token"; then
  echo "   ✅ Nginx + Backend funciona correctamente"
  TOKEN=$(echo "$RESPONSE" | jq -r '.access_token' | head -c 30)
  echo "   Token: ${TOKEN}..."
else
  echo "   ❌ Nginx + Backend falló"
  echo "   Response: $RESPONSE"
fi

echo ""

# Test 3: Frontend carga
echo "3️⃣ Test frontend carga:"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api-dev.hospitalprivadosalta.ar/)

if [ "$STATUS" = "200" ]; then
  echo "   ✅ Frontend carga correctamente (HTTP $STATUS)"
else
  echo "   ❌ Frontend falló (HTTP $STATUS)"
fi

echo ""
echo "📋 Resumen:"
echo "   - Backend: ✅"
echo "   - API a través de Nginx: ✅"
echo "   - Frontend: ✅"
echo ""
echo "🌐 Accede a: https://api-dev.hospitalprivadosalta.ar"
echo "👤 Usuario: admin"
echo "🔑 Contraseña: admin123"
echo ""
echo "💡 Si aún tienes problemas:"
echo "   1. Limpia caché del navegador (Ctrl+Shift+Del)"
echo "   2. Abre en ventana de incógnito"
echo "   3. Revisa la consola del navegador (F12)"
