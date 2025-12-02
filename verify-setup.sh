#!/bin/bash

# Setup Verification Script
# Run this to check if everything is configured correctly

echo "🔍 Verifying Your Setup..."
echo ""

ISSUES=0

# Check 1: .env file
echo "1️⃣  Checking frontend .env file..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"

    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "   ✅ VITE_SUPABASE_URL is set"
    else
        echo "   ❌ VITE_SUPABASE_URL is missing"
        ((ISSUES++))
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo "   ✅ VITE_SUPABASE_ANON_KEY is set"
    else
        echo "   ❌ VITE_SUPABASE_ANON_KEY is missing"
        ((ISSUES++))
    fi
else
    echo "   ❌ .env file not found - YOU NEED TO CREATE THIS!"
    echo "      Copy .env.example to .env and fill in your keys"
    ((ISSUES++))
fi
echo ""

# Check 2: Supabase CLI
echo "2️⃣  Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo "   ✅ Supabase CLI installed"

    if supabase projects list &> /dev/null; then
        echo "   ✅ Supabase CLI authenticated"
    else
        echo "   ❌ Not logged in to Supabase"
        echo "      Run: supabase login"
        ((ISSUES++))
    fi
else
    echo "   ❌ Supabase CLI not installed"
    echo "      Install: npm install -g supabase"
    ((ISSUES++))
fi
echo ""

# Check 3: Node modules
echo "3️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules exists"
else
    echo "   ⚠️  node_modules not found"
    echo "      Run: npm install"
fi
echo ""

# Check 4: Edge functions
echo "4️⃣  Checking edge functions..."
if [ -d "supabase/functions" ]; then
    FUNC_COUNT=$(find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l)
    echo "   ✅ Found $FUNC_COUNT edge functions"

    # Check critical functions
    CRITICAL_FUNCS=("librarian-chat" "buyer-match" "create-checkout-session")
    for func in "${CRITICAL_FUNCS[@]}"; do
        if [ -d "supabase/functions/$func" ]; then
            echo "   ✅ $func exists"
        else
            echo "   ❌ $func is missing"
            ((ISSUES++))
        fi
    done
else
    echo "   ❌ supabase/functions directory not found"
    ((ISSUES++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Setup Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ISSUES -eq 0 ]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy functions: ./deploy-all.sh"
    echo "2. Set Supabase secrets (see SETUP_INSTRUCTIONS.md)"
    echo "3. Start app: npm run dev"
else
    echo "❌ Found $ISSUES issue(s) that need fixing"
    echo ""
    echo "See SETUP_INSTRUCTIONS.md for detailed steps"
fi
echo ""
