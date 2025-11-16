#!/bin/bash

echo "🔧 Building the project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "🚀 Starting SSR server..."
  echo "📍 Server will run on http://localhost:4000"
  echo "🛑 Press Ctrl+C to stop"
  echo ""
  npm run serve:ssr:koopa
else
  echo "❌ Build failed!"
  exit 1
fi
