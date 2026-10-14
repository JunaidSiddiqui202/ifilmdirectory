// Test Gemini API Connection
// Run this in browser console to test if Gemini API is working

const GEMINI_API_KEY = 'AIzaSyDUsbylyGzJRbFvVMJUBt6CXSHZMM9OFZA';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

async function testGeminiAPI() {
    console.log('🧪 Testing Gemini API...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say "Hello, Gemini is working!" if you can read this.'
                    }]
                }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Gemini API is working!');
            console.log('Response:', data);
            const text = data.candidates[0].content.parts[0].text;
            console.log('AI Response:', text);
            return { success: true, data };
        } else {
            console.error('❌ FAILED! Error:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('❌ FAILED! Network error:', error);
        return { success: false, error };
    }
}

// Run the test
testGeminiAPI();
