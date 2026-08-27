FROM ghcr.io/open-webui/open-webui:v0.11.1

# Open WebUI appends " (Open WebUI)" to custom names.
# Remove that suffix where permitted by the applicable Open WebUI license
# so WEBUI_NAME is displayed as configured.
RUN python - <<'PY'
import re

path = "/app/backend/open_webui/env.py"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text, replacements = re.subn(
    r'''(?m)^if WEBUI_NAME != ["']Open WebUI["']:\n\s+WEBUI_NAME \+= ["'] \(Open WebUI\)["']\n''',
    "",
    text,
    count=1,
)

if replacements != 1:
    raise RuntimeError(
        "Open WebUI branding block was not found; "
        "refusing to build an unexpectedly patched image"
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
PY