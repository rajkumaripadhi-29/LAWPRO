from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

import os
import mimetypes


# ============================================================
# MIME TYPES
# ============================================================

mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/javascript', '.js')


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "frontend")
)

# 300-step LoRA adapter
MODEL_DIR = os.path.join(
    BASE_DIR,
    "Qwen2.5-0.5B-Indian-Law-300"
)

# Original Qwen base model
BASE_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"


print("=" * 60)
print("LAW BOT")
print("=" * 60)

print(f"BASE_DIR: {BASE_DIR}")
print(f"FRONTEND_DIR: {FRONTEND_DIR}")
print(f"MODEL_DIR: {MODEL_DIR}")

print(f"Frontend exists: {os.path.exists(FRONTEND_DIR)}")
print(f"300-step adapter exists: {os.path.exists(MODEL_DIR)}")


# ============================================================
# FLASK
# ============================================================

app = Flask(
    __name__,
    static_folder=FRONTEND_DIR,
    static_url_path='/DISABLED_STATIC'
)

CORS(app)


# ============================================================
# DEVICE
# ============================================================

if torch.cuda.is_available():

    DEVICE = "cuda"

    if torch.cuda.is_bf16_supported():
        DTYPE = torch.bfloat16
    else:
        DTYPE = torch.float16

    device_map = {"": 0}

else:

    DEVICE = "cpu"
    DTYPE = torch.float32

    device_map = {"": "cpu"}


print(f"Device: {DEVICE}")
print(f"Dtype: {DTYPE}")


# ============================================================
# LOAD TOKENIZER
# ============================================================

print("=" * 60)
print("Loading tokenizer...")
print("=" * 60)

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_DIR,
    trust_remote_code=True
)

print("Tokenizer loaded successfully.")


# ============================================================
# LOAD BASE QWEN MODEL
# ============================================================

print("=" * 60)
print("Loading base Qwen model...")
print("=" * 60)

base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=DTYPE,
    device_map=device_map,
    trust_remote_code=True
)

print("Base Qwen model loaded successfully.")


# ============================================================
# LOAD 300-STEP LORA ADAPTER
# ============================================================

print("=" * 60)
print("Loading 300-step LoRA adapter...")
print("=" * 60)

model = PeftModel.from_pretrained(
    base_model,
    MODEL_DIR
)

model.eval()

print("✅ 300-step LoRA adapter loaded successfully!")
print("=" * 60)


# ============================================================
# FRONTEND ROUTES
# ============================================================

@app.route('/')
def index():
    return send_from_directory(
        app.static_folder,
        'index.html'
    )


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(
        app.static_folder,
        filename
    )


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """You are an expert Indian Law legal assistant. Your task is to analyze legal scenarios.

Whenever the user explains a scenario, you MUST structure your response exactly as follows:

1. SUMMARY: Provide a brief summary of the user's scenario.

2. NEXT STEPS: Detail exactly what to do next and what immediate steps to take.

3. VIOLATIONS: Specify what all laws and sections of the IPC/BNS are violated.

4. EXPLANATION: Clearly explain the violations and legal reasoning in detail.

5. CASE STUDY/ANALOGY: Explain with a case study or a well explained analogy."""


# ============================================================
# PROMPT FORMATTING
# ============================================================

def format_prompt(user_message):

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": user_message
        }
    ]

    try:

        # Load the chat template saved with the LoRA adapter
        jinja_path = os.path.join(
            MODEL_DIR,
            "chat_template.jinja"
        )

        if os.path.exists(jinja_path):

            with open(
                jinja_path,
                "r",
                encoding="utf-8"
            ) as f:

                tokenizer.chat_template = f.read()

        elif not tokenizer.chat_template:

            tokenizer.chat_template = (
                "{% for message in messages %}"
                "<|im_start|>{{ message['role'] }}\n"
                "{{ message['content'] }}"
                "<|im_end|>\n"
                "{% endfor %}"
                "{% if add_generation_prompt %}"
                "<|im_start|>assistant\n"
                "{% endif %}"
            )

        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

    except Exception as e:

        print(
            f"Error applying chat template: {e}"
        )

        print(
            "Falling back to manual ChatML."
        )

        prompt = (
            f"<|im_start|>system\n"
            f"{SYSTEM_PROMPT}"
            f"<|im_end|>\n"
        )

        prompt += (
            f"<|im_start|>user\n"
            f"{user_message}"
            f"<|im_end|>\n"
        )

        prompt += (
            "<|im_start|>assistant\n"
        )

    return prompt


# ============================================================
# CHAT API
# ============================================================

@app.route('/api/chat', methods=['POST'])
def chat():

    data = request.json

    user_message = data.get(
        'message',
        ''
    )

    if not user_message:

        return jsonify(
            {
                "error": "No message provided"
            }
        ), 400


    # --------------------------------------------------------
    # CREATE CHAT MESSAGES
    # --------------------------------------------------------

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": user_message
        }
    ]


    # --------------------------------------------------------
    # APPLY CHAT TEMPLATE
    # --------------------------------------------------------

    try:

        prompt = tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

    except Exception as e:

        print(
            f"Chat template error: {e}"
        )

        prompt = format_prompt(
            user_message
        )


    # --------------------------------------------------------
    # PREFILL RESPONSE FORMAT
    # --------------------------------------------------------

    prompt += "1. SUMMARY:\n"


    # --------------------------------------------------------
    # TOKENIZE
    # --------------------------------------------------------

    inputs = tokenizer(
        prompt,
        return_tensors="pt"
    )

    inputs = {
        key: value.to(model.device)
        for key, value in inputs.items()
    }


    # --------------------------------------------------------
    # GENERATE
    # --------------------------------------------------------

    with torch.no_grad():

        outputs = model.generate(
            **inputs,

            max_new_tokens=1024,

            do_sample=True,

            temperature=0.7,

            top_p=0.9,

            repetition_penalty=1.15,

            eos_token_id=tokenizer.eos_token_id,

            pad_token_id=(
                tokenizer.pad_token_id
                if tokenizer.pad_token_id is not None
                else tokenizer.eos_token_id
            )
        )


    # --------------------------------------------------------
    # EXTRACT GENERATED TOKENS
    # --------------------------------------------------------

    input_length = (
        inputs["input_ids"].shape[1]
    )

    generated_tokens = outputs[0][
        input_length:
    ]


    # --------------------------------------------------------
    # DECODE RESPONSE
    # --------------------------------------------------------

    response_text = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    )


    # --------------------------------------------------------
    # CLEAN RESPONSE
    # --------------------------------------------------------

    for token in [
        "<end_of_turn>",
        "</start_of_turn>",
        "<|im_end|>",
        "<|endoftext|>"
    ]:

        if token in response_text:

            response_text = (
                response_text
                .split(token)[0]
                .strip()
            )


    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

    response = (
        "1. SUMMARY:\n"
        + response_text
    )


    return jsonify(
        {
            "response": response
        }
    )


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == '__main__':

    print("=" * 60)
    print("Starting Law Bot server...")
    print("300-step LoRA model")
    print("=" * 60)

    app.run(
        host='0.0.0.0',
        port=5002
    )