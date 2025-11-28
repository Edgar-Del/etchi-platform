#!/bin/bash

# Script de Teste Completo do Backend Etchi
# Testa todas as funcionalidades do sistema

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
TOTAL=0

# Função para fazer requisições e verificar resultado
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local token=$6
    
    TOTAL=$((TOTAL + 1))
    
    echo -e "\n${YELLOW}Testando: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${token}" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Authorization: Bearer ${token}")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                "${BASE_URL}${endpoint}")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (Status: $http_code)"
        PASSED=$((PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC} (Esperado: $expected_status, Recebido: $http_code)"
        FAILED=$((FAILED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

echo "=========================================="
echo "  TESTE COMPLETO DO BACKEND ETCHI"
echo "=========================================="
echo ""

# Verificar se o servidor está rodando
echo "Verificando se o servidor está rodando..."
if ! curl -s "${BASE_URL}/health" > /dev/null; then
    echo -e "${RED}ERRO: Servidor não está rodando em ${BASE_URL}${NC}"
    echo "Por favor, inicie o servidor com: npm run dev"
    exit 1
fi
echo -e "${GREEN}Servidor está rodando!${NC}\n"

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
CLIENT_EMAIL="test.client.$(date +%s)@etchi.com"
CLIENT_PHONE="+244923456789"
CLIENT_REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
  \"email\": \"${CLIENT_EMAIL}\",
  \"password\": \"1234567890\",
  \"name\": \"Cliente Teste\",
  \"phone\": \"${CLIENT_PHONE}\",
  \"role\": \"client\"
}")
echo "$CLIENT_REGISTER_RESPONSE" | jq '.' > /dev/null 2>&1 && echo -e "  ${GREEN}✓ Cliente registrado${NC}" || echo -e "  ${RED}✗ Falha no registro${NC}"
CLIENT_TOKEN=$(echo "$CLIENT_REGISTER_RESPONSE" | jq -r '.data.data.access_token // .data.access_token // .data.token // empty' 2>/dev/null)

# Registrar e extrair token do courier
COURIER_EMAIL="test.courier.$(date +%s)@etchi.com"
COURIER_PHONE="+244923456790"
COURIER_REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
  \"email\": \"${COURIER_EMAIL}\",
  \"password\": \"1234567890\",
  \"name\": \"Courier Teste\",
  \"phone\": \"${COURIER_PHONE}\",
  \"role\": \"courier\"
}")

# Verificar se o registro foi bem-sucedido
if echo "$COURIER_REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Courier registrado${NC}"
    # Tentar múltiplos caminhos para o token
    COURIER_TOKEN=$(echo "$COURIER_REGISTER_RESPONSE" | jq -r '
        .data.data.access_token // 
        .data.data.token // 
        .data.access_token // 
        .data.token // 
        .access_token // 
        .token // 
        empty' 2>/dev/null)
else
    echo -e "  ${YELLOW}⚠ Registro falhou ou usuário já existe${NC}"
    echo "$COURIER_REGISTER_RESPONSE" | jq -r '.message // "Erro desconhecido"' 2>/dev/null
fi

# Verificar se os tokens foram obtidos
if [ -z "$CLIENT_TOKEN" ] || [ "$CLIENT_TOKEN" = "null" ] || [ "$CLIENT_TOKEN" = "" ]; then
    echo -e "  ${RED}⚠ Token do cliente não obtido do registro${NC}"
    # Tentar login como fallback
    CLIENT_LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${CLIENT_EMAIL}\", \"password\": \"1234567890\"}")
    CLIENT_TOKEN=$(echo "$CLIENT_LOGIN_RESPONSE" | jq -r '.data.data.access_token // .data.access_token // .data.token // empty' 2>/dev/null)
    if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ] && [ "$CLIENT_TOKEN" != "" ]; then
        echo -e "  ${GREEN}✓ Token do cliente obtido do login${NC}"
    else
        echo -e "  ${RED}✗ Falha ao obter token do cliente${NC}"
    fi
else
    echo -e "  ${GREEN}✓ Token do cliente obtido do registro${NC}"
fi

if [ -z "$COURIER_TOKEN" ] || [ "$COURIER_TOKEN" = "null" ] || [ "$COURIER_TOKEN" = "" ]; then
    echo -e "  ${RED}⚠ Token do courier não obtido do registro${NC}"
    # Tentar login como fallback
    COURIER_LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${COURIER_EMAIL}\", \"password\": \"1234567890\"}")
    COURIER_TOKEN=$(echo "$COURIER_LOGIN_RESPONSE" | jq -r '.data.data.access_token // .data.access_token // .data.token // empty' 2>/dev/null)
    if [ -n "$COURIER_TOKEN" ] && [ "$COURIER_TOKEN" != "null" ] && [ "$COURIER_TOKEN" != "" ]; then
        echo -e "  ${GREEN}✓ Token do courier obtido do login${NC}"
    else
        echo -e "  ${RED}✗ Falha ao obter token do courier${NC}"
    fi
else
    echo -e "  ${GREEN}✓ Token do courier obtido do registro${NC}"
fi

# Testar login (pode falhar, mas vamos tentar)
test_endpoint "POST" "/auth/login" "{
  \"email\": \"${CLIENT_EMAIL}\",
  \"password\": \"1234567890\"
}" 200 "Login Cliente"

test_endpoint "POST" "/auth/login" "{
  \"email\": \"${COURIER_EMAIL}\",
  \"password\": \"1234567890\"
}" 200 "Login Courier"

# Obter Perfil (Me)
if [ -n "$CLIENT_TOKEN" ]; then
    test_endpoint "GET" "/auth/me" "" 200 "Obter Perfil" "$CLIENT_TOKEN"
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

if [ -n "$CLIENT_TOKEN" ]; then
    # Obter usuário por ID (precisa do ID do usuário)
    USER_ID=$(curl -s -X GET "${BASE_URL}/auth/me" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" | jq -r '.data._id // .data.id // empty')
    
    if [ -n "$USER_ID" ]; then
        test_endpoint "GET" "/users/${USER_ID}" "" 200 "Obter Usuário por ID" "$CLIENT_TOKEN"
        
        # Atualizar usuário
        test_endpoint "PUT" "/users/${USER_ID}" "{
          \"name\": \"Cliente Teste Atualizado\"
        }" 200 "Atualizar Usuário" "$CLIENT_TOKEN"
        
        # Obter saldo da carteira
        test_endpoint "GET" "/users/${USER_ID}/wallet/balance" "" 200 "Obter Saldo da Carteira" "$CLIENT_TOKEN"
        
        # Registrar FCM Token
        test_endpoint "POST" "/users/${USER_ID}/fcm-token" "{
          \"token\": \"test-fcm-token-12345\"
        }" 200 "Registrar FCM Token" "$CLIENT_TOKEN"
    fi
fi

# ============================================
# 4. ENDEREÇOS
# ============================================
echo ""
echo "=========================================="
echo "4. ENDEREÇOS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ]; then
    # Criar endereço
    test_endpoint "POST" "/addresses" "{
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
    }" 201 "Criar Endereço" "$CLIENT_TOKEN"
    
    # Listar endereços
    test_endpoint "GET" "/addresses" "" 200 "Listar Endereços" "$CLIENT_TOKEN"
    
    # Obter endereço por ID (se houver)
    ADDRESS_ID=$(curl -s -X GET "${BASE_URL}/addresses" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" | jq -r '.data[0]._id // .data[0].id // empty' 2>/dev/null)
    
    if [ -n "$ADDRESS_ID" ] && [ "$ADDRESS_ID" != "null" ]; then
        test_endpoint "GET" "/addresses/${ADDRESS_ID}" "" 200 "Obter Endereço por ID" "$CLIENT_TOKEN"
        
        # Atualizar endereço
        test_endpoint "PUT" "/addresses/${ADDRESS_ID}" "{
          \"label\": \"Casa Atualizada\"
        }" 200 "Atualizar Endereço" "$CLIENT_TOKEN"
    fi
fi

# ============================================
# 5. ENTREGAS
# ============================================
echo ""
echo "=========================================="
echo "5. ENTREGAS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ]; then
    # Criar entrega
    test_endpoint "POST" "/deliveries" "{
      \"pickupAddress\": \"Rua Origem, 100\",
      \"deliveryAddress\": \"Rua Destino, 200\",
      \"packageDescription\": \"Pacote de teste\",
      \"packageSize\": \"medium\",
      \"urgency\": \"standard\",
      \"instructions\": \"Entregar na portaria\"
    }" 201 "Criar Entrega" "$CLIENT_TOKEN"
    
    # Listar entregas
    test_endpoint "GET" "/deliveries" "" 200 "Listar Entregas" "$CLIENT_TOKEN"
    
    # Listar minhas entregas
    test_endpoint "GET" "/deliveries/mine" "" 200 "Listar Minhas Entregas" "$CLIENT_TOKEN"
    
    # Obter entrega por ID
    DELIVERY_ID=$(curl -s -X GET "${BASE_URL}/deliveries" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" | jq -r '.data[0]._id // .data[0].id // empty' 2>/dev/null)
    
    if [ -n "$DELIVERY_ID" ] && [ "$DELIVERY_ID" != "null" ]; then
        test_endpoint "GET" "/deliveries/${DELIVERY_ID}" "" 200 "Obter Entrega por ID" "$CLIENT_TOKEN"
        
        # Rastrear entrega
        test_endpoint "GET" "/deliveries/${DELIVERY_ID}/track" "" 200 "Rastrear Entrega" "$CLIENT_TOKEN"
        
        # Atualizar status (se courier)
        if [ -n "$COURIER_TOKEN" ]; then
            test_endpoint "PUT" "/deliveries/${DELIVERY_ID}/status" "{
              \"status\": \"in_transit\"
            }" 200 "Atualizar Status da Entrega" "$COURIER_TOKEN"
        fi
    fi
fi

# ============================================
# 6. TRANSAÇÕES
# ============================================
echo ""
echo "=========================================="
echo "6. TRANSAÇÕES"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ]; then
    # Iniciar transação
    test_endpoint "POST" "/transactions/initiate" "{
      \"amount\": 1000,
      \"currency\": \"AOA\",
      \"type\": \"payment\",
      \"description\": \"Pagamento de teste\"
    }" 201 "Iniciar Transação" "$CLIENT_TOKEN"
    
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

# Listar smart points (requer autenticação)
if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ]; then
    test_endpoint "GET" "/smartpoints" "" 200 "Listar Smart Points" "$CLIENT_TOKEN"
    
    # Buscar smart points próximos
    test_endpoint "GET" "/smartpoints/nearby?latitude=-8.8383&longitude=13.2344&radius=5000" "" 200 "Buscar Smart Points Próximos" "$CLIENT_TOKEN"
else
    echo -e "\n${YELLOW}Pulando testes de Smart Points (sem token)${NC}"
fi

# Obter smart point por ID (se houver)
if [ -n "$CLIENT_TOKEN" ] && [ "$CLIENT_TOKEN" != "null" ]; then
    SMART_POINT_ID=$(curl -s -X GET "${BASE_URL}/smartpoints" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" | jq -r '.data[0]._id // .data[0].id // empty' 2>/dev/null)
    
    if [ -n "$SMART_POINT_ID" ] && [ "$SMART_POINT_ID" != "null" ]; then
        test_endpoint "GET" "/smartpoints/${SMART_POINT_ID}" "" 200 "Obter Smart Point por ID" "$CLIENT_TOKEN"
    fi
fi

# ============================================
# 8. NOTIFICAÇÕES
# ============================================
echo ""
echo "=========================================="
echo "8. NOTIFICAÇÕES"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ]; then
    # Listar notificações
    test_endpoint "GET" "/notifications" "" 200 "Listar Notificações" "$CLIENT_TOKEN"
    
    # Obter notificação por ID (se houver)
    NOTIFICATION_ID=$(curl -s -X GET "${BASE_URL}/notifications" \
        -H "Authorization: Bearer ${CLIENT_TOKEN}" | jq -r '.data[0]._id // .data[0].id // empty' 2>/dev/null)
    
    if [ -n "$NOTIFICATION_ID" ] && [ "$NOTIFICATION_ID" != "null" ]; then
        # Marcar como lida
        test_endpoint "PUT" "/notifications/${NOTIFICATION_ID}/read" "" 200 "Marcar Notificação como Lida" "$CLIENT_TOKEN"
    fi
fi

# ============================================
# 9. REVIEWS
# ============================================
echo ""
echo "=========================================="
echo "9. REVIEWS"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ] && [ -n "$DELIVERY_ID" ] && [ "$DELIVERY_ID" != "null" ]; then
    # Criar review
    test_endpoint "POST" "/reviews" "{
      \"deliveryId\": \"${DELIVERY_ID}\",
      \"rating\": 5,
      \"comment\": \"Excelente serviço!\"
    }" 201 "Criar Review" "$CLIENT_TOKEN"
    
    # Listar reviews
    test_endpoint "GET" "/reviews" "" 200 "Listar Reviews"
fi

# ============================================
# 10. SUPPORT
# ============================================
echo ""
echo "=========================================="
echo "10. SUPPORT"
echo "=========================================="

if [ -n "$CLIENT_TOKEN" ]; then
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

if [ -n "$CLIENT_TOKEN" ]; then
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
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Todos os testes passaram!${NC}"
    exit 0
else
    echo -e "${RED}✗ Alguns testes falharam${NC}"
    exit 1
fi

