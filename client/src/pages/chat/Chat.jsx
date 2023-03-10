import axios from 'axios'
import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { UserState } from '../../Context/UserProvider';
import MyChats from '../../components/Chat/MyChats';
import './chat.css'
import ChatBox from '../../components/Chat/ChatBox';
import io from 'socket.io-client'

const Chat = () => {
    const { user } = UserState();
    const { id } = useParams();
    const navigate = useNavigate()

    const [socketConnected, setSocketConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user === null) return navigate('/')
    }, [user])

    useEffect(() => {
        if (!user) return;
        const newSocket = io.connect();


        newSocket.on('connect', () => {
            console.log('socket connected')
            newSocket.emit('authenticate', user.token)
            setSocket(newSocket);
            setSocketConnected(true)
        })

        newSocket.on('disconnect', () => {
            console.log('socket disconnected')
            setSocketConnected(false)
        })

        newSocket.on('error', (error) => {
            console.log('socket error', error)
            setSocketConnected(false)
        })
    }, [user])

    useEffect(() => {
        if (!id || !socket) return;
        socket.emit('joinChat', id)
    }, [id, socket])
    
    useEffect(() => {
        document.querySelector('.app').classList.remove('nav-active')
    }, [id])

    return (
        <>
            {user && <div className='chat-windows show'>
                <MyChats socket={socket} />
                <ChatBox chatID={id} socketConnected={socketConnected} socket={socket} />
            </div>}
        </>
    )
}

export default Chat;
