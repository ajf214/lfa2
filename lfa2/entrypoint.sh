#!/bin/sh
JSON_STRING='window.configs = { \
  "VUE_APP_BASE_URL":"'"${VUE_APP_BASE_URL}"'", \
  "VUE_APP_CLOUDINARY_DIR":"'"${VUE_APP_CLOUDINARY_DIR}"'" \
}'
sed -i "s@// CONFIGURATIONS_PLACEHOLDER@${JSON_STRING}@" /usr/share/nginx/html/index.html
exec "$@"