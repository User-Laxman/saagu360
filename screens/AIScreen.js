import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { getAIResponse } from "../services/aiService";
import { speakText } from "../utils/speech";

export default function AIScreen() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");

    const handleAsk = async () => {
        if (!input) {
            setResponse("Please enter your query.");
            return;
        }

        const res = await getAIResponse(input);
        setResponse(res);
        speakText(res);
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Ask about your crop..."
                value={input}
                onChangeText={setInput}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />
            <Button title="Ask AI" onPress={handleAsk} />
            <Text style={{ marginTop: 20 }}>{response}</Text>
        </View>
    );
}