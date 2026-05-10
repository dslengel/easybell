import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

// API Konfiguration
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const AiAdvisor = ({ isOpen, setIsOpen }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hallo! Ich bin Ihr ✨ KI-Tarifberater. Wie viele Mitarbeiter hat Ihr Unternehmen und was ist Ihnen bei der Telefonie besonders wichtig?' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const callGemini = async (userQuery) => {
        setIsTyping(true);
        const systemPrompt = `Du bist ein fachkundiger KI-Tarifberater für Dirk Büchin (IT-Consulting Saarbrücken), ein zertifizierter easybell Partner. 
        Nutze folgende Fakten für deine Beratung:
        - Dirk Büchin bietet Vor-Ort Service in Saarbrücken & Umland an.
        - Cloud PBX: Basic (0€, 5 Nebenstellen), Classic (ab 9,95€, bis 600 Nebenstellen), Pro (ab 14,95€, inkl. Analytics & Call Flow Creator).
        - SIP Trunks: Business 2 (1,95€), Business 10 (4,95€), Business 50 (19,95€). 
        - Microsoft Teams Integration (Teams Connector) für 0,50€ pro Account/Monat.
        - Office Komplett (VDSL/Glasfaser + SIP Trunk) ab 29,95€.
        - Alle Tarife sind monatlich kündbar (keine Mindestlaufzeit).
        - Sicherheit: Betrugsschutz-Garantie (max 10€ Schaden), Hosting nur in Deutschland.
        Antworte freundlich, professionell und auf Deutsch. Empfiehl immer den passendsten Tarif basierend auf den Angaben des Nutzers. Wenn es technisch wird, verweise auf ein Beratungsgespräch mit Dirk Büchin.`;

        let retries = 0;
        const delays = [1000, 2000, 4000, 8000, 16000];

        const fetchWithRetry = async () => {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userQuery }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] }
                    })
                });

                if (!response.ok) throw new Error("API Fehler");
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text;
            } catch (err) {
                if (retries < 5) {
                    await new Promise(res => setTimeout(res, delays[retries]));
                    retries++;
                    return fetchWithRetry();
                }
                throw err;
            }
        };

        try {
            const result = await fetchWithRetry();
            setMessages(prev => [...prev, { role: 'assistant', text: result || "Entschuldigung, ich konnte keine Antwort generieren." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Leider gibt es gerade ein technisches Problem. Bitte versuchen Sie es später erneut oder kontaktieren Sie Dirk Büchin direkt." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;
        
        const userMsg = inputValue.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue("");
        callGemini(userMsg);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col chat-bubble">
                    <div className="bg-blue-900 p-4 text-white flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <Icon name="bot" size={18} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">✨ KI-Tarifberater</p>
                                <p className="text-[10px] opacity-70">Experte für Dirk Büchin & easybell</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 flex space-x-1">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 border-t bg-white flex space-x-2">
                        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ihre Frage (z.B. 10 Mitarbeiter...)" className="flex-grow px-4 py-2 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        <button type="submit" disabled={isTyping} className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                            <Icon name="send" size={18} />
                        </button>
                    </form>
                </div>
            )}
            
            <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <Icon name={isOpen ? "chevron-down" : "sparkles"} size={28} />
            </button>
        </div>
    );
};

export default AiAdvisor;
