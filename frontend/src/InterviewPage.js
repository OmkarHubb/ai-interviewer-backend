import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './App.css';

const ChatIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );
const SunIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> );
const MoonIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> );
const SoundOnIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> );
const SoundOffIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg> );

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

const FeedbackSkeleton = () => ( <div className="skeleton-container"> <div className="skeleton skeleton-title"></div> <div className="skeleton skeleton-text"></div> <div className="skeleton skeleton-text-short"></div> <br /> <div className="skeleton skeleton-title"></div> <div className="skeleton skeleton-text"></div> </div> );
const TypingIndicator = () => ( <div className="message-container interviewer-message"> <div className="message-bubble interviewer-bubble"> <div className="typing-indicator"> <span></span><span></span><span></span> </div> </div> </div> );

function InterviewPage({ theme, toggleTheme }) {
    const [conversation, setConversation] = useState([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isInterviewOver, setIsInterviewOver] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isTTSEnabled, setIsTTSEnabled] = useState(true);

    const chatWindowRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isTTSEnabled && conversation.length > 0) {
            const lastMessage = conversation[conversation.length - 1];
            if (lastMessage.speaker === 'Interviewer') {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(lastMessage.text);
                speechSynthesis.speak(utterance);
            }
        }
    }, [conversation, isTTSEnabled]);

    useEffect(() => {
        if (!recognition) return;
        const handleListen = () => {
            if (isListening) {
                recognition.start();
                recognition.onend = () => { if (isListening) recognition.start(); };
            } else {
                recognition.stop();
                recognition.onend = () => {};
            }
        };
        handleListen();
        return () => { recognition.stop(); };
    }, [isListening]);

    useEffect(() => {
        if (!recognition) return;
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + '. ';
                }
            }
            setCurrentAnswer(prevAnswer => prevAnswer + finalTranscript);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
    }, []);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [conversation, isLoading]);

    useEffect(() => {
        if (conversation.length > 0 && !isInterviewOver && inputRef.current) {
            inputRef.current.focus();
        }
    }, [conversation, isInterviewOver]);

    const startInterview = async () => {
        setIsLoading(true);
        setError(null);
        setConversation([]);
        setFeedback('');
        setIsInterviewOver(false);
        try {
            const response = await fetch('http://localhost:3001/api/interview/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobRole: 'Software Engineer' }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setConversation([{ speaker: 'Interviewer', text: data.question }]);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!currentAnswer.trim() || isLoading) return;
        setIsListening(false);
        const userAnswer = { speaker: 'You', text: currentAnswer };
        setConversation(prev => [...prev, userAnswer]);
        setCurrentAnswer('');
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/interview/next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: currentAnswer }),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setTimeout(() => {
                setConversation(prev => [...prev, { speaker: 'Interviewer', text: data.question }]);
                if (data.question.includes("That's all the questions")) {
                    setIsInterviewOver(true);
                }
                setIsLoading(false);
            }, 1000);
        } catch (err) { // <<< THE FIX IS HERE
            setError(err.message);
            setIsLoading(false);
        }
    };

    const getFeedback = async () => {
        setIsFeedbackLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/interview/feedback', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to get feedback from server.');
            const data = await response.json();
            setFeedback(data.feedback);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsFeedbackLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitAnswer();
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        submitAnswer();
    };

    const toggleListening = () => {
        if (!recognition) {
            alert("Sorry, your browser doesn't support speech recognition.");
            return;
        }
        setIsListening(prevState => !prevState);
    };

    return (
        <div className="interview-page">
            <div className="interview-header">
                <div className="header-left">
                    <Link to="/" className="back-link">&larr; Back to Home</Link>
                </div>
                <div className="header-title">Software Engineer Interview</div>
                <div className="header-controls">
                    <button onClick={() => setIsTTSEnabled(!isTTSEnabled)} className="sound-toggle-icon">
                        {isTTSEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
                    </button>
                    <button onClick={toggleTheme} className="theme-toggle-icon">
                        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                    </button>
                </div>
            </div>

            <div className={`interview-workspace ${feedback || isFeedbackLoading ? 'workspace-feedback-visible' : ''}`}>
                <div className="chat-area">
                    <div className="chat-window" ref={chatWindowRef}>
                        {conversation.length === 0 && !isLoading && (
                            <div className="start-prompt">
                                <div className="welcome-icon">
                                    <ChatIcon />
                                </div>
                                <h2>Welcome to your AI Interview</h2>
                                <p className="welcome-description">
                                    You will be asked 5 questions. You can either type your answer or use the microphone to speak. At the end, you'll receive detailed feedback on your performance.
                                </p>
                                <button onClick={startInterview} className="new-interview-button">
                                  Start New Interview
                                </button>
                            </div>
                        )}
                        {conversation.map((entry, index) => (
                            <div key={index} className={`message-container ${entry.speaker === 'Interviewer' ? 'interviewer-message' : 'user-message'}`}>
                                <div className={`message-bubble ${entry.speaker === 'Interviewer' ? 'interviewer-bubble' : 'user-bubble'}`}>
                                    <strong>{entry.speaker}:</strong><br/>
                                    {entry.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && <TypingIndicator />}
                    </div>
                    
                    {!isInterviewOver && conversation.length > 0 && (
                        <form onSubmit={handleFormSubmit} className="chat-form">
                            <textarea
                                ref={inputRef}
                                className="chat-textarea"
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type or click the mic to speak..."
                                disabled={isLoading}
                            />
                            <button type="button" onClick={toggleListening} className={`mic-button ${isListening ? 'is-listening' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                                    <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                                </svg>
                            </button>
                        </form>
                    )}

                    {isInterviewOver && !feedback && ( <button onClick={getFeedback} disabled={isFeedbackLoading} className="feedback-button"> {isFeedbackLoading ? 'Analyzing...' : 'Get Feedback'} </button> )}
                    {error && <p style={{ color: 'red', marginTop: '20px' }}>Error: {error}</p>}
                </div>

                <div className="feedback-area">
                    <div className="feedback-window">
                        {isFeedbackLoading ? <FeedbackSkeleton /> : <> <h2>Your Feedback</h2> <ReactMarkdown>{feedback}</ReactMarkdown> </>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewPage;