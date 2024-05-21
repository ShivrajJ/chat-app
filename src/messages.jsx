import React from "react";

export default function Messages({messages}) {
    console.log(messages);
    return(
        <>
            {messages.map((m, i) => {
                return(
                    <li className='message'>{m.user + ": " + m.message}</li>
                );
            })}
        </>
    );
}