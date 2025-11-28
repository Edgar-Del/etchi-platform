#!/bin/bash

# Script de Teste Completo do Backend Etchi
# Testa todas as funcionalidades do sistema após correção do login

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
TOTAL=0
WARNINGS=0

# Função para fazer requisições e verificar resultado
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local token=$6
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "\n${YELLOW}▶ Testando: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ -n "$token" ] && [ "$token" != "null" ] && [ "$token" != "" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${token}" \
                -d "$data" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Authorization: Bearer ${token}" 2>/dev/null)
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data" 2>/dev/null)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" 2>/dev/null)
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC} (Esperado: $expected_status, Recebido: $http_code)"
        FAILED=$((FAILED + 1))
        echo "$body" | jq -r '.message // .error // "Erro desconhecido"' 2>/dev/null | head -1
        return 1
    fi
}

# Função para extrair token da resposta
extract_token() {
    local response=$1
    echo "$response" | jq -r '.data.data.access_token // .data.access_token // .access_token // empty' 2>/dev/null
}

# Função para extrair ID da resposta
extract_id() {
    local response=$1
    local field=${2:-"_id"}
    echo "$response" | jq -r ".data.${field} // .data.data.${field} // .${field} // empty" 2>/dev/null | head -1
}

echo "=========================================="
echo "  TESTE COMPLETO DO BACKEND ETCHI"
echo "  Data: $(date)"
echo "=========================================="
echo ""

# Verificar se o servidor está rodando
echo -e "${BLUE}Verificando servidor...${NC}"
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Servidor não está rodando em ${BASE_URL}${NC}"
    echo "Por favor, inicie o servidor com: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Servidor está rodando!${NC}\n"

# Gerar dados únicos
TIMESTAMP=$(date +%s)
RANDOM_PHONE=$(python3 -c "import random; print(str(random.randint(1, 9)) + ''.join([str(random.randint(0, 9)) for _ in range(7)]))" 2>/dev/null || echo "1234567")
CLIENT_EMAIL="test.client.$TIMESTAMP@etchi.com"
CLIENT_PHONE="+2449$RANDOM_PHONE"
COURIER_EMAIL="test.courier.$TIMESTAMP@etchi.com"
COURIER_PHONE="+2449$(python3 -c "import random; print(str(random.randint(1, 9)) + ''.join([str(random.randint(0, 9)) for _ in range(7)]))" 2>/dev/null || echo "7654321")"

# ============================================
# 1. HEALTH CHECK
# ============================================
echo "=========================================="
echo "1. HEALTH CHECK"
echo "=========================================="
test_endpoint "GET" "/health" "" 200 "Health Check"

# ============================================
# 2. AUTENTICAÇÃO
# ============================================
echo ""
echo "=========================================="
echo "2. AUTENTICAÇÃO"
echo "=========================================="

# Registrar Cliente
echo -e "\n${BLUE}Registrando cliente...${NC}"
CLIENT_REGISTER_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
  \"email\": \"${CLIENT_EMAIL}\",
  \"password\": \"1234567890\",
  \"name\": \"Cliente Teste\",
  \"phone\": \"${CLIENT_PHONE}\",
  \"role\": \"client\"
}")

if echo "$CLIENT_REGISTER_RESP" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Cliente registrado${NC}"
    CLIENT_TOKEN=$(extract_token "$CLIENT_REGISTER_RESP")
    CLIENT_ID=$(extract_id "$CLIENT_REGISTER_RESP" "user._id")
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}✗ Falha no registro do cliente${NC}"
    echo "$CLIENT_REGISTER_RESP" | jq -r '.message' 2>/dev/null
    CLIENT_TOKEN=""
    CLIENT_ID=""
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
fi

# Registrar Courier
echo -e "\n${BLUE}Registrando courier...${NC}"
COURIER_REGISTER_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
  \"email\": \"${COURIER_EMAIL}\",
  \"password\": \"1234567890\",
  \"name\": \"Courier Teste\",
  \"phone\": \"${COURIER_PHONE}\",
  \"role\": \"courier\"
}")

if echo "$COURIER_REGISTER_RESP" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Courier registrado${NC}"
    COURIER_TOKEN=$(extract_token "$COURIER_REGISTER_RESP")
    COURIER_ID=$(extract_id "$COURIER_REGISTER_RESP" "user._id")
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
else
    echo -e "  ${RED}✗ Falha no registro do courier${NC}"
    echo "$COURIER_REGISTER_RESP" | jq -r '.message' 2>/dev/null
    COURIER_TOKEN=""
    COURIER_ID=""
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
fi

# Login Cliente
if [ -n "$CLIENT_EMAIL" ]; then
    test_endpoint "POST" "/auth/login" "{
      \"email\": \"${CLIENT_EMAIL}\",
      \"password\": \"1234567890\"
    }" 200 "Login Cliente"
    
    # Obter token do login se não foi obtido do registro
    if [ -z "$CLIENT_TOKEN" ] || [ "$CLIENT_TOKEN" = "null" ]; then
        LOGIN_RESP=$(curl -s -X POST "${BASE_URL}/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\": \"${CLIENT_EMAIL}\", \"password\": \"1234567890\"}")
        CLIENT_TOKEN=$(extract_token "$LOGIN_RESP")
    fi
fi

# Login Courier
if [ -n "$COURIER_EMAIL" ]; then
    test_endpoint "POST" "/auth/login" "{
      \"email\": \"${COURIER_EMAIL}\",
      \"password\": \"1234567890\"
    }" 200 "Login Courier"
    
    # Obter token do login se não foi obtido do registro
    if [ -z "$COURIER_TOKEN" ] || [ "$COURIER_TOKEN" = "null" ]; then
        LOGIN_RESP=$(curl -s -X POST "${BASE_URL}/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\": \"${COURIER_EMAIL}\", \"password\": \"1234567890\"}")
        COURIER_TOKEN=$(extract_token "$LOGIN_RESP")
    fi
fi

# Obter Perfil (Me)
if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    test_endpoint "GET" "/auth/me" "" 200 "Obter Perfil (Me)" "$CLIENT_TOKEN"
fi

# Forgot Password
test_endpoint "POST" "/auth/forgot-password" "{
  \"email\": \"${CLIENT_EMAIL}\"
}" 200 "Solicitar Reset de Senha"

# ============================================
# 3. USUÁRIOS
# ============================================
echo ""
echo "=========================================="
echo "3. USUÁRIOS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ] && [ -n "$CLIENT_ID" ]; then
    # Obter usuário por ID
    test_endpoint "GET" "/users/${CLIENT_ID}" "" 200 "Obter Usuário por ID" "$CLIENT_TOKEN"
    
    # Atualizar usuário
    test_endpoint "PUT" "/users/${CLIENT_ID}" "{
      \"name\": \"Cliente Teste Atualizado\"
    }" 200 "Atualizar Usuário" "$CLIENT_TOKEN"
    
    # Obter saldo da carteira
    test_endpoint "GET" "/users/${CLIENT_ID}/wallet/balance" "" 200 "Obter Saldo da Carteira" "$CLIENT_TOKEN"
    
    # Registrar FCM Token
    test_endpoint "POST" "/users/${CLIENT_ID}/fcm-token" "{
      \"token\": \"test-fcm-token-$(date +%s)\",
      \"deviceId\": \"test-device-123\",
      \"platform\": \"android\"
    }" 200 "Registrar FCM Token" "$CLIENT_TOKEN"
else
    echo -e "${YELLOW}⚠ Pulando testes de usuários (sem token ou ID)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# 4. ENDEREÇOS
# ============================================
echo ""
echo "=========================================="
echo "4. ENDEREÇOS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Criar endereço
    ADDRESS_RESP=$(curl -s -X POST "${BASE_URL}/addresses" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" \
        -d "{
      \"label\": \"Casa\",
      \"street\": \"Rua Teste, 123\",
      \"city\": \"Luanda\",
      \"province\": \"Luanda\",
      \"postalCode\": \"1234\",
      \"coordinates\": {
        \"latitude\": -8.8383,
        \"longitude\": 13.2344
      },
      \"isDefault\": true
    }")
    
    if echo "$ADDRESS_RESP" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "\n${YELLOW}▶ Testando: Criar Endereço${NC}"
        echo "  POST /addresses"
        echo -e "  ${GREEN}✓ PASSED${NC}"
        TOTAL=$((TOTAL + 1))
        PASSED=$((PASSED + 1))
        ADDRESS_ID=$(extract_id "$ADDRESS_RESP")
    else
        echo -e "\n${YELLOW}▶ Testando: Criar Endereço${NC}"
        echo "  POST /addresses"
        echo -e "  ${RED}✗ FAILED${NC}"
        TOTAL=$((TOTAL + 1))
        FAILED=$((FAILED + 1))
        ADDRESS_ID=""
    fi
    
    # Listar endereços
    test_endpoint "GET" "/addresses" "" 200 "Listar Endereços" "$CLIENT_TOKEN"
    
    # Obter e atualizar endereço por ID
    if [ -n "$ADDRESS_ID" ] && [ "$ADDRESS_ID" != "null" ] && [ "$ADDRESS_ID" != "" ]; then
        test_endpoint "GET" "/addresses/${ADDRESS_ID}" "" 200 "Obter Endereço por ID" "$CLIENT_TOKEN"
        test_endpoint "PUT" "/addresses/${ADDRESS_ID}" "{
          \"label\": \"Casa Atualizada\"
        }" 200 "Atualizar Endereço" "$CLIENT_TOKEN"
    fi
else
    echo -e "${YELLOW}⚠ Pulando testes de endereços (sem token)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# 5. ENTREGAS
# ============================================
echo ""
echo "=========================================="
echo "5. ENTREGAS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Criar entrega
    DELIVERY_RESP=$(curl -s -X POST "${BASE_URL}/deliveries" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" \
        -d "{
      \"pickupAddress\": \"Rua Origem, 100\",
      \"deliveryAddress\": \"Rua Destino, 200\",
      \"packageDescription\": \"Pacote de teste\",
      \"packageSize\": \"medium\",
      \"urgency\": \"standard\",
      \"instructions\": \"Entregar na portaria\"
    }")
    
    if echo "$DELIVERY_RESP" | jq -e '.success == true' > /dev/null 2>&1; then
        echo -e "\n${YELLOW}▶ Testando: Criar Entrega${NC}"
        echo "  POST /deliveries"
        echo -e "  ${GREEN}✓ PASSED${NC}"
        TOTAL=$((TOTAL + 1))
        PASSED=$((PASSED + 1))
        DELIVERY_ID=$(extract_id "$DELIVERY_RESP")
    else
        echo -e "\n${YELLOW}▶ Testando: Criar Entrega${NC}"
        echo "  POST /deliveries"
        echo -e "  ${RED}✗ FAILED${NC}"
        TOTAL=$((TOTAL + 1))
        FAILED=$((FAILED + 1))
        DELIVERY_ID=""
    fi
    
    # Listar entregas
    test_endpoint "GET" "/deliveries" "" 200 "Listar Entregas" "$CLIENT_TOKEN"
    
    # Listar minhas entregas
    test_endpoint "GET" "/deliveries/mine" "" 200 "Listar Minhas Entregas" "$CLIENT_TOKEN"
    
    # Obter e rastrear entrega por ID
    if [ -n "$DELIVERY_ID" ] && [ "$DELIVERY_ID" != "null" ] && [ "$DELIVERY_ID" != "" ]; then
        test_endpoint "GET" "/deliveries/${DELIVERY_ID}" "" 200 "Obter Entrega por ID" "$CLIENT_TOKEN"
        test_endpoint "GET" "/deliveries/${DELIVERY_ID}/track" "" 200 "Rastrear Entrega" "$CLIENT_TOKEN"
        
        # Atualizar status (se courier)
        if [ -n "$COURIER_TOKEN" ] && [ "$COURIER_TOKEN" != "null" ] && [ "$COURIER_TOKEN" != "" ]; then
            test_endpoint "PUT" "/deliveries/${DELIVERY_ID}/status" "{
              \"status\": \"in_transit\"
            }" 200 "Atualizar Status da Entrega" "$COURIER_TOKEN"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Pulando testes de entregas (sem token)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================
# 6. TRANSAÇÕES
# ============================================
echo ""
echo "=========================================="
echo "6. TRANSAÇÕES"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Listar transações
    test_endpoint "GET" "/transactions" "" 200 "Listar Transações" "$CLIENT_TOKEN"
    
    # Recarregar carteira
    test_endpoint "POST" "/transactions/wallet/topup" "{
      \"amount\": 5000,
      \"currency\": \"AOA\"
    }" 201 "Recarregar Carteira" "$CLIENT_TOKEN"
fi

# ============================================
# 7. SMART POINTS
# ============================================
echo ""
echo "=========================================="
echo "7. SMART POINTS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Listar smart points
    test_endpoint "GET" "/smartpoints" "" 200 "Listar Smart Points" "$CLIENT_TOKEN"
    
    # Buscar smart points próximos
    test_endpoint "GET" "/smartpoints/nearby?latitude=-8.8383&longitude=13.2344&radius=5000" "" 200 "Buscar Smart Points Próximos" "$CLIENT_TOKEN"
fi

# ============================================
# 8. NOTIFICAÇÕES
# ============================================
echo ""
echo "=========================================="
echo "8. NOTIFICAÇÕES"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Listar notificações
    test_endpoint "GET" "/notifications" "" 200 "Listar Notificações" "$CLIENT_TOKEN"
fi

# ============================================
# 9. REVIEWS
# ============================================
echo ""
echo "=========================================="
echo "9. REVIEWS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ] && [ -n "$DELIVERY_ID" ] && [ "$DELIVERY_ID" != "null" ]; then
    # Criar review
    test_endpoint "POST" "/reviews" "{
      \"deliveryId\": \"${DELIVERY_ID}\",
      \"rating\": 5,
      \"comment\": \"Excelente serviço!\"
    }" 201 "Criar Review" "$CLIENT_TOKEN"
    
    # Listar reviews
    test_endpoint "GET" "/reviews" "" 200 "Listar Reviews" "$CLIENT_TOKEN"
fi

# ============================================
# 10. SUPPORT
# ============================================
echo ""
echo "=========================================="
echo "10. SUPPORT"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Criar ticket de suporte
    test_endpoint "POST" "/support/tickets" "{
      \"subject\": \"Problema com entrega\",
      \"message\": \"Minha entrega está atrasada\",
      \"category\": \"delivery\"
    }" 201 "Criar Ticket de Suporte" "$CLIENT_TOKEN"
    
    # Listar tickets
    test_endpoint "GET" "/support/tickets" "" 200 "Listar Tickets de Suporte" "$CLIENT_TOKEN"
fi

# ============================================
# 11. ANALYTICS
# ============================================
echo ""
echo "=========================================="
echo "11. ANALYTICS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
    # Obter estatísticas
    test_endpoint "GET" "/analytics/stats" "" 200 "Obter Estatísticas" "$CLIENT_TOKEN"
fi

# ============================================
# RESUMO
# ============================================
echo ""
echo "=========================================="
echo "RESUMO DOS TESTES"
echo "=========================================="
echo -e "Total de testes: ${TOTAL}"
echo -e "${GREEN}Passou: ${PASSED}${NC}"
echo -e "${RED}Falhou: ${FAILED}${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Avisos: ${WARNINGS}${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}✗ Alguns testes falharam${NC}"
    exit 1
fi

