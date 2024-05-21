import React from "react";

export default function ConnectionManager({isConnected, socket}) {

    function toggleConnect() {
        // alert(socket.connected);
        if(socket.connected) {
            socket.disconnect();
        } else {
            socket.connect()
        }
    }

    return(
        <>
            <button onClick={toggleConnect} className={isConnected ? 'disconnect-button' : 'connect-button'}>{isConnected ? 'disconnect' : 'connect'}</button>
        </>
    );
}