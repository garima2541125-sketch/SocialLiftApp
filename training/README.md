# Fine-tuning Social Lift's models

This folder fine-tunes the models Social Lift runs on the dataset in [`../dataset`](../dataset):
917 captioned post images. These are the 902 Crello and Pitt Ads images plus 15 real JUET
posts (`image_0903`–`image_0917`).

| Model (what the app uses it for) | What it learns here | Method | GPU needed |
|---|---|---|---|
| **Qwen-Image 2512** (draws the poster) | The look of real social posts, and **JUET's own style** when a prompt starts with `juet_style poster` | LoRA with [ai-toolkit](https://github.com/ostris/ai-toolkit) | **24 GB+**; not the laptop |
| **Qwen3-VL 4B** (Brand Kit design notes) | Writing design notes in the dataset's vocabulary: category, layout, palette, heading and photo style | QLoRA (4-bit), `transformers` + `peft` | 8 GB (laptop OK) |
| **Qwen3 8B** (planning and prompts) | Turning a short brief into an image prompt the LoRA understands | QLoRA (4-bit) | 8 GB, just barely |
| SAM 3 (person cut-outs) | Not trained. The dataset has no masks, and SAM 3 already cuts people out well. | n/a | n/a |

The Qwen-Image LoRA gives the biggest improvement, so do it first. The other two are optional.

## 0. Setup (once)

```powershell
cd C:\Users\gaurm\SocialLiftApp
python -m venv .venv-train
.\.venv-train\Scripts\Activate.ps1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
pip install -r training\requirements.txt
huggingface-cli login     # downloading the base models needs a (free) Hugging Face account
```

Run every command from the repo root (`SocialLiftApp`), as `python -m training....`.
Everything the scripts write goes in `training/build/` and `training/output/`, which git ignores.

By default, the 68 `pitt_ads` images are left out of every model. They are real brand adverts
with an unclear licence (see `dataset/dataset_report.md`). To use them anyway, add
`--include-source pitt_ads` to `image_lora.prepare`.

## 1. Qwen-Image style LoRA

Qwen-Image's transformer has 20B parameters. Training a LoRA on it needs a GPU with at least
24 GB of VRAM, such as an RTX 3090/4090, A5000/A6000, L40S or A100. The RTX 5050 laptop (8 GB)
and free Colab/Kaggle GPUs (T4 16 GB) **can't** do it. Options:
- Use a college lab GPU.
- Rent a GPU for a few hours. A 24–48 GB GPU on RunPod or Vast.ai costs roughly ₹35–70 an
  hour, and 3000 steps take about 3–5 hours.

On the training machine:

```bash
# ai-toolkit, in its own environment (follow its README for the exact torch version)
git clone https://github.com/ostris/ai-toolkit
cd ai-toolkit && python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# in SocialLiftApp (copy the repo, including dataset/, to that machine)
python -m training.image_lora.prepare --gpu 24gb     # or --gpu 48gb
python -m training.image_lora.train --ai-toolkit ../ai-toolkit
```

- `prepare` copies the images and captions into `training/build/image_lora/` and writes
  `config.yaml`. Read the config before training:
  - rank 32, learning rate 1e-4, 3000 steps;
  - 512/768 px buckets;
  - JUET posts repeated 12× per epoch, so 15 images aren't lost among 830.
- **`--gpu 24gb` uses a 3-bit-quantised model.** The accuracy-recovery adapter named in
  `prepare.py` was published for the original Qwen-Image. Compare it with
  `config/examples/train_lora_qwen_image_24gb.yaml` in your ai-toolkit checkout, and use the
  2512 one if there is one. `--gpu 48gb` uses 8-bit weights and needs no adapter.
- Every 250 steps ai-toolkit saves a checkpoint and draws the 4 sample prompts in
  `prepare.py` (3 JUET-style, 1 generic) into `training/output/image_lora/<name>/samples/`.
  Pick the checkpoint whose samples look most like JUET posts without copying a training
  image outright.

Bring the chosen `.safetensors` back to the laptop:

```powershell
python -m training.export.install_image_lora --comfyui C:\Users\gaurm\ComfyUI --checkpoint <path\to\chosen.safetensors>
```

To use it, add a second `LoraLoaderModelOnly` node (`sociallift_style.safetensors`, strength
about 0.8) after the Lightning LoRA in `buildImageWorkflow` (`src/ai/localAi.js`). Start
JUET prompts with `juet_style poster,`.

## 2. Qwen3-VL design-notes model (laptop OK)

```powershell
ollama serve                                       # if Ollama isn't already running
python -m training.vision_lora.build_data          # ~1-2 h: asks the base model about 850 images once (cached)
python -m training.vision_lora.train               # QLoRA, 2 epochs
python -m training.export.to_ollama --kind vision --name sociallift-vl
```

- **Targets:** each image is paired with the JSON that Brand Kit asks for.
  - `category`, `style` and `palette` come from the dataset.
  - For the 15 JUET posts, `headingStyle`, `photoStyle` and `photoSide` are hand-written in
    `common/juet_notes.py`.
  - For the other images, those three fields come from the base model, the "teacher".
    `--no-teacher` skips the teacher and leaves those fields out.
- The system prompt in `build_data.py` is a word-for-word copy of the one in
  `describeReferenceStyle`. **If you change one, change the other.**
- **Memory settings for the 8 GB GPU:**
  - `--image-side 640` (smaller means less VRAM).
  - Batch 1 with 8 gradient-accumulation steps.
  - Close ComfyUI, and stop the Ollama model (`ollama stop qwen3-vl:4b-instruct`) before
    training.

Then set `EXPO_PUBLIC_VISION_MODEL=sociallift-vl` in `.env`.

## 3. Qwen3 prompt-writer (laptop, tight)

```powershell
python -m training.text_lora.build_data
python -m training.text_lora.train
git clone https://github.com/ggml-org/llama.cpp C:\Users\gaurm\llama.cpp
pip install -r C:\Users\gaurm\llama.cpp\requirements\requirements-convert_hf_to_gguf.txt
python -m training.export.to_ollama --kind text --name sociallift-qwen3 --llama-cpp C:\Users\gaurm\llama.cpp
```

The dataset has no real user prompts. Each training brief is built from an image's metadata
(post type, what it shows, colours, shape), and the target is that image's caption.

This model only helps if the app uses it to write `imagePrompt`. It is optional, and for
the from-scratch designed posts `designedPost.js` already builds the image prompt itself.
Merging the 8B model needs about 17 GB of RAM.

## Files

```
training/
  common/config.py          paths, base model ids, trigger phrase, excluded sources
  common/dataset.py         reads metadata.csv + captions; train/val split; caption clean-up
  common/juet_notes.py      hand-written design notes for the 15 JUET posts
  common/sft.py             shared QLoRA training (prompt masking, 4-bit loading, Trainer)
  image_lora/prepare.py     dataset folders + ai-toolkit config for Qwen-Image
  image_lora/train.py       runs ai-toolkit
  vision_lora/build_data.py image -> design-notes JSON (with the Ollama teacher)
  vision_lora/train.py      Qwen3-VL QLoRA
  text_lora/build_data.py   brief -> image prompt
  text_lora/train.py        Qwen3 QLoRA
  export/to_ollama.py       merge LoRA -> (GGUF) -> `ollama create`
  export/install_image_lora.py  copy the image LoRA into ComfyUI
```

## Before using the results

- Five JUET posts show real students' faces and names: 0906, 0907, 0908, 0910 and 0912.
  Keep the trained models private.
- Part of the dataset is licensed for **non-commercial / research use only** (see
  `dataset/dataset_report.md`), so the trained LoRAs are too.
- To add more JUET posts later:
  1. Put each image in `dataset/images/` as the next `image_09NN.png`, with a `.txt` caption
     starting `juet_style poster,`.
  2. Add a row to `dataset/metadata/metadata.csv` with `source_dataset` set to `juet`.
  3. Add its notes to `common/juet_notes.py`.
