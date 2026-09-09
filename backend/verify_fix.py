import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "Qwen2.5-0.5B-Indian-Law")

print(f"Loading model from {MODEL_DIR}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_DIR,
    torch_dtype=torch.float32,
    device_map={"": "cpu"},
    trust_remote_code=True
)

SYSTEM_PROMPT = """You are an expert Indian Law legal assistant. Your task is to analyze legal scenarios.
Whenever the user explains a scenario, you MUST structure your response exactly as follows:
1. SUMMARY: Provide a brief summary of the user's scenario.
2. NEXT STEPS: Detail exactly what to do next and what immediate steps to take.
3. VIOLATIONS: Specify what all laws and sections of the IPC/BNS are violated.
4. EXPLANATION: Clearly explain the violations and legal reasoning in detail.
5. CASE STUDY/ANALOGY: Explain with a case study or a well explained analogy."""

def format_prompt(user_message):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]
    
    jinja_path = os.path.join(MODEL_DIR, "chat_template.jinja")
    if os.path.exists(jinja_path):
        with open(jinja_path, "r", encoding="utf-8") as f:
            tokenizer.chat_template = f.read()
    elif not tokenizer.chat_template:
        tokenizer.chat_template = (
            "{% for message in messages %}"
            "<|im_start|>{{ message['role'] }}\\n{{ message['content'] }}<|im_end|>\\n"
            "{% endfor %}"
            "{% if add_generation_prompt %}<|im_start|>assistant\\n{% endif %}"
        )
    
    prompt = tokenizer.apply_chat_template(
        messages, 
        tokenize=False, 
        add_generation_prompt=False
    )
    prompt += "<start_of_turn>model\n1. SUMMARY:\n"
    return prompt

user_message = "the man murdered his wife and escaped from the city"
formatted_prompt = format_prompt(user_message)
print(f"\n--- Formatted Prompt ---\n{formatted_prompt}\n-----------------------\n")

inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)

print("Generating response...")
with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_new_tokens=256,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )

input_length = inputs["input_ids"].shape[1]
generated_tokens = outputs[0][input_length:]
response = tokenizer.decode(generated_tokens, skip_special_tokens=True)

print(f"\n--- Model Response ---\n{response}\n-----------------------\n")
