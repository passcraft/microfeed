# Use in CI
if test -f ".vars.toml"; then
    echo ".vars.toml exists."
    exit
fi

cat << EOF > .vars.toml
          CLOUDFLARE_PROJECT_NAME = "$CLOUDFLARE_PROJECT_NAME"
          CLOUDFLARE_ACCOUNT_ID = "$CLOUDFLARE_ACCOUNT_ID"
          CLOUDFLARE_API_TOKEN = "$CLOUDFLARE_API_TOKEN"

          R2_ACCESS_KEY_ID = "$R2_ACCESS_KEY_ID"
          R2_SECRET_ACCESS_KEY = "$R2_SECRET_ACCESS_KEY"
          R2_PUBLIC_BUCKET = "$R2_PUBLIC_BUCKET"

          PRODUCTION_BRANCH = "$PRODUCTION_BRANCH"

          yaar_VERSION = "v1"
          NODE_VERSION = "17.0"

          DEPLOYMENT_ENVIRONMENT = "$DEPLOYMENT_ENVIRONMENT"
EOF
