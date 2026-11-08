#!/bin/bash
# Usage: vcheck <image_path> <prompt>
z-ai vision -p "$2" -i "$1" -o /tmp/vcheck_result.json > /dev/null 2>&1
python3 -c "
import json
try:
    with open('/tmp/vcheck_result.json') as f:
        data = json.load(f)
    print(data['choices'][0]['message']['content'])
except Exception as e:
    print('VLM check failed:', e)
"
