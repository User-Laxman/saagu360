import React, { useState, useRef, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { shared } from "../constants/sharedStyles";
import { getAIResponse } from "../services/aiService";
import { speakText } from "../utils/speech";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { LanguageContext } from "../context/LanguageContext";

export default function AIScreen() {
    const { t, language } = useContext(LanguageContext);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "bot",
            text: t("aiWelcomeMessage"),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: "user", text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            // getAIResponse returns a simple string, not an object
            const aiText = await getAIResponse(trimmed, language);

            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                text: aiText,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            const errMsg = {
                id: (Date.now() + 2).toString(),
                role: "bot",
                text: t("aiConnectionError"),
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isBot = item.role === "bot";
        return (
            <View
                style={[
                    styles.bubble,
                    isBot ? styles.botBubble : styles.userBubble,
                ]}
            >
                {isBot && (
                    <MaterialCommunityIcons
                        name="robot"
                        size={18}
                        color="#2e7d32"
                        style={{ marginRight: 6 }}
                    />
                )}
                <Text style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>
                    {item.text}
                </Text>
                {isBot && (
                    <TouchableOpacity
                        onPress={() => speakText(item.text)}
                        style={styles.speakerBtn}
                    >
                        <MaterialCommunityIcons name="volume-high" size={18} color="#2e7d32" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={shared.safe}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={90}
            >
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('askAiTitle')}</Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatArea}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
            />

            {isLoading && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#2e7d32" />
                    <Text style={styles.loadingText}>{t("aiThinking")}</Text>
                </View>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    placeholder={t("aiInputPlaceholder")}
                    placeholderTextColor="#999"
                    value={input}
                    onChangeText={setInput}
                    style={styles.textInput}
                    multiline
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={[styles.sendBtn, isLoading && { opacity: 0.5 }]}
                    onPress={handleSend}
                    disabled={isLoading}
                >
                    <MaterialCommunityIcons name="send" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f0",
    },
    header: {
        backgroundColor: "#2e7d32",
        padding: 16,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "800",
    },
    chatArea: {
        padding: 12,
        paddingBottom: 8,
    },
    bubble: {
        flexDirection: "row",
        alignItems: "flex-start",
        maxWidth: "85%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    botBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#e8f5e9",
        borderTopLeftRadius: 4,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#2e7d32",
        borderTopRightRadius: 4,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    botText: {
        color: "#1b1b1b",
    },
    userText: {
        color: "#ffffff",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 6,
    },
    loadingText: {
        marginLeft: 8,
        color: "#666",
        fontSize: 13,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 10,
        paddingBottom: Platform.OS === "ios" ? 28 : 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    textInput: {
        flex: 1,
        backgroundColor: "#f0f0f0",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: "#333",
    },
    sendBtn: {
        marginLeft: 8,
        backgroundColor: "#2e7d32",
        borderRadius: 22,
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
    },
    speakerBtn: {
        marginLeft: 6,
        padding: 4,
        alignSelf: "flex-end",
    },
});