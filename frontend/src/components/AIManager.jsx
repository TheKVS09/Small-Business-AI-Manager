import React, { useEffect, useRef, useState } from "react";
import DisplayEngine from "./display/DisplayEngine";
import "./ai-manager.css";

// =====================================================
// ADK CONFIGURATION
// =====================================================

const ADK_URL =
    "https://small-business-agent-176169442203.asia-south1.run.app";
const APP_NAME = "my_agent";

// =====================================================
// STORAGE
// =====================================================

const STORAGE_KEY = "smallbiz_ai_messages";
const SESSION_KEY = "ai_session_id";
const USER_KEY = "ai_user_id";

// =====================================================
// DEFAULT MESSAGE
// =====================================================

const DEFAULT_WELCOME_MESSAGE = [
    {
        id: 1,
        sender: "ai",
        type: "text",
        text: "Hello! 👋 I'm your SmallBiz AI Manager. How can I help you today?",
    },
];

function AIManager() {
    // =====================================================
    // CHAT
    // =====================================================

    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
        }

        return DEFAULT_WELCOME_MESSAGE;
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // USER ID
    // =====================================================

    const [userId] = useState(() => {
        let id = localStorage.getItem(USER_KEY);

        if (!id) {
            id = "frontend-user";
            localStorage.setItem(USER_KEY, id);
        }

        return id;
    });

    // =====================================================
    // SESSION ID
    // =====================================================

    const [sessionId, setSessionId] = useState(() => {
        return localStorage.getItem(SESSION_KEY);
    });

    const messagesEndRef = useRef(null);

    // =====================================================
    // SAVE CHAT
    // =====================================================

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(messages)
            );
        } catch (error) {
            console.error("Failed to save chat history:", error);
        }
    }, [messages]);

    // =====================================================
    // AUTO SCROLL
    // =====================================================

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    // =====================================================
    // CREATE SESSION
    // =====================================================

    const createSession = async () => {
        const newSessionId = crypto.randomUUID();

        console.log("Creating ADK session:", newSessionId);

        const url =
            `${ADK_URL}/apps/${APP_NAME}/users/${userId}/sessions/${newSessionId}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        const responseText = await response.text();

        let data;

        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }

        console.log(
            "Create session:",
            response.status,
            data
        );

        if (!response.ok) {
            throw new Error(
                typeof data === "object"
                    ? (
                        data?.detail ||
                        data?.error ||
                        `Failed to create session (${response.status})`
                    )
                    : (
                        data ||
                        `Failed to create session (${response.status})`
                    )
            );
        }

        localStorage.setItem(
            SESSION_KEY,
            newSessionId
        );

        setSessionId(newSessionId);

        return newSessionId;
    };

    // =====================================================
    // GET / CREATE SESSION
    // =====================================================

    const getSession = async () => {
        const storedSessionId =
            localStorage.getItem(SESSION_KEY);

        // No stored session
        if (!storedSessionId) {
            return createSession();
        }

        // Check existing session
        try {
            const response = await fetch(
                `${ADK_URL}/apps/${APP_NAME}/users/${userId}/sessions/${storedSessionId}`
            );

            if (response.ok) {
                console.log(
                    "Using existing ADK session:",
                    storedSessionId
                );

                return storedSessionId;
            }

            console.warn(
                "Stored session invalid:",
                response.status
            );
        } catch (error) {
            console.warn(
                "Session check failed:",
                error
            );
        }

        // Remove invalid session
        localStorage.removeItem(SESSION_KEY);
        setSessionId(null);

        // Create new one
        return createSession();
    };

    // =====================================================
    // CLEAN JSON
    // =====================================================

    const cleanJSONString = (value) => {
        if (typeof value !== "string") {
            return value;
        }

        let text = value.trim();

        text = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const objectStart = text.indexOf("{");
        const objectEnd = text.lastIndexOf("}");

        if (
            objectStart !== -1 &&
            objectEnd > objectStart
        ) {
            return text.slice(
                objectStart,
                objectEnd + 1
            );
        }

        const arrayStart = text.indexOf("[");
        const arrayEnd = text.lastIndexOf("]");

        if (
            arrayStart !== -1 &&
            arrayEnd > arrayStart
        ) {
            return text.slice(
                arrayStart,
                arrayEnd + 1
            );
        }

        return text;
    };

    // =====================================================
    // PARSE STRUCTURED RESPONSE
    // =====================================================

    const parseStructuredResponse = (text) => {
        if (
            !text ||
            typeof text !== "string"
        ) {
            return null;
        }

        try {
            return JSON.parse(
                cleanJSONString(text)
            );
        } catch {
            return null;
        }
    };

    // =====================================================
    // PRESENTATION RESPONSE
    // =====================================================

    const isPresentationResponse = (value) => {
        if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            return false;
        }

        return (
            typeof value.title === "string" &&
            typeof value.summary === "string" &&
            Array.isArray(value.kpis) &&
            Array.isArray(value.sections)
        );
    };

    // =====================================================
    // DASHBOARD RESPONSE
    // =====================================================

    const isDashboardResponse = (value) => {
        if (
            !value ||
            typeof value !== "object" ||
            Array.isArray(value)
        ) {
            return false;
        }

        return (
            value.type === "order" ||
            value.type === "marketing" ||
            value.type === "retention"
        );
    };

    // =====================================================
    // EXTRACT TEXT
    // =====================================================

    const extractTextFromEvent = (event) => {
        if (
            !event ||
            typeof event !== "object"
        ) {
            return "";
        }

        const parts = event.content?.parts;

        if (Array.isArray(parts)) {
            return parts
                .filter(
                    (part) =>
                        part &&
                        typeof part.text === "string"
                )
                .map(
                    (part) => part.text
                )
                .join("\n");
        }

        if (typeof event.text === "string") {
            return event.text;
        }

        return "";
    };

    // =====================================================
    // EXTRACT AI RESPONSE
    // =====================================================

    const extractAIResponse = (data) => {
        console.log(
            "Processing ADK response:",
            data
        );

        // ADK normally returns an array of events
        if (Array.isArray(data)) {
            const candidates = data
                .map((event) => ({
                    event,
                    text:
                        extractTextFromEvent(event),
                }))
                .filter(
                    (item) => item.text
                );

            if (candidates.length === 0) {
                return "";
            }

            // Prefer final/root agent response
            const rootCandidates =
                candidates.filter(
                    (item) =>
                        item.event.author ===
                        "small_business_manager"
                );

            if (rootCandidates.length > 0) {
                return rootCandidates[
                    rootCandidates.length - 1
                ].text;
            }

            return candidates[
                candidates.length - 1
            ].text;
        }

        // Direct object
        const directText =
            extractTextFromEvent(data);

        if (directText) {
            return directText;
        }

        // Nested response
        if (data?.response) {
            if (
                typeof data.response ===
                "string"
            ) {
                return data.response;
            }

            const nested =
                extractTextFromEvent(
                    data.response
                );

            if (nested) {
                return nested;
            }
        }

        return "";
    };

    // =====================================================
    // SEND REQUEST TO ADK
    // =====================================================

    const sendToADK = async (
        currentSessionId,
        text
    ) => {
        const body = {
            app_name: APP_NAME,
            user_id: userId,
            session_id: currentSessionId,
            new_message: {
                role: "user",
                parts: [
                    {
                        text,
                    },
                ],
            },
        };

        console.log(
            "Sending to ADK:",
            body
        );

        return fetch(
            `${ADK_URL}/run`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify(body),
            }
        );
    };

    // =====================================================
    // NEW CHAT
    // =====================================================

    const handleNewChat = () => {
        const confirmed =
            window.confirm(
                "Are you sure you want to start a new chat? Current chat history will be cleared."
            );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem(
            STORAGE_KEY
        );

        localStorage.removeItem(
            SESSION_KEY
        );

        setSessionId(null);

        setMessages(
            DEFAULT_WELCOME_MESSAGE
        );

        setInput("");
    };

    // =====================================================
    // SEND MESSAGE
    // =====================================================

    const sendMessage = async () => {
        const text = input.trim();

        if (!text || loading) {
            return;
        }

        // Add user message
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now(),
                sender: "user",
                type: "text",
                text,
            },
        ]);

        setInput("");
        setLoading(true);

        try {
            // ---------------------------------------------
            // GET SESSION
            // ---------------------------------------------

            let currentSessionId =
                await getSession();

            // ---------------------------------------------
            // SEND MESSAGE
            // ---------------------------------------------

            let response =
                await sendToADK(
                    currentSessionId,
                    text
                );

            // ---------------------------------------------
            // SESSION NOT FOUND
            // ---------------------------------------------

            if (response.status === 404) {
                console.warn(
                    "Session not found. Creating new session..."
                );

                localStorage.removeItem(
                    SESSION_KEY
                );

                setSessionId(null);

                currentSessionId =
                    await createSession();

                response =
                    await sendToADK(
                        currentSessionId,
                        text
                    );
            }

            // ---------------------------------------------
            // READ RESPONSE
            // ---------------------------------------------

            const responseText =
                await response.text();

            let data;

            try {
                data =
                    JSON.parse(
                        responseText
                    );
            } catch {
                data =
                    responseText;
            }

            console.log(
                "ADK status:",
                response.status
            );

            console.log(
                "ADK response:",
                data
            );

            // ---------------------------------------------
            // ERROR
            // ---------------------------------------------

            if (!response.ok) {
                const errorMessage =
                    typeof data === "object"
                        ? (
                            data?.detail ||
                            data?.error ||
                            `ADK request failed (${response.status})`
                        )
                        : (
                            data ||
                            `ADK request failed (${response.status})`
                        );

                throw new Error(
                    typeof errorMessage === "string"
                        ? errorMessage
                        : JSON.stringify(
                            errorMessage
                        )
                );
            }

            // ---------------------------------------------
            // EXTRACT AI RESPONSE
            // ---------------------------------------------

            const aiText =
                extractAIResponse(data);

            if (!aiText) {
                throw new Error(
                    "The AI did not return a response."
                );
            }

            console.log(
                "Final AI response:",
                aiText
            );

            // ---------------------------------------------
            // PARSE STRUCTURED RESPONSE
            // ---------------------------------------------

            const structured =
                parseStructuredResponse(
                    aiText
                );

            // ---------------------------------------------
            // PRESENTATION
            // ---------------------------------------------

            if (
                isPresentationResponse(
                    structured
                )
            ) {
                setMessages(
                    (prev) => [
                        ...prev,
                        {
                            id:
                                Date.now() + 1,
                            sender: "ai",
                            type: "display",
                            display:
                                structured,
                        },
                    ]
                );

                return;
            }

            // ---------------------------------------------
            // DASHBOARD
            // ---------------------------------------------

            if (
                isDashboardResponse(
                    structured
                )
            ) {
                setMessages(
                    (prev) => [
                        ...prev,
                        {
                            id:
                                Date.now() + 1,
                            sender: "ai",
                            type: "json",
                            data:
                                structured,
                        },
                    ]
                );

                return;
            }

            // ---------------------------------------------
            // NORMAL TEXT
            // ---------------------------------------------

            setMessages(
                (prev) => [
                    ...prev,
                    {
                        id:
                            Date.now() + 1,
                        sender: "ai",
                        type: "text",
                        text:
                            aiText,
                    },
                ]
            );

        } catch (error) {
            console.error(
                "AI Manager Error:",
                error
            );

            setMessages(
                (prev) => [
                    ...prev,
                    {
                        id:
                            Date.now() + 1,
                        sender: "ai",
                        type: "text",
                        text:
                            "❌ " +
                            (
                                error?.message ||
                                "Unable to connect to AI Manager."
                            ),
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // ENTER KEY
    // =====================================================

    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="ai-manager-page">

            <div className="ai-manager-header">

                <div>
                    <h2>AI Manager</h2>

                    <p>
                        Your intelligent business assistant
                    </p>
                </div>

                <div className="ai-header-actions">

                    <button
                        className="new-chat-btn"
                        onClick={handleNewChat}
                    >
                        ➕ New Chat
                    </button>

                    <div className="ai-online">
                        <span />
                        Online
                    </div>

                </div>

            </div>

            <div className="ai-chat-container">

                <div className="ai-messages">

                    {messages.map(
                        (message) => (

                            <div
                                key={message.id}
                                className={
                                    message.sender === "user"
                                        ? "message user-message"
                                        : "message ai-message"
                                }
                            >

                                {message.sender === "ai" && (
                                    <div className="ai-avatar">
                                        AI
                                    </div>
                                )}

                                <div
                                    className={
                                        message.sender === "user"
                                            ? "message-bubble user-bubble"
                                            : "message-bubble ai-bubble"
                                    }
                                >

                                    {message.type === "display" &&
                                        message.display && (
                                            <DisplayEngine
                                                display={
                                                    message.display
                                                }
                                            />
                                        )}

                                    {message.type === "json" &&
                                        message.data && (
                                            <pre className="json-message">
                                                {JSON.stringify(
                                                    message.data,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        )}

                                    {message.type === "text" && (
                                        <div className="plain-message">
                                            {message.text}
                                        </div>
                                    )}

                                </div>

                                {message.sender === "user" && (
                                    <div className="user-avatar">
                                        V
                                    </div>
                                )}

                            </div>

                        )
                    )}

                    {loading && (
                        <div className="message ai-message">

                            <div className="ai-avatar">
                                AI
                            </div>

                            <div className="message-bubble ai-bubble thinking-bubble">
                                <span />
                                <span />
                                <span />
                            </div>

                        </div>
                    )}

                    <div ref={messagesEndRef} />

                </div>

                <div className="ai-input-container">

                    <input
                        type="text"
                        value={input}
                        onChange={(event) =>
                            setInput(
                                event.target.value
                            )
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Ask your AI Manager..."
                        disabled={loading}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={
                            !input.trim() ||
                            loading
                        }
                    >
                        {loading ? "..." : "➤"}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default AIManager;
