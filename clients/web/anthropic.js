const anthropic = {
    "modelId": "anthropic.claude-3-7-sonnet-20250219-v1:0",
    "contentType": "application/json",
    "accept": "application/json",
    "body": {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": 200,
      "top_k": 250,
      "stop_sequences": [],
      "temperature": 1,
      "top_p": 0.999,
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "hello world"
            }
          ]
        }
      ]
    }
  }