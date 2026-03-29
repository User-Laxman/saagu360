import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from "../constants/appTheme";
import { shared } from "../constants/sharedStyles";
import { getAIResponse, sendVoiceQuery, translateChat } from "../services/aiService";
import { speakText } from "../utils/speech";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from 'expo-av';
import { LanguageContext } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Animated typing dots component
function TypingDots() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                ])
            ).start();
        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
    }, []);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 6, gap: 4 }}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View key={i} style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: COLORS.green600,
                    transform: [{ translateY: dot }],
                }} />
            ))}
            <Text style={{ marginLeft: 8, color: COLORS.gray600, fontSize: 13, fontFamily: FONTS.bodyMed }}>
                AI is thinking...
            </Text>
        </View>
    );
}

export default function AIScreen() {
    const { t, language } = useContext(LanguageContext);
    const [input, setInput] = useState("");
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: "welcome",
            role: "bot",
            text: t("aiWelcomeMessage"),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef(null);

    // Save chat helper — defined first so translation effect can reference it
    const saveMessages = useCallback((msgs) => {
        setMessages(msgs);
        AsyncStorage.setItem('kisan_chat_history', JSON.stringify(msgs.slice(-50)));
    }, []);

    // Load persisted chat on mount
    useEffect(() => {
        AsyncStorage.getItem('kisan_chat_history').then(saved => {
            if (saved) {
                try { setMessages(JSON.parse(saved)); } catch(e) {}
            }
        });
    }, []);

    const prevLang = useRef(language);

    // Seamlessly translate chat history when UI language changes
    useEffect(() => {
        const translateActiveChat = async () => {
            if (prevLang.current === language) return;
            prevLang.current = language;

            // Extract current state snapshot without adding to dep array
            let currentMsgs = [];
            setMessages(prev => { currentMsgs = prev; return prev; });

            if (currentMsgs.length === 0) return;

            // Welcome-only history: just refresh the local string key — no API call needed
            if (currentMsgs.length === 1 && currentMsgs[0].id === 'welcome') {
                saveMessages([{ ...currentMsgs[0], text: t('aiWelcomeMessage') }]);
                return;
            }

            // Real conversational history: call deep-translator backend
            setIsLoading(true);
            const texts = currentMsgs.map(m => m.text);
            const translated = await translateChat(texts, language);

            if (translated && translated.length === currentMsgs.length) {
                saveMessages(currentMsgs.map((m, idx) => ({ ...m, text: translated[idx] })));
            }
            setIsLoading(false);
        };
        translateActiveChat();
    }, [language, t, saveMessages]);

    const clearChat = () => {
        const welcome = [{ id: "welcome", role: "bot", text: t("aiWelcomeMessage") }];
        setMessages(welcome);
        AsyncStorage.removeItem('kisan_chat_history');
    };

    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                setIsRecording(true);
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
            } else {
                alert(t('aiConnectionError') || "Microphone permission is required.");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (!recording) return;
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            
            setIsLoading(true);
            const userTempMsg = { id: Date.now().toString(), role: "user", text: "... 🎙️" };
            setMessages((prev) => [...prev, userTempMsg]);

            const aiResponse = await sendVoiceQuery(uri, language);
            
            setMessages((prev) => prev.filter(msg => msg.id !== userTempMsg.id));

            if (aiResponse.error) {
                const errMsg = { id: Date.now().toString(), role: "bot", text: aiResponse.error };
                setMessages((prev) => {
                    const updated = [...prev, errMsg];
                    AsyncStorage.setItem('kisan_chat_history', JSON.stringify(updated.slice(-50)));
                    return updated;
                });
            } else {
                const userMsg = { id: Date.now().toString() + "u", role: "user", text: aiResponse.text || "Voice audio" };
                const botMsg = { id: Date.now().toString() + "b", role: "bot", text: aiResponse.response };
                setMessages((prev) => {
                    const updated = [...prev, userMsg, botMsg];
                    AsyncStorage.setItem('kisan_chat_history', JSON.stringify(updated.slice(-50)));
                    return updated;
                });
                speakText(aiResponse.response);
            }
        } catch (error) {
            console.error('Failed to stop recording or processing', error);
        } finally {
            setIsLoading(false);
            await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        }
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;

        const userMsg = { id: Date.now().toString(), role: "user", text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const aiText = await getAIResponse(trimmed, language);

            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: "bot",
                text: aiText,
            };
            setMessages((prev) => {
                const updated = [...prev, botMsg];
                AsyncStorage.setItem('kisan_chat_history', JSON.stringify(updated.slice(-50)));
                return updated;
            });
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

    // Animated message renderer
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
                        color={COLORS.green800}
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
                        <MaterialCommunityIcons name="volume-high" size={18} color={COLORS.green800} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={shared.safe}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 25}
            >
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('askAiTitle')}</Text>
                <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
                    <MaterialCommunityIcons name="broom" size={18} color="#fff" />
                    <Text style={styles.clearBtnText}>{t('clearChat')}</Text>
                </TouchableOpacity>
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

            {isLoading && <TypingDots />}

            <View style={styles.inputRow}>
                <TextInput
                    placeholder={t("aiInputPlaceholder")}
                    placeholderTextColor={COLORS.gray400}
                    value={input}
                    onChangeText={setInput}
                    style={styles.textInput}
                    multiline
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />

                {isRecording ? (
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: COLORS.red }]}
                        onPress={stopRecording}
                    >
                        <MaterialCommunityIcons name="stop" size={22} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: COLORS.green600, marginRight: 4 }]}
                        onPress={startRecording}
                        disabled={isLoading}
                    >
                        <MaterialCommunityIcons name="microphone" size={22} color="#fff" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.sendBtn, isLoading && { opacity: 0.5 }]}
                    onPress={handleSend}
                    disabled={isLoading}
                >
                    <MaterialCommunityIcons name="send" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>

        <LanguageSelector />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.green50,
    },
    header: {
        backgroundColor: COLORS.green800,
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        ...SHADOW.elevated,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 23,
        fontFamily: FONTS.headingXl,
    },
    chatArea: {
        padding: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    clearBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: RADIUS.lg,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 4,
    },
    clearBtnText: {
        color: "#fff",
        fontSize: 12,
        fontFamily: FONTS.bodyBold,
    },
    bubble: {
        flexDirection: "row",
        alignItems: "flex-start",
        maxWidth: "85%",
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        marginBottom: 10,
    },
    botBubble: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.green100,
        borderTopLeftRadius: 4,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.green800,
        borderTopRightRadius: 4,
    },
    bubbleText: {
        fontSize: 16,
        lineHeight: 24,
        flex: 1,
        fontFamily: FONTS.body,
    },
    botText: {
        color: COLORS.gray800,
    },
    userText: {
        color: "#ffffff",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 10,
        paddingBottom: Platform.OS === "ios" ? 28 : 10,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    textInput: {
        flex: 1,
        backgroundColor: COLORS.gray100,
        borderRadius: 20,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
        color: COLORS.gray800,
        fontFamily: FONTS.body,
    },
    sendBtn: {
        marginLeft: SPACING.sm,
        backgroundColor: COLORS.green800,
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