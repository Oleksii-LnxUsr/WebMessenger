import { FormControl } from "@mui/material";
import { useEffect, useState, useContext } from "react";
import AuthContext from "../../context/AuthContext";
import CustomField from "../CustomField/CustomField";
import Message from "../Message/Message";
import { getChatInfo } from "../../api/getChatInfo";
import { getChatMessages } from "../../api/getMessages";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Dropdown } from "@mui/base/Dropdown";
import { Menu } from "@mui/base/Menu";
import { MenuButton } from "@mui/base/MenuButton";
import { MenuItem } from "@mui/base/MenuItem";
import { deleteChat } from "../../api/deleteChat";
import "./Chat.css";
import { useNavigate } from "react-router-dom";

const Chat = ({ chat_id }) => {
    const [message, setMessage] = useState("");
    const [recivedMessages, setRecivedMessages] = useState([]);
    const [isWebsocketOpen, setIsWebsocketOpen] = useState(false);
    const [websocket, setWebsocket] = useState(null);
    const [chatInfo, setChatInfo] = useState({});
    const navigate = useNavigate();
    const { authTokens, logoutUser } = useContext(AuthContext);

    const apiUrl = process.env.REACT_APP_API_URL;
    console.log(recivedMessages);

    useEffect(() => {
        if (chat_id) {
            getChatInfo({
                authTokens: authTokens,
                uuid: chat_id,
                setData: setChatInfo,
                logout: logoutUser,
                navigate: navigate,
            });

            getChatMessages({
                setData: setRecivedMessages,
                uuid: chat_id,
                authTokens: authTokens,
                logout: logoutUser,
            });

            const ws = new WebSocket(
                `ws://127.0.0.1:8000/ws/chats/${chat_id}/?token=${authTokens?.access}`,
            );

            ws.onopen = () => {
                setIsWebsocketOpen(true);
                setWebsocket(ws);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log(message, "MSG99");
                setRecivedMessages((prevMessages) => [
                    ...prevMessages,
                    message,
                ]);
            };

            ws.onclose = () => {
                setIsWebsocketOpen(false);
            };

            return () => {
                ws.close();
            };
        }
        // eslint-disable-next-line
    }, [chat_id, authTokens?.access]);

    const handleMessageInput = (e) => {
        setMessage(e?.target?.value);
    };

    const sendMessage = () => {
        if (websocket && isWebsocketOpen && message.trim()) {
            websocket.send(message);
            setMessage("");
        }
    };

    const handleChatDelete = () => {
        deleteChat({
            uuid: chat_id,
            authTokens: authTokens,
            logout: logoutUser,
        });
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                        src={`${apiUrl}${chatInfo?.avatar}`}
                        alt="avatar"
                        className="chat-header-avatar"
                    />
                </div>
                <p className="chat-username">{chatInfo?.name}</p>
                <Dropdown>
                    <MenuButton className="chat-menu-btn">
                        <MoreVertIcon />
                    </MenuButton>
                    <Menu className="chat-menu">
                        <MenuItem onClick={() => handleChatDelete()}>
                            Delete chat
                        </MenuItem>
                        <MenuItem onClick={() => logoutUser()}>
                            Log out
                        </MenuItem>
                    </Menu>
                </Dropdown>
            </div>
            {/* messages */}

            <div className="chat-messages-container">
                {recivedMessages?.map((recivedMessage, index) => {
                    return (
                        <Message
                            key={index}
                            message={recivedMessage?.message}
                            sender={recivedMessage?.user_id}
                            timestamp={recivedMessage?.timestamp}
                        />
                    );
                })}
            </div>

            <div className="chat-field-container">
                <FormControl
                    fullWidth
                    onKeyPress={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                >
                    <CustomField
                        placeholder="Message"
                        value={message}
                        onChange={handleMessageInput}
                    />
                </FormControl>
            </div>
        </div>
    );
};

export default Chat;
