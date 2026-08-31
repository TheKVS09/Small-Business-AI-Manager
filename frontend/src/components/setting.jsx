import React, { useEffect, useState } from "react";
import "./setting.css";

function Settings() {

    // =====================================================
    // AI MANAGER CONFIGURATION
    // =====================================================

    const [userId, setUserId] = useState("");

    const [sessionId, setSessionId] = useState("");

    const [saved, setSaved] = useState(false);


    // =====================================================
    // LOAD SAVED SETTINGS
    // =====================================================

    useEffect(() => {

        const savedUserId =
            localStorage.getItem("ai_user_id");

        const savedSessionId =
            localStorage.getItem("ai_session_id");


        if (savedUserId) {

            setUserId(savedUserId);

        }


        if (savedSessionId) {

            setSessionId(savedSessionId);

        }

    }, []);


    // =====================================================
    // SAVE SETTINGS
    // =====================================================

    const saveSettings = () => {

        if (!userId.trim()) {

            alert("Please enter User ID");

            return;

        }


        if (!sessionId.trim()) {

            alert("Please enter Session ID");

            return;

        }


        localStorage.setItem(
            "ai_user_id",
            userId.trim()
        );


        localStorage.setItem(
            "ai_session_id",
            sessionId.trim()
        );


        setSaved(true);


        setTimeout(() => {

            setSaved(false);

        }, 2500);

    };


    // =====================================================
    // GENERATE NEW SESSION
    // =====================================================

    const generateSessionId = () => {

        const newSessionId =
            crypto.randomUUID();


        setSessionId(newSessionId);

    };


    // =====================================================
    // CLEAR SETTINGS
    // =====================================================

    const clearSettings = () => {

        localStorage.removeItem(
            "ai_user_id"
        );

        localStorage.removeItem(
            "ai_session_id"
        );


        setUserId("");

        setSessionId("");

        setSaved(false);

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="settings-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="settings-header">

                <h2>
                    Settings
                </h2>

                <p>
                    Manage your SmallBiz configuration
                </p>

            </div>


            {/* =================================================
                AI MANAGER SETTINGS
            ================================================= */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        ✦
                    </div>

                    <div>

                        <h3>
                            AI Manager
                        </h3>

                        <p>
                            Configure your AI Manager connection
                        </p>

                    </div>

                </div>


                {/* =================================================
                    USER ID
                ================================================= */}

                <div className="setting-field">

                    <label>
                        User ID
                    </label>

                    <input

                        type="text"

                        value={userId}

                        onChange={(e) =>
                            setUserId(e.target.value)
                        }

                        placeholder="Enter your User ID"

                    />

                    <small>
                        The user ID used by your ADK agent.
                    </small>

                </div>


                {/* =================================================
                    SESSION ID
                ================================================= */}

                <div className="setting-field">

                    <label>
                        Session ID
                    </label>

                    <input

                        type="text"

                        value={sessionId}

                        onChange={(e) =>
                            setSessionId(e.target.value)
                        }

                        placeholder="Enter your Session ID"

                    />

                    <small>
                        The session ID used to maintain your AI conversation.
                    </small>

                </div>


                {/* =================================================
                    GENERATE SESSION
                ================================================= */}

                <button

                    className="generate-session-btn"

                    onClick={generateSessionId}

                >

                    Generate New Session ID

                </button>


                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="settings-actions">

                    <button

                        className="save-settings-btn"

                        onClick={saveSettings}

                    >

                        Save Configuration

                    </button>


                    <button

                        className="clear-settings-btn"

                        onClick={clearSettings}

                    >

                        Clear

                    </button>

                </div>


                {/* =================================================
                    SAVED MESSAGE
                ================================================= */}

                {saved && (

                    <div className="settings-success">

                        ✓ AI Manager configuration saved successfully

                    </div>

                )}

            </div>


            {/* =================================================
                CURRENT STATUS
            ================================================= */}

            <div className="settings-card">

                <div className="settings-card-header">

                    <div className="settings-icon">
                        ✓
                    </div>

                    <div>

                        <h3>
                            Configuration Status
                        </h3>

                        <p>
                            Current AI Manager configuration
                        </p>

                    </div>

                </div>


                <div className="config-status">

                    <div>

                        <span>
                            User ID
                        </span>

                        <strong>
                            {userId || "Not configured"}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Session ID
                        </span>

                        <strong>

                            {sessionId
                                ? sessionId
                                : "Not configured"}

                        </strong>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Settings;