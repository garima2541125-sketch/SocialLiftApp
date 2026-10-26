# Local AI setup (free, runs on your laptop)

The Create screen's **Generate post** button uses two free Qwen models running on
your own computer. You don't need an API key or a paid account.

| Job | Model | Runs in | Address |
|---|---|---|---|
| Picks the post type, pulls out details, writes the caption | Qwen3 8B | Ollama | `http://127.0.0.1:11434` |
| Looks at uploaded photos / logos, writes design notes for reference posts, checks spelling | Qwen3-VL 4B | Ollama | `http://127.0.0.1:11434` |
| Cuts people out of their photos | SAM 3.1 | ComfyUI | `http://127.0.0.1:8188` |
| Picture | Qwen-Image 2512 (Q4 GGUF) + 4-step Lightning LoRA | ComfyUI | `http://127.0.0.1:8188` |

The code that calls them is in `src/ai/localAi.js`.

> **Limits.** Generation only works while Ollama and ComfyUI are running on the
> same computer as the browser. It doesn't work on the deployed Vercel site or
> on a phone. For demos, run the app locally with `npx expo start --web`.

## What you need

- An NVIDIA GPU with **8 GB of VRAM** or more. This was built on an RTX 5050 Laptop GPU.
- 16 GB of RAM.
- About 30 GB of free disk space.
- Git and Python 3.12.

## 1. Captions: Ollama + Qwen3

1. Install Ollama from https://ollama.com/download.
2. In a terminal, run:
   ```
   ollama pull qwen3:8b
   ```
   That's about 5 GB. On a weaker GPU, use `qwen3:4b` instead and set
   `EXPO_PUBLIC_CAPTION_MODEL=qwen3:4b` in `.env`.
   Then download the vision model, which is about 3.3 GB:
   ```
   ollama pull qwen3-vl:4b-instruct
   ```
3. Ollama runs in the background by itself, shown as the llama icon in the system tray.

## 2. Images: ComfyUI + Qwen-Image

1. Get ComfyUI and the GGUF loader node:
   ```
   git clone https://github.com/comfyanonymous/ComfyUI.git
   git clone https://github.com/city96/ComfyUI-GGUF.git ComfyUI/custom_nodes/ComfyUI-GGUF
   cd ComfyUI
   python -m venv venv
   venv\Scripts\python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
   venv\Scripts\python -m pip install -r requirements.txt
   venv\Scripts\python -m pip install -r custom_nodes/ComfyUI-GGUF/requirements.txt
   ```
   The `cu128` PyTorch build is required for RTX 50-series cards and also works on older ones.

2. Download these four files into the matching `ComfyUI/models/` folders:

   | Folder | File | Size | Download |
   |---|---|---|---|
   | `models/unet` | `qwen-image-2512-Q4_K_S.gguf` | 12.3 GB | [unsloth/Qwen-Image-2512-GGUF](https://huggingface.co/unsloth/Qwen-Image-2512-GGUF) |
   | `models/loras` | `Qwen-Image-2512-Lightning-4steps-V1.0-bf16.safetensors` | 0.85 GB | [lightx2v/Qwen-Image-2512-Lightning](https://huggingface.co/lightx2v/Qwen-Image-2512-Lightning) |
   | `models/text_encoders` | `Qwen2.5-VL-7B-Instruct-Q4_K_M.gguf` | 4.7 GB | [unsloth/Qwen2.5-VL-7B-Instruct-GGUF](https://huggingface.co/unsloth/Qwen2.5-VL-7B-Instruct-GGUF) |
   | `models/vae` | `Qwen_Image-VAE.safetensors` | 0.25 GB | [QuantStack/Qwen-Image-GGUF](https://huggingface.co/QuantStack/Qwen-Image-GGUF/tree/main/VAE) |
   | `models/checkpoints` | `sam3.1_multiplex_fp16.safetensors` | 1.75 GB | [Comfy-Org/sam3](https://huggingface.co/Comfy-Org/sam3/tree/main/checkpoints) |

   ComfyUI supports SAM 3 out of the box, so no extra nodes are needed, and it
   doesn't need a Hugging Face login.

   The file names must match exactly, because `src/ai/localAi.js` refers to them by name.

3. Start ComfyUI, letting the Social Lift dev server talk to it:
   ```
   venv\Scripts\python main.py --lowvram --listen 127.0.0.1 --enable-cors-header http://localhost:8081
   ```
   Wait until you see `To see the GUI go to: http://127.0.0.1:8188`, and leave that window open.

## 3. Run Social Lift

```
npm install
npx expo start --web
```

Sign in, go to **Create**, type a prompt, and press **Generate post**. The caption
takes a few seconds. The first image takes longer because ComfyUI has to load
about 17 GB of model files. After that, expect roughly 30 seconds to 2 minutes per image on an 8 GB GPU.

## How a post is made

There's no "post type" button. For each **Generate post**:

1. **Qwen3-VL** looks at each image you attached (a person photo, a logo, an
   event photo…) and finds the face.
2. **Qwen3** reads the prompt, picks the post type, and writes the post's
   content: a heading, a supporting line, the person's name and role, key
   facts and a closing line. A name or role is only used if it's in the
   prompt, and any number or date in the text must come from the prompt too.
   Invented ones are removed.
3. The post is made:
   - **If the account has reference posts,** it's drawn from scratch in that
     style (see below). This happens for every kind of post, including ones
     that don't match a saved category.
   - **Otherwise,** the built-in placement poster or a Qwen-Image picture is
     used.

## Reference posts (Brand Kit)

Each account can save up to 8 of its own published posts as style references.
Go to **Brand Kit → Reference posts → Add a reference post**. Qwen3-VL writes
**design notes** for it in about 20 seconds:

- colours (hex codes)
- what the header and footer look like
- decorations
- the main heading's lettering
- how text is laid out
- how a person's photo is shown (in a circle, cut out, or in a frame) and on
  which side

Check the notes, edit them if needed, and click **Save reference**.

**The reference image is only ever studied. It is never reused or written on.**
When you create a post, the closest matching reference is used:

- **Qwen-Image** draws the **whole poster from scratch** from the design
  notes. That includes a header with the Brand Kit organisation name, the
  post's own text, and a footer with the Brand Kit phone, website and
  department.
- The **real logo and badges** from Brand Kit are placed in the header spots
  Qwen-Image leaves free. An image model can't draw a logo exactly.
- **With a person's photo,** Qwen-Image leaves room for it, and the photo is
  shown the way the reference shows people:
  - **Circle:** in a ring in the accent colour, head and shoulders.
  - **Cut-out:** **SAM 3** cuts the person out of their photo and stands them
    on the design.
  - **Frame:** in a rectangular frame.
- **Qwen3-VL** reads the heading and the name back. If either is misspelt,
  Qwen-Image draws the poster again once. If it still can't be confirmed,
  the preview tells you to check it.

The code is in `src/ai/designedPost.js`.

## Troubleshooting

| Message | Fix |
|---|---|
| "Couldn't reach Ollama…" | Open the Ollama app, or run `ollama serve`. |
| "Couldn't reach ComfyUI…" | Start ComfyUI (step 2.3). If it's already running, check that you passed `--enable-cors-header`. |
| "ComfyUI failed while generating…" | Read the error in the ComfyUI window. It's usually a misspelled model file name, or the GPU running out of memory. If you run out of memory, close other GPU apps, or switch to the `Q3_K_M` model and update `IMAGE_FILES.unet`. |
| Images are very slow (a minute or more per step in the ComfyUI window) | **Plug the laptop in.** On battery the GPU is throttled and runs several times slower. Also check that ComfyUI says it's using CUDA, not the CPU, when it starts, and close other heavy apps. |
