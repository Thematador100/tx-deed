#!/bin/bash

# Complete Deployment Script
# This deploys ALL edge functions to Supabase

echo "🚀 Deploying all Supabase Edge Functions..."
echo ""

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase CLI"
    echo "Run: supabase login"
    exit 1
fi

echo "✅ Supabase CLI authenticated"
echo ""

# List of all functions to deploy
FUNCTIONS=(
    "librarian-chat"
    "buyer-match"
    "deal-dossier"
    "deal-rescue"
    "dispo-copilot"
    "create-checkout-session"
    "get-properties"
    "get-redeemable-deeds"
    "get-tax-delinquent-leads"
    "process-document-ocr"
    "process-property-upload"
    "scrape-county"
    "stripe-webhook"
    "marketplace-purchase"
    "property-analysis"
    "property-lookup"
    "send-notification"
    "smarty-autocomplete"
    "scout-agent-monitor"
)

DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo "📦 Deploying $func..."
    if supabase functions deploy "$func" --project-ref aedapqfuegbqztuetkxd; then
        echo "   ✅ $func deployed successfully"
        ((DEPLOYED++))
    else
        echo "   ❌ $func failed to deploy"
        ((FAILED++))
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully deployed: $DEPLOYED functions"
if [ $FAILED -gt 0 ]; then
    echo "❌ Failed: $FAILED functions"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All functions deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Set environment secrets in Supabase dashboard"
    echo "2. Create .env file with your keys"
    echo "3. Run: npm run dev"
else
    echo "⚠️  Some functions failed to deploy"
    echo "Check the errors above and try again"
fi
