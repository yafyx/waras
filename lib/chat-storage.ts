import { Message } from "ai";
import { toast } from "sonner";

// Central interface for a chat
export interface ChatInfo {
    id: string;
    messages: Message[];
    firstMessage?: string;
    timestamp?: string;
}

/**
 * Save chat messages to localStorage with error handling
 */
export function saveChatToLocalStorage(id: string, messages: Message[]): boolean {
    try {
        if (!id || !messages) {
            console.error("Invalid chat data to save");
            return false;
        }

        // Find the timestamp from the latest message or use current time
        const timestamp = messages.length > 0 && messages[messages.length - 1].createdAt
            ? (typeof messages[messages.length - 1].createdAt === 'string'
                ? messages[messages.length - 1].createdAt
                : new Date().toISOString())
            : new Date().toISOString();

        localStorage.setItem(
            `chat-${id}`,
            JSON.stringify({
                id,
                messages,
                timestamp
            })
        );

        // Trigger refresh of the chat list
        window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
        return true;
    } catch (e) {
        console.error("Failed to save chat:", e);
        // If it's a quota error, show a friendly message
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
            toast?.("Storage quota exceeded. Try deleting some old chats.");
        } else {
            toast?.("Failed to save chat");
        }
        return false;
    }
}

/**
 * Load chat messages from localStorage with error handling
 */
export function loadChatFromLocalStorage(id: string): Message[] {
    if (!id) return [];

    try {
        const data = localStorage.getItem(`chat-${id}`);
        if (!data) return [];

        const parsedData = JSON.parse(data);
        return parsedData.messages || [];
    } catch (e) {
        console.error(`Error loading chat ${id}:`, e);
        toast?.("Failed to load chat");
        return [];
    }
}

/**
 * Get all chats from localStorage with proper sorting and error handling
 */
export function getAllChatsFromLocalStorage(): ChatInfo[] {
    try {
        // Get all chat keys from localStorage
        const chatKeys = Object.keys(localStorage).filter((key) =>
            key.startsWith("chat-")
        );

        // Extract and parse chat data
        const chatData = chatKeys
            .map((key) => {
                const id = key.replace("chat-", "");
                try {
                    const data = JSON.parse(localStorage.getItem(key) || "{}");
                    const messages = data.messages || [];
                    const firstUserMessage = messages.find(
                        (m: Message) => m.role === "user"
                    )?.content || "New Chat";

                    const timestamp = data.timestamp ||
                        (messages.length > 0 && messages[messages.length - 1].createdAt
                            ? (typeof messages[messages.length - 1].createdAt === 'string'
                                ? messages[messages.length - 1].createdAt
                                : new Date().toISOString())
                            : new Date().toISOString());

                    return {
                        id,
                        messages,
                        firstMessage: firstUserMessage.substring(0, 30) +
                            (firstUserMessage.length > 30 ? "..." : ""),
                        timestamp
                    };
                } catch (e) {
                    console.error(`Error parsing chat ${id}:`, e);
                    return null;
                }
            })
            .filter(Boolean) as ChatInfo[];

        // Sort by timestamp (newest first)
        return chatData.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB.getTime() - dateA.getTime();
        });
    } catch (error) {
        console.error("Error loading chat list:", error);
        return [];
    }
}

/**
 * Delete a chat from localStorage
 */
export function deleteChatFromLocalStorage(id: string): boolean {
    try {
        localStorage.removeItem(`chat-${id}`);
        // Trigger refresh of the chat list
        window.dispatchEvent(new CustomEvent("waras:refreshChatList"));
        return true;
    } catch (e) {
        console.error(`Error deleting chat ${id}:`, e);
        toast?.("Failed to delete chat");
        return false;
    }
}

/**
 * Create a new empty chat in localStorage
 */
export function createNewChatInLocalStorage(id: string): boolean {
    return saveChatToLocalStorage(id, []);
}

/**
 * Check if storage is available and working
 */
export function isStorageAvailable(): boolean {
    try {
        const testKey = "__storage_test__";
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
} 