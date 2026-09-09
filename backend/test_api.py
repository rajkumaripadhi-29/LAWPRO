import requests
import json

url = "http://127.0.0.1:5002/api/chat"
payload = {"message": "My landlord locked me out of my apartment without notice and threw all my belongings on the street."}
headers = {"Content-Type": "application/json"}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Response received:")
        print(data.get("response"))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"An error occurred: {e}")
