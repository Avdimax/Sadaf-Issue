// VLM screenshot verification — describes a screenshot and checks for issues
// Usage: node scripts/vlm_check.mjs <imagePath> "<prompt>"
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const [, , imgPath, prompt] = process.argv;
if (!imgPath) {
  console.error('usage: node vlm_check.mjs <image> [prompt]');
  process.exit(1);
}

const b64 = fs.readFileSync(imgPath).toString('base64');
const zai = await ZAI.create();

const res = await zai.createChatCompletionVision({
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            prompt ||
            'Describe this webpage screenshot in detail: layout, colors, typography, any broken images, overlapping or clipped text, rendering bugs. Be specific and critical.',
        },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
      ],
    },
  ],
});

console.log(res.choices[0].message.content);
