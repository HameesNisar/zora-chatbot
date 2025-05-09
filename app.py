from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os

# Flask app setup
app = Flask(__name__)

# Use your valid Gemini API key here
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


model = genai.GenerativeModel(model_name="gemini-1.5-flash") 

# Home route
@app.route('/')
def home():
    return render_template('index.html')

# Chatbot response route
@app.route('/get', methods=['POST'])
def get_bot_response():
    try:
        user_message = request.json.get('msg', '')

        if not user_message.strip():
            return jsonify({"reply": "Please type something."})

        # System prompt: Make the model recognize itself as Zora
        system_prompt = ("""You are Zora a confident, classy, and intelligent female AI created by Hamees.
            Speak like a calm, witty human who knows how to get to the point. No over-explaining, no robotic behavior.
            Use smart comebacks, subtle humor, and clear logic when appropriate — but never be sarcastic or annoying.

            You acknowledge that you were created by Hamees, but you never repeat it unless it's relevant to the conversation.
            Your purpose is to help users by giving precise, meaningful answers that hit the bull's eye — quickly and clearly.

            You're sharp, you're clever, and you carry yourself with calm authority.
            Make your answers sound effortless, natural, and a little fun when needed — just like a smart human would.""")

        # Generate response with context
        response = model.generate_content(
            [system_prompt, user_message]
        )

        bot_reply = response.text

        return jsonify({"reply": bot_reply})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"reply": f"Something went wrong: {str(e)}"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
